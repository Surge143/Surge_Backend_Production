import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitWebOrderUpdated } from '@/utilities/socket'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Verify the user is logged in
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { orderId, reason } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Fetch the order
    const order = await payload.findByID({
      collection: 'web-orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    }) as any

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check order is not already refunded
    if (
      order.paymentStatus === 'refunded' ||
      order.paymentStatus === 'refund-initiated' ||
      order.deliveryStatus === 'refunded'
    ) {
      return NextResponse.json({ error: 'Order is already refunded or refund in progress' }, { status: 400 })
    }

    // Attempt Stripe refund if a paymentIntentId is present — failure does NOT block the update
    let stripeRefundFailed = false
    const paymentIntentId = order.stripeData?.paymentIntentId
    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        })
      } catch (stripeErr: any) {
        console.error('[refund-web-order] Stripe refund error (non-blocking):', stripeErr)
        stripeRefundFailed = true
      }
    }

    // --- RESTORE STOCK ---
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        try {
          const productId = typeof item.product === 'object' ? item.product.id : item.product
          const variantId = item.variantID
          const quantity = item.quantity || 1

          const productDoc: any = await payload.findByID({
            collection: 'web-products',
            id: productId,
            overrideAccess: true,
          })

          if (!productDoc) {
            console.warn(`[refund-web-order] Product ${productId} not found, skipping stock restore`)
            continue
          }

          if (productDoc.hasVariantOptions && productDoc.variants && Array.isArray(productDoc.variants)) {
            const variantIndex = productDoc.variants.findIndex((v: any) => v.id === variantId)

            if (variantIndex !== -1) {
              const currentStock = productDoc.variants[variantIndex].variantStockQuantity || 0
              const restoredStock = currentStock + quantity

              productDoc.variants[variantIndex].variantStockQuantity = restoredStock
              if (restoredStock > 0) {
                productDoc.variants[variantIndex].variantInStock = true
              }

              await payload.update({
                collection: 'web-products',
                id: productId,
                data: { variants: productDoc.variants },
                overrideAccess: true,
              })

              console.log(`✅ [refund-web-order] Variant stock restored for product ${productId}, variant ${variantId}: ${currentStock} → ${restoredStock}`)
            } else {
              console.warn(`[refund-web-order] Variant ${variantId} not found in product ${productId}`)
            }
          } else {
            const currentStock = productDoc.stockQuantity || 0
            const restoredStock = currentStock + quantity

            await payload.update({
              collection: 'web-products',
              id: productId,
              data: {
                stockQuantity: restoredStock,
                ...(restoredStock > 0 && { inStock: true }),
              },
              overrideAccess: true,
            })

            console.log(`✅ [refund-web-order] Base stock restored for product ${productId}: ${currentStock} → ${restoredStock}`)
          }
        } catch (stockErr) {
          console.error(`[refund-web-order] Error restoring stock for item:`, stockErr)
        }
      }
    }

    // Update order status — always save refundReason regardless of Stripe result
    const updated = await payload.update({
      collection: 'web-orders',
      id: orderId,
      data: {
        paymentStatus: stripeRefundFailed ? 'failed' : 'refund-initiated',
        deliveryStatus: 'cancelled',
        refundReason: reason || 'Manager action',
        refundedOn: new Date().toISOString(),
        refundedAmount: order.financials?.total ?? 0,
      } as any,
      depth: 2,
      overrideAccess: true,
    })

    // Emit real-time update
    emitWebOrderUpdated(updated)

    return NextResponse.json({ success: true, order: updated, stripeRefundFailed })
  } catch (err: any) {
    console.error('[refund-web-order] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
