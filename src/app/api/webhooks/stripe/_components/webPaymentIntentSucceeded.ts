import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from '@/lib/emailConfig'
import { OrderConfirmEmail } from '@/lib/emailTemplates/StoreOrderConfirm'
import { deductWTCoins } from '@/utilities/wtCoins'
import { sql } from '@payloadcms/db-postgres'

export async function handleWebPaymentIntentSucceeded(paymentIntent: any) {
  const payload = await getPayload({ config })

  const orderId = paymentIntent.metadata.db_order_id

  if (!orderId) {
    console.error('No order ID found in metadata')
    return
  }

  let order: any
  try {
    order = await payload.findByID({
      collection: 'web-orders',
      id: orderId,
      depth: 0, // depth:0 is sufficient — all needed values are direct fields or IDs
      overrideAccess: true,
    })

    if (!order) {
      console.error('Order not found')
      return
    }

    // --- IDEMPOTENCY GUARD ---
    // Stripe only guarantees at-least-once delivery (retries, dashboard "resend").
    // Without this, a redelivered event would deduct WTCoins and stock a second
    // time for one real payment.
    if (order.paymentStatus === 'completed') {
      console.log(`⏭️  Order ${orderId} already marked completed — skipping duplicate webhook processing`)
      return
    }

    // --- WTCOINS MANAGEMENT ---
    // Handle WTCoins deduction only (awarding happens when order is shipped)
    if (order.user) {
      const userId = typeof order.user === 'object' ? order.user.id : order.user

      try {
        // DEDUCT WTCOINS IF USED
        if (order.pointsUsed && order.pointsUsed > 0) {
          await deductWTCoins(payload, userId, order.pointsUsed, orderId, 'web-orders')
        }
      } catch (error) {
        console.error('Error managing WTCoins:', error)
      }
    }

    // --- CLEAR USER CART ---
    // Clear the cart after successful payment
    if (order.user) {
      const userId = typeof order.user === 'object' ? order.user.id : order.user

      try {
        await clearUserCart(payload, userId)
      } catch (error) {
        console.error('Error clearing cart:', error)
      }
    }

    // --- STOCK DEDUCTION ---
    // Deduct stock for all items in parallel to avoid sequential DB blocking
    if (order.items && order.items.length > 0) {
      await Promise.all(order.items.map(async (item: any) => {
        try {
          const productId = typeof item.product === 'object' ? item.product.id : item.product
          const variantId = item.variantID
          const quantity = item.quantity

          // Only reading this to know whether the product uses variants — the
          // actual stock number itself is never read-then-written here, since
          // that pattern is exactly what let two concurrent payments both read
          // the same stale stock and silently corrupt the final count (or, on
          // the last unit, oversell it). The two UPDATEs below do the read AND
          // write as a single atomic database statement instead.
          const productDoc = await payload.findByID({
            collection: 'web-products',
            id: productId,
            overrideAccess: true,
            depth: 0,
            select: { hasVariantOptions: true } as any,
          })

          if (!productDoc) {
            console.error(`Product ${productId} not found`)
            return
          }

          if (productDoc.hasVariantOptions && variantId) {
            const result: any = await payload.db.execute({
              sql: sql`
              UPDATE web_products_variants
              SET variant_stock_quantity = GREATEST(variant_stock_quantity - ${quantity}, 0),
                  variant_in_stock = CASE WHEN variant_stock_quantity - ${quantity} <= 0 THEN false ELSE variant_in_stock END
              WHERE id = ${variantId} AND _parent_id = ${productId}
              RETURNING variant_stock_quantity
            `,
            })
            if (result.rows?.length > 0) {
              console.log(`✅ Stock updated for product ${productId}, variant ${variantId} → ${result.rows[0].variant_stock_quantity}`)
            } else {
              console.error(`Variant ${variantId} not found in product ${productId}`)
            }
          } else {
            const result: any = await payload.db.execute({
              sql: sql`
              UPDATE web_products
              SET stock_quantity = GREATEST(stock_quantity - ${quantity}, 0),
                  in_stock = CASE WHEN stock_quantity - ${quantity} <= 0 THEN false ELSE in_stock END
              WHERE id = ${productId}
              RETURNING stock_quantity
            `,
            })
            if (result.rows?.length > 0) {
              console.log(`✅ Stock updated for product ${productId} (no variants) → ${result.rows[0].stock_quantity}`)
            } else {
              console.error(`Product ${productId} not found for stock update`)
            }
          }
        } catch (error) {
          console.error(`Error updating stock for item:`, error)
        }
      }))
    }

    // --- UPDATE ORDER STATUS AND PAYMENT DETAILS ---
    try {
      // Extract payment details from PaymentIntent
      const chargeId = paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id
      const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url

      const updatedOrder = await payload.update({
        collection: 'web-orders',
        id: orderId,
        data: {
          paymentStatus: 'completed',
          deliveryStatus: 'placed', // Set initial delivery status when payment completes
          stripeOrderId: paymentIntent.id,
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
      console.log(`✅ Order ${orderId} marked as completed with payment details`)

      // --- INCREMENT COUPON USAGE COUNT ---
      // Previously never incremented for website orders (only for cafe/app orders),
      // so a coupon's total usage cap silently never applied on the website.
      if (order.couponCode) {
        const couponId = typeof order.couponCode === 'object' ? order.couponCode.id : order.couponCode
        try {
          const couponDoc = await payload.findByID({
            collection: 'surge-coupon',
            id: couponId,
            overrideAccess: true,
            depth: 0,
          })
          await payload.update({
            collection: 'surge-coupon',
            id: couponId,
            data: { usageCount: (couponDoc.usageCount || 0) + 1 },
            overrideAccess: true,
          })
          console.log(`✅ Coupon ${couponId} usageCount incremented for order ${orderId}`)
        } catch (error) {
          console.error(`Failed to increment usageCount for coupon ${couponId} on order ${orderId}:`, error)
        }
      }

      // --- DIRECT SOCKET EMIT (belt-and-suspenders alongside afterChange hook) ---
      try {
        const { emitWebOrderCreated } = await import('@/utilities/socket')
        emitWebOrderCreated(updatedOrder)
      } catch (socketErr) {
        console.error('[Socket] Failed to emit web-order-created from webhook handler:', socketErr)
      }

      // Send order confirmation email
      try {
        // Re-fetch with depth:2 so product images are populated for the email template
        const orderForEmail = await payload.findByID({
          collection: 'web-orders',
          id: orderId,
          depth: 2,
          overrideAccess: true,
        })

        // Customer email
        const userEmail =
          typeof order.user === 'object' && order.user?.email
            ? order.user.email
            : order.email || order.billingAddress?.email || order.shippingAddress?.email

        if (userEmail) {
          const userName = order.billingAddress?.addressFirstName || 'Customer'
          await sendEmail({
            to: userEmail,
            subject: 'Order Confirmation - Surge',
            body: `Hi ${userName},

Thank you for your order! Your order #${orderId} has been confirmed.

Order Total: AED ${order.financials.total.toFixed(2)}

We'll send you another email when your order ships.

Happy brewing,
Team Surge`.trim(),
            html: OrderConfirmEmail(orderForEmail),
          })
          console.log(`✅ Order confirmation email sent to ${userEmail}`)
        } else {
          console.warn(`⚠️ No email found for order ${orderId}, skipping confirmation email`)
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
                subject: `New Store Order #${orderId} - AED ${order.financials.total.toFixed(2)}`,
                html: OrderConfirmEmail(orderForEmail),
              }),
            ),
          )
          console.log(`✅ Admin order notification sent to ${adminEmails.length} recipient(s)`)
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send order confirmation email:', emailError)
        // Don't throw - email failure shouldn't break the webhook
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  } catch (error) {
    console.error('Error fetching order in Payment Intent Webhook:', error)
    throw error
  }
}

/**
 * Clear user's cart after successful payment
 */
async function clearUserCart(payload: any, userId: string | number) {
  try {
    // Find user's cart
    const cartResult = await payload.find({
      collection: 'web-cart',
      where: { user: { equals: userId } },
      overrideAccess: true,
    })

    if (cartResult.docs.length > 0) {
      const cart = cartResult.docs[0]

      // Clear all items from the cart
      await payload.update({
        collection: 'web-cart',
        id: cart.id,
        data: {
          items: [],
        },
        overrideAccess: true,
      })

      console.log(`✅ Cleared cart for user ${userId}`)
    }
  } catch (error) {
    console.error('Error clearing user cart:', error)
    throw error
  }
}
