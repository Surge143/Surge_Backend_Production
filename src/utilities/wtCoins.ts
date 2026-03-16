import { Payload } from 'payload'

/**
 * Award WTCoins to user based on real money spent
 */
export async function awardWTCoins(
  payload: Payload,
  userId: string | number,
  realMoneySpent: number,
  orderId: string | number,
  collection: 'web-orders' | 'app-orders' = 'web-orders',
) {
  try {
    // Fetch WTCoins configuration
    const wtCoinsConfig = await payload.findGlobal({
      slug: 'wt-coins',
      depth: 1,
      overrideAccess: true,
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

    const userRewards = await payload.find({
      collection: 'user-wt-coins',
      where: { user: { equals: userId } },
      depth: 0,
      overrideAccess: true,
    })

    let userWTCoins: any

    if (userRewards.docs.length === 0) {
      // Create new record
      userWTCoins = await payload.create({
        collection: 'user-wt-coins',
        data: {
          user: userId as any,
          totalBalance: pointsToAward,
          coinEarningHistory: [
            {
              amount: pointsToAward,
              remainingAmount: pointsToAward,
              earnedAt: new Date().toISOString(),
              linkedOrder: {
                relationTo: collection,
                value: orderId as any,
              },
              expiryDate: expiryDate.toISOString(),
            },
          ],
          pointsRedemptionHistory: [],
        },
        overrideAccess: true,
      })
      console.log(
        `✅ [wtCoins] Created record and awarded ${pointsToAward} points to user ${userId}`,
      )
    } else {
      // Update existing record
      userWTCoins = userRewards.docs[0]

      const history = userWTCoins.coinEarningHistory || []
      const alreadyAwarded = history.some(
        (entry: any) =>
          entry.linkedOrder &&
          entry.linkedOrder.relationTo === collection &&
          String(entry.linkedOrder.value) === String(orderId),
      )

      if (alreadyAwarded) {
        console.log(`⚠️ [wtCoins] Order ${orderId} already has points awarded. Skipping.`)
        return
      }

      const newHistory = [
        ...history,
        {
          amount: pointsToAward,
          remainingAmount: pointsToAward,
          earnedAt: new Date().toISOString(),
          linkedOrder: {
            relationTo: collection,
            value: orderId as any,
          },
          expiryDate: expiryDate.toISOString(),
        },
      ]

      // Compute new totalBalance directly to avoid relying solely on afterChange hook
      const nowForBalance = new Date()
      const newTotalBalance = newHistory.reduce((acc: number, entry: any) => {
        const exp = entry.expiryDate ? new Date(entry.expiryDate) : null
        if (!exp || exp > nowForBalance) {
          return acc + (entry.remainingAmount || 0)
        }
        return acc
      }, 0)

      await payload.update({
        collection: 'user-wt-coins',
        id: userWTCoins.id,
        data: {
          coinEarningHistory: newHistory,
          totalBalance: newTotalBalance,
        },
        overrideAccess: true,
      })
      console.log(
        `✅ [wtCoins] Awarded ${pointsToAward} WTCoins to user ${userId}. New totalBalance: ${newTotalBalance}.`,
      )
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
  relationTo: 'web-orders' | 'app-orders' = 'web-orders',
) {
  try {
    console.log(`🎬 [wtCoins] Starting FIFO deduction for user ${userId}:`)
    console.log(`   - pointsUsed: ${pointsUsed}`)
    console.log(`   - orderId: ${orderId}`)
    console.log(`   - relationTo: ${relationTo}`)

    // Find user's WTCoins record
    const userRewards = await payload.find({
      collection: 'user-wt-coins',
      where: { user: { equals: userId } },
      depth: 0,
      overrideAccess: true,
    })

    const record = userRewards.docs[0]
    console.log(`   - Found record ID: ${record.id}`)
    console.log(`   - Current totalBalance: ${record.totalBalance}`)

    let pointsToDeduct = Math.round(pointsUsed)
    const now = new Date()

    // --- FIFO DEDUCTION LOGIC ---
    // Sort history by earnedAt (oldest first)
    const earningHistory = [...(record.coinEarningHistory || [])].sort(
      (a: any, b: any) => new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime(),
    )

    console.log(`   - Earning history entries: ${earningHistory.length}`)

    let actualDeducted = 0
    const updatedHistory = earningHistory.map((entry: any, index: number) => {
      const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null
      const isExpired = expiryDate && expiryDate <= now

      if (pointsToDeduct > 0 && !isExpired && (entry.remainingAmount || 0) > 0) {
        const deduction = Math.min(entry.remainingAmount, pointsToDeduct)
        pointsToDeduct -= deduction
        actualDeducted += deduction
        console.log(
          `   - Entry ${index}: Deducted ${deduction}, Remaining in entry: ${entry.remainingAmount - deduction}`,
        )
        return {
          ...entry,
          remainingAmount: Math.max(0, entry.remainingAmount - deduction),
        }
      }
      return entry
    })

    if (pointsToDeduct > 0) {
      console.warn(
        `⚠️ [wtCoins] User ${userId} requested ${pointsUsed} but had only ${pointsUsed - pointsToDeduct} available.`,
      )
    }

    // Properly format redemption history
    const processedRedemptionHistory = (record.pointsRedemptionHistory || []).map((h: any) => {
      const associatedValue =
        h.associatedOrder?.value !== undefined ? h.associatedOrder.value : h.associatedOrder

      return {
        redeemedPoints: h.redeemedPoints,
        associatedOrder: {
          relationTo: h.associatedOrder?.relationTo || relationTo,
          value: associatedValue,
        },
      }
    })

    const finalRedeemed = Math.round(pointsUsed - pointsToDeduct)
    console.log(`   - Final points to redeem: ${finalRedeemed}`)

    // Compute the new totalBalance directly here (sum of non-expired remainingAmounts)
    // so the afterChange hook has accurate data and we don't rely on async hook timing
    const now2 = new Date()
    const newTotalBalance = updatedHistory.reduce((acc: number, entry: any) => {
      const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null
      if (!expiryDate || expiryDate > now2) {
        return acc + (entry.remainingAmount || 0)
      }
      return acc
    }, 0)
    console.log(`   - New computed totalBalance: ${newTotalBalance}`)

    console.log(`   - Executing payload.update for user-wt-coins record ${record.id}...`)
    const updateResult = await payload.update({
      collection: 'user-wt-coins',
      id: record.id,
      data: {
        coinEarningHistory: updatedHistory,
        totalBalance: newTotalBalance,
        pointsRedemptionHistory: [
          ...processedRedemptionHistory,
          {
            redeemedPoints: finalRedeemed,
            associatedOrder: {
              relationTo: relationTo,
              value: orderId,
            },
          },
        ],
      },
      overrideAccess: true,
    })

    if (!updateResult) {
      console.error(
        `❌ [wtCoins] payload.update returned null or undefined for record ${record.id}`,
      )
    } else {
      console.log(
        `✅ [wtCoins] Successfully updated record ${record.id} for user ${userId}. Total deducted: ${finalRedeemed}, New Balance: ${newTotalBalance}`,
      )
    }
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
      overrideAccess: true,
    })

    if (!wtCoinsConfig) return 0

    const pointsToAedRate = wtCoinsConfig.pointsToAed || 1
    return points / pointsToAedRate
  } catch (error) {
    console.error('❌ [wtCoins] Error converting points to AED:', error)
    return 0
  }
}
