import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from '@/lib/emailConfig'
import { OrderConfirmEmail } from '@/lib/emailTemplates/StoreOrderConfirm'
import { deductWTCoins } from '@/utilities/wtCoins'

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

          const productDoc = await payload.findByID({
            collection: 'web-products',
            id: productId,
            overrideAccess: true,
          })

          if (!productDoc) {
            console.error(`Product ${productId} not found`)
            return
          }

          if (productDoc.hasVariantOptions && productDoc.variants && Array.isArray(productDoc.variants)) {
            const variantIndex = productDoc.variants.findIndex((v: any) => v.id === variantId)

            if (variantIndex !== -1) {
              const variant = productDoc.variants[variantIndex]
              const currentStock = variant.variantStockQuantity || 0
              const newStock = Math.max(0, currentStock - quantity)

              productDoc.variants[variantIndex].variantStockQuantity = newStock
              if (newStock === 0) {
                productDoc.variants[variantIndex].variantInStock = false
              }

              await payload.update({
                collection: 'web-products',
                id: productId,
                data: { variants: productDoc.variants },
                overrideAccess: true,
              })

              console.log(`✅ Stock updated for product ${productId}, variant ${variantId}: ${currentStock} → ${newStock}`)
            } else {
              console.error(`Variant ${variantId} not found in product ${productId}`)
            }
          } else {
            const currentStock = productDoc.stockQuantity || 0
            const newStock = Math.max(0, currentStock - quantity)

            await payload.update({
              collection: 'web-products',
              id: productId,
              data: {
                stockQuantity: newStock,
                ...(newStock === 0 && { inStock: false }),
              },
              overrideAccess: true,
            })

            console.log(`✅ Stock updated for product ${productId} (no variants): ${currentStock} → ${newStock}`)
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

      // --- GUEST-TO-USER LINKING (inline, same atomic update) ---
      // If the order is a guest order but the email matches an existing user account,
      // link them HERE in the same update call — not in afterChange.
      // Doing it in afterChange causes a nested secondary payload.update() on the same
      // document which races with or conflicts with this primary update.
      let linkedUserId: string | number | null = null
      let linkedCustomerType: string | null = null
      if (!order.user && order.email) {
        try {
          const userResult = await payload.find({
            collection: 'users',
            where: { email: { equals: order.email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          if (userResult.docs.length > 0) {
            linkedUserId = userResult.docs[0].id
            linkedCustomerType = 'user'
            console.log(`✅ [webhook] Will link order ${orderId} to user ${linkedUserId} in same update`)
          }
        } catch (linkErr) {
          console.error('[webhook] Error resolving user for guest order:', linkErr)
        }
      }

      const updatedOrder = await payload.update({
        collection: 'web-orders',
        id: orderId,
        data: {
          paymentStatus: 'completed',
          deliveryStatus: 'placed', // Set initial delivery status when payment completes
          stripeOrderId: paymentIntent.id,
          ...(linkedUserId ? { user: linkedUserId, customerType: linkedCustomerType } : {}),
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

      // --- DIRECT SOCKET EMIT (belt-and-suspenders alongside afterChange hook) ---
      try {
        const { emitWebOrderCreated } = await import('@/utilities/socket')
        emitWebOrderCreated(updatedOrder)
      } catch (socketErr) {
        console.error('[Socket] Failed to emit web-order-created from webhook handler:', socketErr)
      }

      // Send order confirmation email
      try {
        // Extract user email from order
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
            html: OrderConfirmEmail(order),
          })

          console.log(`✅ Order confirmation email sent to ${userEmail}`)
        } else {
          console.warn(`⚠️ No email found for order ${orderId}, skipping confirmation email`)
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
