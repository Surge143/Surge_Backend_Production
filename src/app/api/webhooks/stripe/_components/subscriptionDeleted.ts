import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Handles the `customer.subscription.deleted` Stripe webhook event.
 * Fired after a subscription is cancelled (immediately or at period end).
 * Updates the matching web-subscription record status to cancelled.
 */
export async function handleSubscriptionDeleted(subscription: any) {
    const payload = await getPayload({ config })

    const stripeSubscriptionId = subscription.id

    console.log(`🔄 [SubscriptionDeleted] Processing cancellation for Stripe sub: ${stripeSubscriptionId}`)

    // Find the matching web-subscription by Stripe subscription ID
    let subDoc: any
    try {
        const result = await payload.find({
            collection: 'web-subscription',
            where: {
                'stripeData.subscriptionId': { equals: stripeSubscriptionId },
            },
            depth: 0,
            limit: 1,
        })

        if (result.docs.length === 0) {
            console.warn(`[SubscriptionDeleted] No web-subscription found for Stripe sub ${stripeSubscriptionId}`)
            return
        }

        subDoc = result.docs[0]
    } catch (err) {
        console.error('[SubscriptionDeleted] Error finding subscription:', err)
        return
    }

    // Update status to cancelled
    try {
        await payload.update({
            collection: 'web-subscription',
            id: subDoc.id,
            data: {
                subsStatus: 'cancelled',
            },
            overrideAccess: true,
        })

        console.log(`✅ [SubscriptionDeleted] web-subscription #${subDoc.id} marked as cancelled`)
    } catch (err) {
        console.error('[SubscriptionDeleted] Error updating subscription status:', err)
    }
}
