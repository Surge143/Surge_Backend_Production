import type { Payload } from 'payload';

/**
 * Checks if this is the referred user's first successful paid order (across ALL
 * three order collections), and if so credits WTCoins to both the referred user
 * and their referrer.
 *
 * Call this from the afterChange hooks of app-orders, web-orders, and web-subscription
 * any time an order transitions to its paid state.
 *
 * @param payload  - Payload instance
 * @param userId   - The ID of the user who just completed an order
 */
export async function awardReferralCoins(payload: Payload, userId: number | string): Promise<void> {
    try {
        // 1. Fetch the user to check referral state
        const user = await payload.findByID({
            collection: 'users',
            id: userId,
            depth: 0,
            overrideAccess: true,
        }) as any;

        if (!user) {
            console.log(`[awardReferralCoins] User ${userId} not found.`);
            return;
        }

        // Only proceed if user was referred and reward is still pending
        if (user.referralStatus !== 'pending') {
            return;
        }

        const referredById = typeof user.referredBy === 'object' ? (user.referredBy as any)?.id : user.referredBy;
        if (!referredById) {
            console.log(`[awardReferralCoins] User ${userId} has pending referralStatus but no referredBy. Skipping.`);
            return;
        }

        // 2. Count total paid orders across all three collections
        const [appOrdersResult, webOrdersResult, webSubResult] = await Promise.all([
            payload.find({
                collection: 'app-orders',
                where: {
                    and: [
                        { user: { equals: userId } },
                        { paymentStatus: { equals: 'paid' } },
                    ],
                },
                limit: 0, // only need totalDocs
                depth: 0,
                overrideAccess: true,
            }),
            payload.find({
                collection: 'web-orders',
                where: {
                    and: [
                        { user: { equals: userId } },
                        { paymentStatus: { equals: 'completed' } },
                    ],
                },
                limit: 0,
                depth: 0,
                overrideAccess: true,
            }),
            payload.find({
                collection: 'web-subscription',
                where: {
                    and: [
                        { user: { equals: userId } },
                        { paymentStatus: { equals: 'completed' } },
                    ],
                },
                limit: 0,
                depth: 0,
                overrideAccess: true,
            }),
        ]);

        const totalOrders =
            (appOrdersResult.totalDocs ?? 0) +
            (webOrdersResult.totalDocs ?? 0) +
            (webSubResult.totalDocs ?? 0);

        console.log(`[awardReferralCoins] User ${userId} total paid orders: ${totalOrders}`);

        // The afterChange hook fires after the order is saved, so totalOrders includes
        // the current one. Exactly 1 means this IS the first order.
        if (totalOrders !== 1) {
            console.log(`[awardReferralCoins] Not the first order (count=${totalOrders}). Skipping referral reward.`);
            return;
        }

        // 3. Read reward amounts from wt-coins global
        const wtCoinsConfig = await payload.findGlobal({
            slug: 'wt-coins',
            depth: 0,
        });

        const coinsForReferred: number = (wtCoinsConfig as any)?.referralRewardForReferred ?? 0;
        const coinsForReferrer: number = (wtCoinsConfig as any)?.referralRewardForReferrer ?? 0;

        if (coinsForReferred === 0 && coinsForReferrer === 0) {
            console.log('[awardReferralCoins] Both referral reward amounts are 0. Updating status but skipping coin credit.');
        } else {
            // 4. Credit coins to referred user
            if (coinsForReferred > 0) {
                await creditCoins(payload, userId, coinsForReferred, 'referral-reward-received');
            }

            // 5. Credit coins to referrer
            if (coinsForReferrer > 0) {
                await creditCoins(payload, referredById, coinsForReferrer, 'referral-reward-given');
            }
        }

        // 6. Mark referral as rewarded
        await payload.update({
            collection: 'users',
            id: userId,
            data: { referralStatus: 'rewarded' } as any,
            depth: 0,
            overrideAccess: true,
        });

        console.log(`✅ [awardReferralCoins] Referral rewarded: user ${userId} +${coinsForReferred} coins, referrer ${referredById} +${coinsForReferrer} coins`);

    } catch (err) {
        console.error('[awardReferralCoins] Error awarding referral coins:', err);
    }
}

/**
 * Finds or creates a user-wt-coins document and adds coins to the balance.
 */
async function creditCoins(payload: Payload, userId: number | string, amount: number, reason: string): Promise<void> {
    // Find existing balance doc
    const existing = await payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: userId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
    });

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 12); // 12 month expiry

    const historyEntry = {
        amount,
        earnedAt: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
    };

    if (existing.docs.length > 0) {
        const doc = existing.docs[0];
        const newBalance = (doc.totalBalance ?? 0) + amount;

        await payload.update({
            collection: 'user-wt-coins',
            id: doc.id,
            data: {
                totalBalance: newBalance,
                coinEarningHistory: [
                    ...(doc.coinEarningHistory ?? []),
                    historyEntry,
                ],
            } as any,
            depth: 0,
            overrideAccess: true,
        });
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
        });
    }

    console.log(`[awardReferralCoins] Credited ${amount} coins to user ${userId} (${reason})`);
}
