import { CollectionAfterChangeHook } from 'payload';
import { awardReferralCoins } from '@/utilities/awardReferralCoins';
import { createOrderPaidNotification } from '@/utilities/orderNotifications';

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
            await createOrderPaidNotification(payload, userId, doc.id, 'cafe');
        }

        // --- STAMP ACCRUAL LOGIC ---
        // Fire when order is picked up/completed and stamps HAVEN'T been awarded yet.
        // We handle different status fields based on orderType: take-away vs dine-in
        const orderStatus = doc.orderType === 'dine-in' ? doc.appOrderStatusDine : doc.appOrderStatus;
        const prevOrderStatus = previousDoc?.orderType === 'dine-in' ? previousDoc?.appOrderStatusDine : previousDoc?.appOrderStatus;

        console.log(`[afterChange] Checking stamp accrual. Type: ${doc.orderType}, Status: ${orderStatus}, Prev: ${prevOrderStatus}, Already Awarded: ${(doc as any).isStampsAwarded}`);
        if (orderStatus === 'completed' && prevOrderStatus !== 'completed' && !(doc as any).isStampsAwarded) {
            try {
                // Collect all product IDs from the order items
                const orderProductIds: (string | number)[] = (doc.items || []).map((item: any) =>
                    typeof item.product === 'object' ? item.product.id : item.product
                ).filter(Boolean);

                // Single optimised query: only fetch stamp-eligible products that are in this order
                const eligibleProductsResult = await payload.find({
                    collection: 'shop-menu',
                    where: {
                        and: [
                            { id: { in: orderProductIds } },
                            { isStampEligible: { equals: true } },
                        ],
                    },
                    depth: 0,
                    limit: orderProductIds.length || 1,
                    overrideAccess: true,
                });

                const eligibleIds = new Set(eligibleProductsResult.docs.map((p: any) => String(p.id)));
                console.log(`[afterChange] Stamp-eligible product IDs in this order:`, [...eligibleIds]);

                let stampsEarned = 0;
                if (doc.items && Array.isArray(doc.items)) {
                    for (const item of doc.items) {
                        const productId = typeof item.product === 'object' ? item.product.id : item.product;
                        console.log(`[afterChange] Processing item product: ${productId}`);

                        if (eligibleIds.has(String(productId))) {
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
                    await payload.update({
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

                    // CRITICAL: Mark the order as awarded so we never process it again for stamps
                    await payload.update({
                        collection: 'app-orders',
                        id: doc.id,
                        data: {
                            isStampsAwarded: true,
                        } as any,
                        overrideAccess: true,
                    });
                    console.log(`[afterChange] Successfully updated WTStamps and marked order ${doc.id} as awarded.`);
                } else if (orderProductIds.length > 0) {
                    // Even if no stamps earned (e.g. products not eligible), mark as processed
                    // to avoid re-running the eligible-check query on every status update
                    await payload.update({
                        collection: 'app-orders',
                        id: doc.id,
                        data: {
                            isStampsAwarded: true,
                        } as any,
                        overrideAccess: true,
                    });
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
