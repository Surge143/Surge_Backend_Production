import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from '@/lib/emailConfig'
import { SubscriptionCancelledEmail } from '@/lib/emailTemplates/StoreSubscriptionCancelled'

export async function handleSubscriptionDeleted(subscription: any) {
  const payload = await getPayload({ config })

  const stripeSubscriptionId = subscription.id

  // Find the matching web-subscription by Stripe subscription ID
  let subDoc: any
  try {
    const result = await payload.find({
      collection: 'web-subscription',
      where: {
        or: [
          { 'stripeData.subscriptionId': { equals: stripeSubscriptionId } },
          { stripeSubscriptionID: { equals: stripeSubscriptionId } },
        ],
      },
      depth: 0,
      limit: 1,
    })

    if (result.docs.length === 0) {
      console.warn(
        `[SubscriptionDeleted] No web-subscription found for Stripe sub ${stripeSubscriptionId}`,
      )
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

    try {
      const userEmail = subDoc.user && typeof subDoc.user === 'object' && (subDoc.user as any).email

      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: 'Subscription Cancelled',
          body: `Your subscription has been cancelled.`,
          html: SubscriptionCancelledEmail(subDoc),
        })
        console.log('✅ Email sent')
      }
    } catch (err) {
      console.error('❌ Email failed:', err)
    }

    console.log(`✅ [SubscriptionDeleted] web-subscription #${subDoc.id} marked as cancelled`)
  } catch (err) {
    console.error('[SubscriptionDeleted] Error updating subscription status:', err)
  }
}
