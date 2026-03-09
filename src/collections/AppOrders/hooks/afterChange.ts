import { CollectionAfterChangeHook } from 'payload';
import { awardReferralCoins } from '@/utilities/awardReferralCoins';
import {
    createOrderPaidNotification,
    createOrderCompletedNotification,
    createStampEarnedNotification,
} from '@/utilities/orderNotifications';

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
    setImmediate(async () => {
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user;

        // --- ORDER PAID: notification ---
        const isNowPaid = doc.paymentStatus === 'paid';
        const wasPaid = previousDoc?.paymentStatus === 'paid';

        if (isNowPaid && !wasPaid && userId) {
            await createOrderPaidNotification(payload, userId, doc.id, 'cafe');
        }

        // --- ORDER STATUS: completed notification + stamp accrual ---
        const orderStatus = doc.orderType === 'dine-in' ? doc.appOrderStatusDine : doc.appOrderStatus;
        const prevOrderStatus = previousDoc?.orderType === 'dine-in' ? previousDoc?.appOrderStatusDine : previousDoc?.appOrderStatus;

        const becameEligible = (orderStatus === 'completed' && isNowPaid) && (prevOrderStatus !== 'completed' || !wasPaid);

        if (becameEligible && userId) {
            // Trigger referral reward only when fully paid and completed
            await awardReferralCoins(payload, userId, doc.id, 'app-orders');

            // Notify user their order is ready
            await createOrderCompletedNotification(payload, userId, doc.id, 'cafe');
        }

        // --- STAMP ACCRUAL ---
        try {
            // Refetch the doc to get the latest state (especially isStampsAwarded)
            // this prevents double-awarding if multiple status updates happen rapidly
            const latestDoc = await payload.findByID({
                collection: 'app-orders',
                id: doc.id,
                depth: 0,
                overrideAccess: true,
            });

            if (latestDoc && !(latestDoc as any).isStampsAwarded) {
                // --- NEW: ONLY ACCRUE IF COMPLETED AND PAID ---
                const isPaid = latestDoc.paymentStatus === 'paid';
                const currentStatus = latestDoc.orderType === 'dine-in' ? latestDoc.appOrderStatusDine : latestDoc.appOrderStatus;
                const isCompleted = currentStatus === 'completed';

                if (!isPaid || !isCompleted) {
                    console.log(`[afterChange] Order ${doc.id} not yet fully paid and completed (Status: ${currentStatus}, Paid: ${isPaid}). Skipping stamp accrual for now.`);
                    return;
                }

                const coinsUsed = (latestDoc as any).coinsUsed || 0;
                const wtCoinsDiscount = (latestDoc as any).financials?.wtCoinsDiscount || 0;

                if (coinsUsed > 0 || wtCoinsDiscount > 0) {
                    console.log(`[afterChange] Order ${doc.id} used WTCoins (${coinsUsed}) or has discount (${wtCoinsDiscount}). Skipping stamp accrual.`);

                    await payload.update({
                        collection: 'app-orders',
                        id: doc.id,
                        data: { isStampsAwarded: true } as any,
                        overrideAccess: true,
                    });
                    return; // Exit the stamp accrual block
                }

                console.log(`[afterChange] Checking stamp accrual for order ${doc.id}`);

                // Collect all product IDs from the order items
                const orderProductIds: (string | number)[] = (latestDoc.items || []).map((item: any) =>
                    typeof item.product === 'object' ? item.product.id : item.product
                ).filter(Boolean);

                // ... rest of the logic using latestDoc ...
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

                let stampsEarned = 0;
                if (latestDoc.items && Array.isArray(latestDoc.items)) {
                    for (const item of latestDoc.items) {
                        const productId = typeof item.product === 'object' ? item.product.id : item.product;
                        if (eligibleIds.has(String(productId))) {
                            stampsEarned += (item.quantity || 0);
                        }
                    }
                }

                if (stampsEarned > 0) {
                    const stampUserId = typeof latestDoc.user === 'object' ? latestDoc?.user?.id : latestDoc.user;

                    if (!stampUserId) {
                        console.warn(`[afterChange] No user found for order ${latestDoc.id}, skipping stamps.`);
                        return;
                    }

                    const userStampsDocs = await payload.find({
                        collection: 'wt-stamps',
                        where: { user: { equals: stampUserId } },
                        limit: 1,
                        depth: 0,
                        overrideAccess: true,
                    });

                    let userStampsDoc = userStampsDocs.docs[0];

                    if (!userStampsDoc) {
                        userStampsDoc = await payload.create({
                            collection: 'wt-stamps',
                            data: {
                                user: stampUserId,
                                stampCount: 0,
                                stampReward: 0,
                            } as any,
                            depth: 0,
                            overrideAccess: true,
                        });
                    }

                    let newStampCount = (userStampsDoc.stampCount || 0) + stampsEarned;
                    let newRewardCount = (userStampsDoc.stampReward || 0);
                    const prevRewardCount = newRewardCount;

                    if (newStampCount >= 10) {
                        const rewardsToAdd = Math.floor(newStampCount / 10);
                        newRewardCount += rewardsToAdd;
                        newStampCount = newStampCount % 10;
                    }

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
                                        value: latestDoc.id,
                                    },
                                }
                            ]
                        } as any,
                        depth: 0,
                        overrideAccess: true,
                    });

                    const rewardsAdded = newRewardCount - prevRewardCount;
                    await createStampEarnedNotification(payload, stampUserId, stampsEarned, newStampCount, rewardsAdded);

                    await payload.update({
                        collection: 'app-orders',
                        id: latestDoc.id,
                        data: { isStampsAwarded: true } as any,
                        overrideAccess: true,
                    });
                } else if (orderProductIds.length > 0) {
                    await payload.update({
                        collection: 'app-orders',
                        id: latestDoc.id,
                        data: { isStampsAwarded: true } as any,
                        overrideAccess: true,
                    });
                }
            }
        } catch (err) {
            console.error(`[afterChange] Error in stamp accrual logic:`, err);
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
                    data: { currentLoad: totalLoad },
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
