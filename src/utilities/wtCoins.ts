import { Payload } from 'payload';

/**
 * Award WTCoins to user based on real money spent
 */
export async function awardWTCoins(
    payload: Payload,
    userId: number,
    realMoneySpent: number,
    orderId: string | number,
    collection: 'web-orders' | 'app-orders' = 'web-orders'
) {
    try {
        // Fetch WTCoins configuration
        const wtCoinsConfig = await payload.findGlobal({
            slug: 'wt-coins',
            depth: 1,
        })

        if (!wtCoinsConfig) {
            console.error('WTCoins configuration not found')
            return
        }

        // Calculate points to award (percentage of real money spent)
        const pointsEarnRate = wtCoinsConfig.pointsEarn || 0
        const pointsToAward = Math.floor(realMoneySpent * (pointsEarnRate / 100))

        if (pointsToAward <= 0) {
            console.log(`No points to award for order ${orderId}`)
            return
        }

        // Calculate expiry date
        const expiryMonths = wtCoinsConfig.rewardExpiry || 12
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + expiryMonths)

        // Find or create user's WTCoins record
        const userRewards = await payload.find({
            collection: 'user-wt-coins',
            where: { user: { equals: userId } },
            overrideAccess: true,
        })

        let userWTCoins: any

        if (userRewards.docs.length === 0) {
            // Create new record
            userWTCoins = await payload.create({
                collection: 'user-wt-coins',
                data: {
                    user: userId,
                    totalBalance: pointsToAward,
                    coinEarningHistory: [
                        {
                            amount: pointsToAward,
                            remainingAmount: pointsToAward,
                            earnedAt: new Date().toISOString(),
                            linkedOrder: {
                                relationTo: collection,
                                value: orderId as any
                            },
                            expiryDate: expiryDate.toISOString(),
                        }
                    ],
                    pointsRedemptionHistory: []
                },
                overrideAccess: true,
            })
            console.log(`✅ [wtCoins] Created record and awarded ${pointsToAward} points to user ${userId}`)
        } else {
            // Update existing record
            userWTCoins = userRewards.docs[0]

            const history = (userWTCoins.coinEarningHistory || []).map((entry: any) => {
                let processedLinkedOrder = entry.linkedOrder;
                if (processedLinkedOrder && typeof processedLinkedOrder.value === 'object') {
                    processedLinkedOrder = {
                        relationTo: processedLinkedOrder.relationTo,
                        value: processedLinkedOrder.value.id || processedLinkedOrder.value._id || processedLinkedOrder.value,
                    };
                }
                return {
                    ...entry,
                    linkedOrder: processedLinkedOrder,
                };
            });

            const alreadyAwarded = history.some((entry: any) =>
                entry.linkedOrder &&
                entry.linkedOrder.relationTo === collection &&
                String(entry.linkedOrder.value) === String(orderId)
            );

            if (alreadyAwarded) {
                console.log(`⚠️ [wtCoins] Order ${orderId} already has points awarded. Skipping.`);
                return;
            }

            await payload.update({
                collection: 'user-wt-coins',
                id: userWTCoins.id,
                data: {
                    coinEarningHistory: [
                        ...history,
                        {
                            amount: pointsToAward,
                            remainingAmount: pointsToAward,
                            earnedAt: new Date().toISOString(),
                            linkedOrder: {
                                relationTo: collection,
                                value: orderId as any
                            },
                            expiryDate: expiryDate.toISOString(),
                        }
                    ]
                },
                overrideAccess: true,
            })
            console.log(`✅ [wtCoins] Awarded ${pointsToAward} WTCoins to user ${userId}.`)
        }
    } catch (error) {
        console.error('❌ [wtCoins] Error awarding WTCoins:', error)
        throw error
    }
}

/**
 * Deduct WTCoins from user's balance using FIFO logic (oldest non-expired first)
 */
export async function deductWTCoins(
    payload: any,
    userId: string | number,
    pointsUsed: number,
    orderId: string | number,
    relationTo: 'web-orders' | 'app-orders' = 'web-orders'
) {
    try {
        console.log(`🎬 [wtCoins] Starting FIFO deduction:`);
        console.log(`   - userId: ${userId} (type: ${typeof userId})`);
        console.log(`   - pointsUsed: ${pointsUsed}`);
        console.log(`   - orderId: ${orderId}`);
        console.log(`   - relationTo: ${relationTo}`);

        const numericUserId = Number(userId);
        console.log(`   - Searching for user-wt-coins with user ID: ${numericUserId}`);

        // Find user's WTCoins record
        const userRewards = await payload.find({
            collection: 'user-wt-coins',
            where: { user: { equals: numericUserId } },
            overrideAccess: true,
        })

        if (userRewards.docs.length === 0) {
            console.error(`❌ [wtCoins] No WTCoins record found for user ${userId} (searched for ${numericUserId})`)
            // Try searching without Number() just in case the ID is a string
            if (typeof userId === 'string') {
                console.log(`   - Retrying search with string userId: ${userId}`);
                const retryRewards = await payload.find({
                    collection: 'user-wt-coins',
                    where: { user: { equals: userId } },
                    overrideAccess: true,
                });
                if (retryRewards.docs.length > 0) {
                    console.log(`   ✅ [wtCoins] Found record on retry with string ID.`);
                    // Fall through with the found record
                    userRewards.docs = retryRewards.docs;
                } else {
                    return;
                }
            } else {
                return;
            }
        }

        const record = userRewards.docs[0]
        console.log(`   - Found record ID: ${record.id}`);
        console.log(`   - Current totalBalance: ${record.totalBalance}`);

        let pointsToDeduct = Math.round(pointsUsed);
        const now = new Date();

        // --- FIFO DEDUCTION LOGIC ---
        // Sort history by earnedAt (oldest first)
        const earningHistory = [...(record.coinEarningHistory || [])].sort((a: any, b: any) =>
            new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime()
        );

        console.log(`   - Earning history entries: ${earningHistory.length}`);

        let actualDeducted = 0;
        const updatedHistory = earningHistory.map((entry: any, index: number) => {
            const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null;
            const isExpired = expiryDate && expiryDate <= now;

            // Handle populated linkedOrder to prevent schema validation errors on update
            let processedLinkedOrder = entry.linkedOrder;
            if (processedLinkedOrder && typeof processedLinkedOrder.value === 'object') {
                processedLinkedOrder = {
                    relationTo: processedLinkedOrder.relationTo,
                    value: processedLinkedOrder.value.id || processedLinkedOrder.value._id || processedLinkedOrder.value,
                };
            }

            const newEntry = {
                ...entry,
                linkedOrder: processedLinkedOrder,
            };

            if (pointsToDeduct > 0 && !isExpired && (entry.remainingAmount || 0) > 0) {
                const deduction = Math.min(entry.remainingAmount, pointsToDeduct);
                pointsToDeduct -= deduction;
                actualDeducted += deduction;
                console.log(`   - Entry ${index}: Deducted ${deduction}, Remaining in entry: ${entry.remainingAmount - deduction}`);
                return {
                    ...newEntry,
                    remainingAmount: Math.max(0, entry.remainingAmount - deduction)
                };
            }
            return newEntry;
        });

        if (pointsToDeduct > 0) {
            console.warn(`⚠️ [wtCoins] User ${userId} requested ${pointsUsed} but had only ${pointsUsed - pointsToDeduct} available.`);
        }

        // Properly format redemption history
        const processedRedemptionHistory = (record.pointsRedemptionHistory || []).map((h: any) => {
            const associatedValue = typeof h.associatedOrder === 'object'
                ? (h.associatedOrder.value || h.associatedOrder.id)
                : h.associatedOrder;

            return {
                redeemedPoints: h.redeemedPoints,
                associatedOrder: {
                    relationTo: h.associatedOrder?.relationTo || relationTo,
                    value: associatedValue
                }
            };
        });

        const finalRedeemed = Math.round(pointsUsed - pointsToDeduct);
        console.log(`   - Final points to redeem: ${finalRedeemed}`);

        await payload.update({
            collection: 'user-wt-coins',
            id: record.id,
            data: {
                coinEarningHistory: updatedHistory,
                pointsRedemptionHistory: [
                    ...processedRedemptionHistory,
                    {
                        redeemedPoints: finalRedeemed,
                        associatedOrder: {
                            relationTo: relationTo,
                            value: orderId,
                        },
                    }
                ]
            },
            overrideAccess: true,
        })

        console.log(`✅ [wtCoins] Successfully updated record ${record.id} for user ${userId}. Total deducted: ${finalRedeemed}`);
    } catch (error) {
        console.error('❌ [wtCoins] Error in deductWTCoins:', error)
        throw error
    }
}

/**
 * Convert points to AED based on configuration
 */
export async function convertPointsToAED(payload: Payload, points: number): Promise<number> {
    try {
        const wtCoinsConfig = await payload.findGlobal({
            slug: 'wt-coins',
            depth: 1,
        })

        if (!wtCoinsConfig) return 0

        const pointsToAedRate = wtCoinsConfig.pointsToAed || 1
        return points / pointsToAedRate
    } catch (error) {
        console.error('❌ [wtCoins] Error converting points to AED:', error)
        return 0
    }
}
