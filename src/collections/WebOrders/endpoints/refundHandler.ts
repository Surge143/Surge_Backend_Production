import { PayloadHandler } from 'payload'
import { stripe } from '@/lib/stripe'

export const refundHandler: PayloadHandler = async (req) => {
    const { payload, user, query } = req
    const { id } = (req.routeParams || {}) as { id: string }
    const reason = query?.reason as string || ''
    const guestToken = query?.token as string || req.headers?.get?.('x-guest-token') || null

    if (!user && !guestToken) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!id) {
        return Response.json({ error: 'Order ID is required' }, { status: 400 })
    }

    try {
        // 1. Fetch the order
        const order: any = await payload.findByID({
            collection: 'web-orders',
            id,
            depth: 0,
            overrideAccess: true,
        }).catch(() => null)

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.paymentStatus === 'refunded') {
            return Response.json({ error: 'Order has already been refunded' }, { status: 400 })
        }

        const orderUserId = typeof order.user === 'object' ? order.user?.id : order.user
        const isOwner = user && orderUserId && String(orderUserId) === String(user.id)
        const isEmailMatch = user && !orderUserId && order.email && order.email === (user as any).email
        const isGuestTokenMatch = !user && guestToken && order.guestAccessToken === guestToken

        if (!isOwner && !isEmailMatch && !isGuestTokenMatch) {
            return Response.json({ error: 'You are not authorized to refund this order' }, { status: 403 })
        }

        if (order.deliveryStatus === 'placed') {
            if (!order.stripeData.paymentIntentId) {
                return Response.json({ error: 'Order cannot be refunded as it is not paid' }, { status: 400 })
            }

            try {
                const refund = await stripe.refunds.create({
                    payment_intent: order.stripeData.paymentIntentId,
                });

                // Mark order as refund initiated — full reversal happens via charge.refunded webhook
                await payload.update({
                    collection: 'web-orders',
                    id,
                    data: {
                        paymentStatus: 'refund-initiated',
                        refundReason: reason,
                    },
                    overrideAccess: true,
                })

                return Response.json({ success: true, message: 'Refund initiated successfully' }, { status: 200 })

            } catch (err) {
                switch (err.type) {
                    case 'StripeInvalidRequestError':
                        console.error("Invalid parameters:", err.message);
                        break;
                    case 'StripeAPIError':
                        console.error("Stripe's servers are down.");
                        break;
                    case 'StripeConnectionError':
                        console.error("Network issue.");
                        break;
                    default:
                        console.error("A generic error occurred:", err.message);
                }
                throw new Error(`Stripe Refund Failed: ${err.message}`);
            }

        }

        return Response.json({ success: false, message: 'Order Cannot be refunded' }, { status: 400 })


    } catch (error: any) {
        console.error('[RefundHandler] Error:', error)
        return Response.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}