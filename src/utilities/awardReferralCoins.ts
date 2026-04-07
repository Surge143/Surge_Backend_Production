import type { Payload } from 'payload'
import { sendNotification } from '@/utilities/sendNotification'

/**
 * Checks if this is the referred user's first successful paid order (across ALL
 * three order collections), and if so credits WTCoins to both the referred user
 * and their referrer.
 *
 * Call this from the afterChange hooks of app-orders and web-orders
 * any time an order transitions to its paid state.
 *
 * @param payload  - Payload instance
 * @param userId   - The ID of the user who just completed an order
 */
/**
 * Checks if this is the referred user's first successful paid & delivered order,
 * and if so credits WTCoins to both the referred user and their referrer.
 *
 * @param payload  - Payload instance
 * @param userId   - The ID of the user who just completed an order
 * @param orderId  - The ID of the order that triggered this reward
 * @param collection - Which collection the order belongs to
 */
export async function awardReferralCoins(
  payload: Payload,
  userId: number | string,
  orderId: string | number,
  collection: 'app-orders' | 'web-orders',
): Promise<void> {
  try {
    // 1. Fetch the user to check their referral state AND get referredBy
    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1, // depth 1 so referredBy is populated
      overrideAccess: true,
    })) as any

    if (!user) {
      console.log(`[awardReferralCoins] User ${userId} not found.`)
      return
    }

    // Only proceed if user was referred and reward is still pending
    if (user.referralStatus !== 'pending') {
      const currentStatus = user.referralStatus
      console.log(
        `[awardReferralCoins] User ${userId} referralStatus="${currentStatus}". Skipping reward.`,
      )
      return
    }

    const referredById = typeof user.referredBy === 'object' ? user.referredBy?.id : user.referredBy
    if (!referredById) {
      console.log(`[awardReferralCoins] User ${userId} has no referredBy. Skipping.`)
      return
    }

    // 2. SAFETY CHECK: Ensure no previous orders exist for this EMAIL across all collections.
    // This is a backup in case the referral code was somehow applied to an account with a reused email.
    const userEmail = user.email
    if (userEmail) {
      const checkCollections = ['web-orders', 'app-orders']
      for (const slug of checkCollections) {
        const existingOrders = await payload.find({
          collection: slug as any,
          where: {
            and: [
              { email: { equals: userEmail } },
              { id: { not_equals: orderId } }, // Exclude current order
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })

        if (existingOrders.docs.length > 0) {
          console.log(
            `[awardReferralCoins] Previous order found for email ${userEmail} in ${slug}. Skipping reward.`,
          )
          await payload.update({
            collection: 'users',
            id: userId,
            data: { referralStatus: 'not_eligible' } as any,
            overrideAccess: true,
          })
          return
        }
      }
    }

    // 3. ATOMIC LOCK: Update status to 'rewarded' only if it is still 'pending'.
    // This prevents a race condition where two hooks fire at the same time.
    const lockResult = await payload.update({
      collection: 'users',
      where: {
        and: [{ id: { equals: userId } }, { referralStatus: { equals: 'pending' } }],
      },
      data: { referralStatus: 'rewarded' } as any,
      depth: 0,
      overrideAccess: true,
    })

    // If no docs were updated, another process already acquired the lock.
    if (!lockResult.docs || lockResult.docs.length === 0) {
      console.log(`[awardReferralCoins] Lock not acquired for user ${userId}. Already processed.`)
      return
    }

    console.log(`[awardReferralCoins] Lock acquired for user ${userId}. Awarding coins...`)

    // 3. Read reward amounts from wt-coins global
    const wtCoinsConfig = await payload.findGlobal({
      slug: 'wt-coins',
      depth: 0,
      overrideAccess: true,
    })

    const coinsForReferred: number = (wtCoinsConfig as any)?.referralRewardForReferred ?? 0
    const coinsForReferrer: number = (wtCoinsConfig as any)?.referralRewardForReferrer ?? 0

    console.log(
      `[awardReferralCoins] Config found. Referred reward: ${coinsForReferred}, Referrer reward: ${coinsForReferrer}`,
    )

    if (coinsForReferred === 0 && coinsForReferrer === 0) {
      console.log(
        '[awardReferralCoins] Both referral reward amounts are 0 in wt-coins global. No coins to credit.',
      )
      return
    }

    // 4. Credit coins to referred user
    if (coinsForReferred > 0) {
      await creditCoins(
        payload,
        userId,
        coinsForReferred,
        'referral-reward-received',
        orderId,
        collection,
      )
      await sendNotification({
        payload,
        userId,
        title: `🎉 You earned ${coinsForReferred} WTBeans!`,
        body: `You received ${coinsForReferred} beans as a referral bonus for your first order.`,
        notificationType: 'reward',
        data: { type: 'referral_coins_received', amount: String(coinsForReferred) },
      })
    }

    // 5. Credit coins to referrer
    if (coinsForReferrer > 0) {
      await creditCoins(
        payload,
        referredById,
        coinsForReferrer,
        'referral-reward-given',
        orderId,
        collection,
      )
      await sendNotification({
        payload,
        userId: referredById,
        title: `🎉 You earned ${coinsForReferrer} WTBeans!`,
        body: `A friend you referred placed their first order. You've been rewarded ${coinsForReferrer} beans!`,
        notificationType: 'reward',
        data: { type: 'referral_coins_given', amount: String(coinsForReferrer) },
      })
    }

    console.log(
      `✅ [awardReferralCoins] Referral rewarded: user ${userId} +${coinsForReferred} coins, referrer ${referredById} +${coinsForReferrer} coins`,
    )
  } catch (err) {
    console.error('[awardReferralCoins] Error awarding referral coins:', err)
  }
}

/**
 * Finds or creates a user-wt-coins document and adds coins to the balance.
 */
async function creditCoins(
  payload: Payload,
  userId: number | string,
  amount: number,
  reason: string,
  orderId: string | number,
  collection: string,
): Promise<void> {
  // Find existing balance doc
  const existing = await payload.find({
    collection: 'user-wt-coins',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + 12) // 12 month expiry

  const historyEntry = {
    amount,
    remainingAmount: amount,
    earnedAt: new Date().toISOString(),
    expiryDate: expiryDate.toISOString(),
    linkedOrder: {
      relationTo: collection,
      value: orderId,
    },
  }

  if (existing.docs.length > 0) {
    const doc = existing.docs[0]

    const newHistory = [...(doc.coinEarningHistory ?? []), historyEntry]

    // Compute total balance atomically
    const now = new Date()
    const newTotalBalance = newHistory.reduce((acc: number, entry: any) => {
      const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null
      if (!expiryDate || expiryDate > now) {
        return acc + (entry.remainingAmount || 0)
      }
      return acc
    }, 0)

    await payload.update({
      collection: 'user-wt-coins',
      id: doc.id,
      data: {
        coinEarningHistory: newHistory,
        totalBalance: newTotalBalance,
      } as any,
      depth: 0,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'user-wt-coins',
      data: {
        user: userId,
        totalBalance: amount,
        coinEarningHistory: [historyEntry],
      } as any,
      depth: 0,
      overrideAccess: true,
    })
  }

  console.log(
    `[awardReferralCoins] Credited ${amount} coins to user ${userId} (${reason}) linked to order ${orderId}`,
  )
}
