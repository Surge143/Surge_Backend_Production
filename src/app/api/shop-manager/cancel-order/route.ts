import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { stripe } from '@/lib/stripe'
import { emitOrderUpdated } from '@/utilities/socket'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { orderId, reason } = body

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const order = await payload.findByID({
      collection: 'app-orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    }) as any

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // A shop-manager may only act on their own shop's orders — without this,
    // any shop-manager account could cancel/refund any other shop's orders.
    if ((user as any).role === 'shop-manager') {
      const managedShops = await payload.find({
        collection: 'shop',
        where: { shopManager: { equals: user.id } },
        limit: 1,
        depth: 0,
      })
      const managedShopId = managedShops.docs[0]?.id
      const orderShopId = typeof order.shop === 'object' ? order.shop?.id : order.shop
      if (!managedShopId || String(orderShopId) !== String(managedShopId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (
      order.paymentStatus === 'refunded' ||
      order.paymentStatus === 'refund-initiated'
    ) {
      return NextResponse.json({ error: 'Order is already refunded or refund in progress' }, { status: 400 })
    }

    // Attempt Stripe refund if order was paid
    const paymentIntentId = order.stripeData?.paymentIntentId
    let stripeRefundSucceeded = false
    let stripeRefundFailed = false

    if (order.paymentStatus === 'paid' && paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId })
        stripeRefundSucceeded = true
      } catch (stripeErr: any) {
        console.error('[cancel-order] Stripe refund error:', stripeErr)
        stripeRefundFailed = true
        // Don't block the cancellation — order will be cancelled with refund-failed status
      }
    }

    const cancelField = order.orderType === 'dine-in' ? 'appOrderStatusDine' : 'appOrderStatus'
    const isPending = order.orderAcceptance === 'pending'

    const paymentStatusUpdate: Record<string, unknown> =
      order.paymentStatus === 'paid' && paymentIntentId
        ? stripeRefundFailed
          ? { paymentStatus: 'failed', refundReason: reason || 'Manager action' }
          : { paymentStatus: 'refund-initiated', refundReason: reason || 'Manager action' }
        : {}

    const updated = await payload.update({
      collection: 'app-orders',
      id: orderId,
      data: {
        // Pending orders get rejected; accepted orders get cancelled
        ...(isPending
          ? { orderAcceptance: 'rejected' }
          : { [cancelField]: 'cancelled' }),
        ...paymentStatusUpdate,
      },
      depth: 3,
      overrideAccess: true,
    })

    emitOrderUpdated(updated)

    return NextResponse.json({ success: true, order: updated })
  } catch (err: any) {
    console.error('[cancel-order] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
