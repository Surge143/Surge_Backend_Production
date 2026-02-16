import { Payload } from 'payload';

/**
 * Award WTCoins to user based on real money spent
 */
export async function awardWTCoins(payload: Payload, userId: number, realMoneySpent: number, orderId: string | number) {
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
                    earningHistory: [
                        {
                            amount: pointsToAward,
                            earnedAt: new Date().toISOString(),
                            expiryDate: expiryDate.toISOString(),
                        }
                    ],
                    redeemedPointsHistory: []
                },
                overrideAccess: true,
            })
            console.log(`✅ Created WTCoins record and awarded ${pointsToAward} points to user ${userId}`)
        } else {
            // Update existing record
            userWTCoins = userRewards.docs[0]
            const newBalance = (userWTCoins.totalBalance || 0) + pointsToAward

            await payload.update({
                collection: 'user-wt-coins',
                id: userWTCoins.id,
                data: {
                    totalBalance: newBalance,
                    earningHistory: [
                        ...(userWTCoins.earningHistory || []),
                        {
                            amount: pointsToAward,
                            earnedAt: new Date().toISOString(),
                            expiryDate: expiryDate.toISOString(),
                        }
                    ]
                },
                overrideAccess: true,
            })
            console.log(`✅ Awarded ${pointsToAward} WTCoins to user ${userId}. New balance: ${newBalance}`)
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
