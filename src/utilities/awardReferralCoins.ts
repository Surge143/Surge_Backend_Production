import type { Payload } from 'payload';
import { sendNotification } from '@/utilities/sendNotification';

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
    collection: 'app-orders' | 'web-orders' | 'web-subscription'
): Promise<void> {
    try {
        // 1. ATOMIC LOCK: Attempt to mark user as rewarded ONLY if they are currently 'pending'
        // This prevents race conditions if multiple delivery hooks fire simultaneously.
        const lockResult = await payload.update({
            collection: 'users',
            where: {
                and: [
                    { id: { equals: userId } },
                    { referralStatus: { equals: 'pending' } },
                ]
            },
            data: { referralStatus: 'rewarded' } as any,
            depth: 0,
            overrideAccess: true,
        });

        if (!lockResult.docs || lockResult.docs.length === 0) {
            // Either user isn't 'pending' (already rewarded/not referred) or doesn't exist.
            return;
        }

        const user = lockResult.docs[0];
        const referredById = typeof user.referredBy === 'object' ? (user.referredBy as any)?.id : user.referredBy;

        if (!referredById) {
            console.log(`[awardReferralCoins] User ${userId} was marked rewarded but has no referrer. Skipping coin credit.`);
            return;
        }

        // 2. Count total "completed/delivered" orders across all three collections
        // We do this to double-check this is indeed their first order context.
        const [appOrdersResult, webOrdersResult, webSubResult] = await Promise.all([
            payload.find({
                collection: 'app-orders',
                where: {
                    and: [
                        { user: { equals: userId } },
                        { paymentStatus: { equals: 'paid' } },
                        {
                            or: [
                                { appOrderStatus: { equals: 'completed' } },
                                { appOrderStatusDine: { equals: 'completed' } }
                            ]
                        }
                    ],
                },
                limit: 0,
                depth: 0,
                overrideAccess: true,
            }),
            payload.find({
                collection: 'web-orders',
                where: {
                    and: [
                        { user: { equals: userId } },
                        { paymentStatus: { equals: 'completed' } },
                        { deliveryStatus: { equals: 'delivered' } },
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

        console.log(`[awardReferralCoins] User ${userId} total completed orders: ${totalOrders}`);

        // If totalOrders > 1, it means they already have other completed orders.
        // Usually, the first hook to finish the update to 'rewarded' wins.
        if (totalOrders > 1) {
            console.log(`[awardReferralCoins] User ${userId} already has ${totalOrders} completed orders. Skipping reward.`);
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
            console.log('[awardReferralCoins] Both referral reward amounts are 0.');
        } else {
            // 4. Credit coins to referred user
            if (coinsForReferred > 0) {
                await creditCoins(payload, userId, coinsForReferred, 'referral-reward-received', orderId, collection);
                await sendNotification({
                    payload,
                    userId,
                    title: `🎉 You earned ${coinsForReferred} WTBeans!`,
                    body: `You received ${coinsForReferred} beans as a referral bonus for your first order.`,
                    notificationType: 'reward',
                    data: { type: 'referral_coins_received', amount: String(coinsForReferred) },
                });
            }

            // 5. Credit coins to referrer
            if (coinsForReferrer > 0) {
                await creditCoins(payload, referredById, coinsForReferrer, 'referral-reward-given', orderId, collection);
                await sendNotification({
                    payload,
                    userId: referredById,
                    title: `🎉 You earned ${coinsForReferrer} WTBeans!`,
                    body: `A friend you referred placed their first order. You've been rewarded ${coinsForReferrer} beans!`,
                    notificationType: 'reward',
                    data: { type: 'referral_coins_given', amount: String(coinsForReferrer) },
                });
            }
        }

        console.log(`✅ [awardReferralCoins] Referral rewarded: user ${userId} +${coinsForReferred} coins, referrer ${referredById} +${coinsForReferrer} coins`);

    } catch (err) {
        console.error('[awardReferralCoins] Error awarding referral coins:', err);
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
    collection: string
): Promise<void> {
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
        remainingAmount: amount,
        earnedAt: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        linkedOrder: {
            relationTo: collection,
            value: orderId,
        }
    };

    if (existing.docs.length > 0) {
        const doc = existing.docs[0];

        await payload.update({
            collection: 'user-wt-coins',
            id: doc.id,
            data: {
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

    console.log(`[awardReferralCoins] Credited ${amount} coins to user ${userId} (${reason}) linked to order ${orderId}`);
}
