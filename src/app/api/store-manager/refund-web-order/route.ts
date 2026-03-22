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
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
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

    // Attempt Stripe refund if a paymentIntentId is present
    const paymentIntentId = order.stripeData?.paymentIntentId
    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        })
      } catch (stripeErr: any) {
        console.error('[refund-web-order] Stripe refund error:', stripeErr)
        return NextResponse.json(
          { error: `Stripe refund failed: ${stripeErr.message}` },
          { status: 500 },
        )
      }
    }

    // Update order status
    const updated = await payload.update({
      collection: 'web-orders',
      id: orderId,
      data: {
        paymentStatus: 'refund-initiated',
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

    return NextResponse.json({ success: true, order: updated })
  } catch (err: any) {
    console.error('[refund-web-order] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
