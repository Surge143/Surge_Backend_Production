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
            console.log(`✅ Created WTCoins record and awarded ${pointsToAward} points to user ${userId}`)
        } else {
            // Update existing record
            userWTCoins = userRewards.docs[0]

            // --- IDEMPOTENCY CHECK: Check if this order has already earned points ---
            const history = userWTCoins.coinEarningHistory || [];
            const alreadyAwarded = history.some((entry: any) =>
                entry.linkedOrder &&
                entry.linkedOrder.relationTo === collection &&
                String(entry.linkedOrder.value) === String(orderId)
            );

            if (alreadyAwarded) {
                console.log(`⚠️ Order ${orderId} from ${collection} already has points awarded in history. Skipping.`);
                return;
            }

            await payload.update({
                collection: 'user-wt-coins',
                id: userWTCoins.id,
                data: {
                    // totalBalance will be recalculated by UserWTCoins afterChange hook
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
            console.log(`✅ Awarded ${pointsToAward} WTCoins to user ${userId}. History updated.`)
        }
    } catch (error) {
        console.error('Error awarding WTCoins:', error)
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

        if (!wtCoinsConfig) {
            return 0
        }

        const pointsToAedRate = wtCoinsConfig.pointsToAed || 1
        return points / pointsToAedRate
    } catch (error) {
        console.error('Error converting points to AED:', error)
        return 0
    }
}
