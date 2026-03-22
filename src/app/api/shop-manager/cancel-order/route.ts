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

    if (
      order.paymentStatus === 'refunded' ||
      order.paymentStatus === 'refund-initiated'
    ) {
      return NextResponse.json({ error: 'Order is already refunded or refund in progress' }, { status: 400 })
    }

    // Attempt Stripe refund if order was paid
    const paymentIntentId = order.stripeData?.paymentIntentId
    if (order.paymentStatus === 'paid' && paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId })
      } catch (stripeErr: any) {
        console.error('[cancel-order] Stripe refund error:', stripeErr)
        return NextResponse.json(
          { error: `Stripe refund failed: ${stripeErr.message}` },
          { status: 500 },
        )
      }
    }

    const cancelField = order.orderType === 'dine-in' ? 'appOrderStatusDine' : 'appOrderStatus'
    const isPending = order.orderAcceptance === 'pending'

    const updated = await payload.update({
      collection: 'app-orders',
      id: orderId,
      data: {
        // Pending orders get rejected; accepted orders get cancelled
        ...(isPending
          ? { orderAcceptance: 'rejected' }
          : { [cancelField]: 'cancelled' }),
        ...(order.paymentStatus === 'paid' && paymentIntentId
          ? { paymentStatus: 'refund-initiated', refundReason: reason || 'Manager action' }
          : {}),
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
