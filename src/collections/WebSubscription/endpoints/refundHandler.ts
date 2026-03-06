import { PayloadHandler } from 'payload'
import { stripe } from '@/lib/stripe'

export const refundHandler: PayloadHandler = async (req) => {
    const { payload, user, query } = req
    const { id } = (req.routeParams || {}) as { id: string }
    const reason = query?.reason as string || ''

    if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (!id) {
        return Response.json({ error: 'Order ID is required' }, { status: 400 })
    }

    try {
        // 1. Fetch the order
        const order: any = await payload.findByID({
            collection: 'web-subscription',
            id,
            depth: 0,
        }).catch(() => null)

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.user !== user.id) {
            return Response.json({ error: 'You are not authorized to refund this order' }, { status: 403 })
        }

        if (order.subsStatus === 'active' && order.paymentStatus === 'completed') {
            if (!order.stripeData?.subscriptionId) {
                return Response.json({ error: 'No Stripe subscription ID found on this order' }, { status: 400 })
            }

            try {
                // 1. Cancel the Stripe subscription immediately (not at period end)
                await stripe.subscriptions.cancel(order.stripeData.subscriptionId)
                console.log(`[RefundHandler] Stripe subscription ${order.stripeData.subscriptionId} cancelled immediately`)

                // 2. Refund the last payment intent if available
                if (order.stripeData?.paymentIntentId) {
                    const refund = await stripe.refunds.create({
                        payment_intent: order.stripeData.paymentIntentId,
                    })
                    console.log(`[RefundHandler] Refund created: ${refund.id}`)

                    // Update status immediately (webhook will also confirm this)
                    await payload.update({
                        collection: 'web-subscription',
                        id,
                        data: {
                            subsStatus: 'cancelled',
                            cancelReason: reason,
                        },
                        overrideAccess: true,
                    })

                    return Response.json({ success: true, message: 'Subscription cancelled and payment refund initiated', refundId: refund.id }, { status: 200 })
                }

                // No payment to refund — still update status
                await payload.update({
                    collection: 'web-subscription',
                    id,
                    data: {
                        subsStatus: 'cancelled',
                        cancelReason: reason,
                    },
                    overrideAccess: true,
                })

                return Response.json({ success: true, message: 'Subscription cancelled (no payment to refund)' }, { status: 200 })

            } catch (err: any) {
                console.error('[RefundHandler] Stripe error:', err.message)
                throw new Error(`Stripe operation failed: ${err.message}`)
            }

        }

        return Response.json({ success: false, message: 'Order Cannot be refunded' }, { status: 400 })


    } catch (error: any) {
        console.error('[RefundHandler] Error:', error)
        return Response.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}