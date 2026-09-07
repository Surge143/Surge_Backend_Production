import { sendEmail } from '@/lib/emailConfig'
import type { CollectionBeforeDeleteHook } from 'payload'
import { AccountDeletedEmail } from '@/lib/emailTemplates/AccountDeletedEmail'
import { stripe } from '@/lib/stripe'

export const beforeUserDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { payload, user } = req

  // Delete the Stripe customer (and any saved payment methods) so "delete account"
  // is actually complete on both sides — previously the Stripe billing profile
  // survived indefinitely after account deletion.
  try {
    const targetUser = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
    })
    const stripeCustomerId = (targetUser as any)?.stripeCustomerId
    if (stripeCustomerId) {
      await stripe.customers.del(stripeCustomerId)
      console.log(`✅ Deleted Stripe customer ${stripeCustomerId} for user ${id}`)
    }

    // Also delete their profile image — previously it was left behind in
    // storage forever, still publicly reachable, even after "deletion."
    const profileImageId = (targetUser as any)?.profileImage
      ? (typeof (targetUser as any).profileImage === 'object' ? (targetUser as any).profileImage?.id : (targetUser as any).profileImage)
      : null
    if (profileImageId) {
      await payload.delete({ collection: 'media', id: profileImageId, overrideAccess: true })
      console.log(`✅ Deleted profile image ${profileImageId} for user ${id}`)
    }
  } catch (error) {
    // Don't block account deletion if this cleanup fails (e.g. already deleted,
    // or Stripe has an open dispute/invoice attached) — log and continue.
    console.error(`❌ Failed to clean up Stripe customer/profile image for user ${id}:`, error)
  }

  // List of collections where the user has a required/unique relationship
  // these must be deleted BEFORE the user is deleted to avoid constraint violations.
  const collectionsToClean = [
    'web-cart',
    'app-cart',
    'wishlist',
    'user-surge-coins',
    'user-preferences',
    'notifications',
    'surge-stamps',
  ]

  console.log(`🗑️ Starting cleanup for user ${id} across related collections...`)

  for (const slug of collectionsToClean) {
    try {
      const result = await payload.delete({
        collection: slug as any,
        where: {
          user: {
            equals: id,
          },
        },
      })

      if (result.errors && result.errors.length > 0) {
        console.warn(`⚠️ Potential partial failure deleting ${slug} for user ${id}:`, result.errors)
      } else {
        console.log(`✅ Cleaned up ${slug} for user ${id}`)
      }
    } catch (error) {
      console.error(`❌ Failed to clean up ${slug} for user ${id}:`, error)
      // We log the error but allow the hook to continue so the user deletion isn't blocked
      // by a non-existent related record or other minor issues.
    }
  }

  // Orphan all orders belonging to this user — set user: null so they become
  // relinkable when the same email re-registers (afterUserCreated will find them).
  const orderCollections = [
    { slug: 'web-orders', hasCustomerType: true },
    { slug: 'app-orders', hasCustomerType: false },
  ]
  for (const { slug, hasCustomerType } of orderCollections) {
    try {
      const orders = await payload.find({
        collection: slug as any,
        where: { user: { equals: id } },
        limit: 500,
        depth: 0,
        overrideAccess: true,
        select: { id: true } as any,
      })
      for (const order of orders.docs) {
        const data: any = { user: null }
        if (hasCustomerType) data.customerType = 'guest'
        await payload.update({
          collection: slug as any,
          id: order.id,
          data,
          overrideAccess: true,
          depth: 0,
        })
      }
      console.log(`✅ Orphaned ${orders.docs.length} ${slug} order(s) for deleted user ${id}`)
    } catch (error) {
      console.error(`❌ Failed to orphan ${slug} orders for user ${id}:`, error)
    }
  }

  try {
    await sendEmail({
      to: ((user as any)?.contactEmail ?? user?.email) as string,
      subject: 'Account Deleted',
      body: `User account with ID ${id} has been deleted.`.trim(),
      html: AccountDeletedEmail(user),
    })
    console.log(`✅ Notification email sent for deletion of user ${id}`)
  } catch (err) {
    console.error(`❌ Unexpected error during cleanup for user ${id}:`, err)
  }
}
