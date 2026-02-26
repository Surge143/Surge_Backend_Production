import { CollectionAfterChangeHook } from 'payload';
import { awardReferralCoins } from '@/utilities/awardReferralCoins';

export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req: { payload } }) => {
    // Import the socket utilities
    const { emitOrderCreated, emitOrderUpdated } = await import('@/utilities/socket');

    // --- SOCKET.IO EMISSION LOGIC ---
    // Only send the order when payment status is paid
    if (doc.paymentStatus === 'paid') {
        if (operation === 'create' || (previousDoc && previousDoc.paymentStatus !== 'paid')) {
            emitOrderCreated(doc);
        } else if (operation === 'update') {
            emitOrderUpdated(doc);
        }
    }

    // --- STAMP ACCRUAL LOGIC + SLOT LOAD UPDATE ---
    // These are deferred with setImmediate so they run AFTER the outer
    // app-orders transaction commits, preventing a DB deadlock caused by
    // the wt-stamps polymorphic relationship resolving back into app-orders.
    setImmediate(async () => {
        // --- REFERRAL REWARD LOGIC ---
        // Fire when order becomes paid for the first time and a user is set
        const isNowPaid = doc.paymentStatus === 'paid';
        const wasPaid = previousDoc?.paymentStatus === 'paid';
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user;
        if (isNowPaid && !wasPaid && userId) {
            await awardReferralCoins(payload, userId);
        }

        // --- STAMP ACCRUAL LOGIC ---
        // Fire only when order is picked up and NO coins were used
        console.log(`[afterChange] Checking stamp accrual. Status: ${doc.appOrderStatus}, Prev: ${previousDoc?.appOrderStatus}, Coins Used: ${doc.coinsUsed}`);
        if (doc.appOrderStatus === 'pickedup' && previousDoc?.appOrderStatus !== 'pickedup' && !doc.coinsUsed) {
            try {
                const stampRewardProductsGlobal = await payload.findGlobal({
                    slug: 'stamp-reward-products',
                    depth: 0,
                });

                const validStampProductIds = (stampRewardProductsGlobal?.stampProducts || []).map((p: any) =>
                    typeof p === 'object' ? p.id : p
                );
                console.log(`[afterChange] Valid stamp product IDs:`, validStampProductIds);

                let stampsEarned = 0;
                if (doc.items && Array.isArray(doc.items)) {
                    for (const item of doc.items) {
                        const productId = typeof item.product === 'object' ? item.product.id : item.product;
                        console.log(`[afterChange] Processing item product: ${productId}`);

                        if (validStampProductIds.includes(productId)) {
                            stampsEarned += (item.quantity || 0);
                        }
                    }
                }
                console.log(`[afterChange] Total stamps earned for this order: ${stampsEarned}`);

                if (stampsEarned > 0) {
                    const userId = typeof doc.user === 'object' ? doc.user.id : doc.user;
                    console.log(`[afterChange] Updating stamps for user: ${userId}`);

                    const userStampsDocs = await payload.find({
                        collection: 'wt-stamps',
                        where: { user: { equals: userId } },
                        limit: 1,
                        depth: 0,
                        overrideAccess: true,
                    });

                    let userStampsDoc = userStampsDocs.docs[0];

                    if (!userStampsDoc) {
                        console.log(`[afterChange] No WTStamps record found for user ${userId}. Creating new.`);
                        userStampsDoc = await payload.create({
                            collection: 'wt-stamps',
                            data: {
                                user: userId,
                                stampCount: 0,
                                stampReward: 0,
                            } as any,
                            depth: 0,
                            overrideAccess: true,
                        });
                    }

                    let newStampCount = (userStampsDoc.stampCount || 0) + stampsEarned;
                    let newRewardCount = (userStampsDoc.stampReward || 0);

                    console.log(`[afterChange] Current: ${userStampsDoc.stampCount} stamps, ${userStampsDoc.stampReward} rewards. New calculated: ${newStampCount} stamps.`);

                    // Rollover: 10 stamps = 1 reward
                    if (newStampCount >= 10) {
                        const rewardsToAdd = Math.floor(newStampCount / 10);
                        newRewardCount += rewardsToAdd;
                        newStampCount = newStampCount % 10;
                        console.log(`[afterChange] Rollover! Added ${rewardsToAdd} rewards. Remaining: ${newStampCount} stamps.`);
                    }

                    console.log(`[afterChange] Calling payload.update on wt-stamps...`);
                    const updatedDoc = await payload.update({
                        collection: 'wt-stamps',
                        id: userStampsDoc.id,
                        data: {
                            stampCount: newStampCount,
                            stampReward: newRewardCount,
                            stampEarningHistory: [
                                ...(userStampsDoc.stampEarningHistory || []),
                                {
                                    stamps: stampsEarned,
                                    earnedAt: new Date().toISOString(),
                                    linkedOrder: {
                                        relationTo: 'app-orders',
                                        value: doc.id,
                                    },
                                }
                            ]
                        } as any,
                        depth: 0,
                        overrideAccess: true,
                    });
                    console.log(`[afterChange] Successfully updated WTStamps:`, updatedDoc.id);
                }
            } catch (err) {
                console.error(`[afterChange] Error in stamp accrual logic:`, err);
            }
        }

        // --- SLOT LOAD UPDATE LOGIC ---
        const updateSlotLoad = async (slotId: string) => {
            try {
                const ordersInSlot = await payload.find({
                    collection: 'app-orders',
                    where: {
                        slot: { equals: slotId },
                        orderAcceptance: { equals: 'accepted' },
                    },
                    depth: 0,
                    overrideAccess: true,
                });

                const totalLoad = ordersInSlot.docs.length;

                await payload.update({
                    collection: 'slots',
                    id: slotId,
                    data: {
                        currentLoad: totalLoad,
                    },
                    overrideAccess: true,
                });
            } catch (err) {
                console.error(`[afterChange] Error updating slot load for ${slotId}:`, err);
            }
        };

        if (doc.slot) {
            await updateSlotLoad(typeof doc.slot === 'object' ? doc.slot.id : doc.slot);
        }

        if (previousDoc && previousDoc.slot && previousDoc.slot !== doc.slot) {
            await updateSlotLoad(typeof previousDoc.slot === 'object' ? previousDoc.slot.id : previousDoc.slot);
        }
    });
};
