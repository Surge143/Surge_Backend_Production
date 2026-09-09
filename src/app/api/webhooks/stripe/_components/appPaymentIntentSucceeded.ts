import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from '@/lib/emailConfig'
import { CafeOrderConfirmationEmail } from '@/lib/emailTemplates/CafeOrderConfirmation'
import { deductWTCoins } from '@/utilities/wtCoins'
import { sql } from '@payloadcms/db-postgres'

export async function handleAppPaymentIntentSucceeded(paymentIntent: any) {
  console.log('🏁 Starting handleAppPaymentIntentSucceeded for:', paymentIntent.id)
  const payload = await getPayload({ config })

  let orderId = paymentIntent.metadata.db_order_id
  console.log('📦 Order ID from metadata:', orderId)

  if (!orderId) {
    console.error('❌ No order ID found in metadata for PI:', paymentIntent.id)
    return
  }

  // Convert to number if it's a numeric string
  if (typeof orderId === 'string' && !isNaN(Number(orderId))) {
    orderId = Number(orderId)
    console.log('🔄 Converted orderId to number:', orderId)
  }

  let order: any
  try {
    console.log('🔍 Searching for order in app-orders with ID:', orderId)
    order = await payload.findByID({
      collection: 'app-orders',
      id: orderId,
      depth: 2,
      overrideAccess: true,
    })

    if (!order) {
      console.error('❌ Order not found in database for ID:', orderId)
      return
    }
    console.log('✅ Order found:', order.id, 'Current Payment Status:', order.paymentStatus)

    // --- WTCOINS MANAGEMENT ---
    if (order.user) {
      const userId = typeof order.user === 'object' ? order.user.id : order.user
      console.log('🪙 Checking rewards for user:', userId)

      // DEDUCT WTCOINS IF USED (coinsUsed in AppOrders)
      if (order.coinsUsed && order.coinsUsed > 0) {
        try {
          console.log(`📉 Deducting ${order.coinsUsed} WTCoins for order ${orderId}`)
          await deductWTCoins(payload, userId, order.coinsUsed, orderId, 'app-orders')
        } catch (error) {
          console.error(`❌ Failed to deduct WTCoins for order ${orderId}:`, error)
        }
      } else {
        console.log('⏭️ No WTCoins to deduct')
      }

      // DEDUCT STAMP REWARDS IF USED (stampRewards in AppOrders)
      if (
        order.stampRewards &&
        Array.isArray(order.stampRewards) &&
        order.stampRewards.length > 0
      ) {
        try {
          console.log(
            `📉 Deducting ${order.stampRewards.length} stamp rewards for order ${orderId}`,
          )
          await deductStampRewards(payload, userId, order.stampRewards.length, orderId)
        } catch (error) {
          console.error(`❌ Failed to deduct stamp rewards for order ${orderId}:`, error)
        }
      } else {
        console.log('⏭️ No stamp rewards to deduct')
      }
    }

    // --- CLEAR USER CART ---
    if (order.user) {
      const userId = typeof order.user === 'object' ? order.user.id : order.user

      try {
        console.log('🛒 Clearing app-cart for user:', userId)
        await clearUserCart(payload, userId)
      } catch (error) {
        console.error('❌ Error clearing cart:', error)
      }
    }

    // --- STOCK DEDUCTION (Paid Items + Free Reward Items) ---
    const allItemsToDeduct: { productId: string | number; quantity: number }[] = []

    // Add regular order items
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const productId = typeof item.product === 'object' ? item.product.id : item.product
        allItemsToDeduct.push({ productId, quantity: item.quantity || 1 })
      })
    }

    // Add stamp reward items (quantity is always 1 per reward item)
    if (order.stampRewards && Array.isArray(order.stampRewards)) {
      order.stampRewards.forEach((reward: any) => {
        const productId = typeof reward === 'object' ? reward.id : reward
        allItemsToDeduct.push({ productId, quantity: 1 })
      })
    }

    if (allItemsToDeduct.length > 0) {
      console.log(`📦 Deducting stock for ${allItemsToDeduct.length} line items`)
      for (const { productId, quantity } of allItemsToDeduct) {
        try {
          // Single atomic UPDATE instead of read-then-write — two near-simultaneous
          // orders for the same item can no longer both read the same stale stock
          // number and silently corrupt the final count (or oversell the last unit).
          const result: any = await payload.db.execute({
            sql: sql`
            UPDATE shop_menu
            SET stock_count = GREATEST(stock_count - ${quantity}, 0),
                in_stock = CASE WHEN stock_count - ${quantity} <= 0 THEN false ELSE in_stock END
            WHERE id = ${productId}
            RETURNING stock_count
          `,
          })

          if (result.rows?.length > 0) {
            console.log(`✅ Stock updated for shop-menu ${productId} → ${result.rows[0].stock_count}`)
          } else {
            console.error(`❌ Shop item ${productId} not found for stock update`)
          }
        } catch (error) {
          console.error(`❌ Error updating stock for shop item ${productId}:`, error)
        }
      }
    }

    // --- UPDATE ORDER STATUS AND PAYMENT DETAILS ---
    try {
      console.log(`📝 Updating order ${orderId} paymentStatus to "paid"`)
      const chargeId = paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id
      const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url

      console.log(`ℹ️ Charge ID: ${chargeId}, Receipt URL: ${receiptUrl}`)

      const updatedOrder = await payload.update({
        collection: 'app-orders',
        id: orderId,
        data: {
          paymentStatus: 'paid',
          stripeData: {
            paymentIntentId: paymentIntent.id,
            chargeId: chargeId,
            customerId: paymentIntent.customer,
            receiptUrl: receiptUrl,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method,
            status: paymentIntent.status,
            created: paymentIntent.created,
          },
        },
        overrideAccess: true,
      })
      console.log(`✅ Order ${orderId} successfully marked as paid`)

      // --- INCREMENT COUPON USAGE COUNT ---
      if (order.isCouponUsed && order.coupon) {
        const couponId = typeof order.coupon === 'object' ? order.coupon.id : order.coupon
        try {
          // Atomic UPDATE instead of read-then-write — two orders using the same
          // coupon and paid at nearly the same instant can no longer both read
          // the same stale usageCount and silently undercount it, letting the
          // coupon be used more times than its total usage limit allows.
          await payload.db.execute({
            sql: sql`UPDATE surge_shop_coupon SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ${couponId}`,
          })
          console.log(`✅ Coupon ${couponId} usageCount incremented for order ${orderId}`)
        } catch (error) {
          console.error(`❌ Failed to increment usageCount for coupon ${couponId} on order ${orderId}:`, error)
        }
      }

      // --- DIRECT SOCKET EMIT (belt-and-suspenders alongside afterChange hook) ---
      try {
        const { emitOrderCreated } = await import('@/utilities/socket')
        emitOrderCreated(updatedOrder)
      } catch (socketErr) {
        console.error('[Socket] Failed to emit order-created from webhook handler:', socketErr)
      }

      // Send order confirmation email
      try {
        const userEmail = typeof order.user === 'object' && order.user?.email
          ? order.user.email
          : order.email || null
        if (userEmail) {
          console.log('📧 Sending confirmation email to:', userEmail)
          const userName = (order.user as any)?.firstName || 'Coffee Lover'

          await sendEmail({
            to: userEmail,
            subject: 'Order Confirmation - Surge',
            body: `Hi ${userName},

Thank you for your cafe order! Your order #${orderId} has been confirmed.

We're starting to prepare your order. You can track its status in the app.

Happy brewing,
Team Surge`.trim(),
            html: CafeOrderConfirmationEmail(order),
          })
          console.log(`✅ App order confirmation email sent to ${userEmail}`)
        } else {
          console.warn(`⚠️ No email found for app order ${orderId}, skipping confirmation email`)
        }

        // Admin notification emails
        const settings = await payload.findGlobal({ slug: 'ship-and-tax', overrideAccess: true })
        const adminEmails = ((settings as any)?.orderNotificationEmails || [])
          .map((e: any) => e.email)
          .filter(Boolean)

        if (adminEmails.length > 0) {
          await Promise.all(
            adminEmails.map((adminEmail: string) =>
              sendEmail({
                to: adminEmail,
                subject: `New Cafe Order #${orderId} - AED ${order.financials.total.toFixed(2)}`,
                html: CafeOrderConfirmationEmail(order),
              }),
            ),
          )
          console.log(`✅ Admin order notification sent to ${adminEmails.length} recipient(s)`)
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send order confirmation email:', emailError)
      }
    } catch (error) {
      console.error('❌ Error updating order status/details:', error)
      throw error // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('❌ Critical failure in handleAppPaymentIntentSucceeded:', error)
    throw error // Re-throw so route.ts logs the stack trace
  }
}

async function deductStampRewards(
  payload: any,
  userId: string | number,
  rewardsUsed: number,
  orderId: string | number,
) {
  // Serialize concurrent deductions for the SAME user — two orders paid at
  // nearly the same instant (e.g. a double-tapped checkout creating two
  // orders before either payment confirms) previously could both read the
  // same starting reward balance before either wrote back, letting the same
  // stamp reward be redeemed twice. A deduction for a DIFFERENT user is
  // completely unaffected. Mirrors deductWTCoins' locking in this same file.
  const transactionID = await payload.db.beginTransaction()
  const txReq = transactionID ? ({ transactionID } as any) : undefined
  let committed = false

  try {
    if (transactionID) {
      const tx = payload.db.sessions?.[String(transactionID)]?.db as any
      await payload.db.execute({ db: tx, sql: sql`SELECT pg_advisory_xact_lock(${Number(userId)})` })
    }

    const stampResult = await payload.find({
      collection: 'surge-stamps',
      where: { user: { equals: userId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req: txReq,
    })

    if (stampResult.docs.length === 0) {
      console.error(`[deductStampRewards] No WTStamps record found for user ${userId}`)
      return
    }

    const userStamps = stampResult.docs[0]
    const currentRewardBalance = userStamps.stampReward || 0
    const newRewardBalance = Math.max(0, currentRewardBalance - rewardsUsed)

    await payload.update({
      collection: 'surge-stamps',
      id: userStamps.id,
      data: {
        stampReward: newRewardBalance,
        stampsRedemptionHistory: [
          ...(userStamps.stampsRedemptionHistory || []),
          {
            redeemedStamps: rewardsUsed,
            associatedOrder: {
              relationTo: 'app-orders',
              value: orderId,
            },
          },
        ],
      },
      overrideAccess: true,
      req: txReq,
    })

    if (transactionID) {
      await payload.db.commitTransaction(transactionID)
      committed = true
    }

    console.log(
      `✅ Deducted ${rewardsUsed} Stamp Rewards from user ${userId}. New balance: ${newRewardBalance}`,
    )
  } catch (error) {
    console.error('Error deducting Stamp Rewards:', error)
    throw error
  } finally {
    if (transactionID && !committed) {
      await payload.db.rollbackTransaction(transactionID).catch(() => {})
    }
  }
}

async function clearUserCart(payload: any, userId: string | number) {
  try {
    const cartResult = await payload.find({
      collection: 'app-cart',
      where: { user: { equals: userId } },
      overrideAccess: true,
    })

    if (cartResult.docs.length > 0) {
      const cart = cartResult.docs[0]
      await payload.update({
        collection: 'app-cart',
        id: cart.id,
        data: {
          items: [],
          shop: null,
        },
        overrideAccess: true,
      })
      console.log(`✅ Cleared app-cart for user ${userId}`)
    }
  } catch (error) {
    console.error('Error clearing user app-cart:', error)
    throw error
  }
}
