import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { decryptUrlToken } from '@/app/api/offline-system/_components/decryptToken'
import { headers } from 'next/headers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const decryptedToken = await decryptUrlToken(token)
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    const allowedRoles = ['shop-manager', 'admin', 'super-admin']
    if (!user || !allowedRoles.includes(user.role as string)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized access. Only shop managers and admins can perform this action.',
        },
        { status: 401 },
      )
    }

    const { redeemBeans, referenceId, OrderValue } = (await req.json()) as {
      redeemBeans: boolean
      referenceId: string
      OrderValue: number
    }

    const userId = decryptedToken as any
    const messages: string[] = []

    // 0. Fetch initial states and configuration
    const [WTCoinsConfiguration, userCoinRecords] = await Promise.all([
      payload.findGlobal({
        slug: 'surge-coins',
        depth: 0,
      }) as any,
      payload.find({
        collection: 'user-surge-coins',
        where: { user: { equals: userId } },
        limit: 1,
      }),
    ])

    if (userCoinRecords.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bean record found for user' },
        { status: 404 },
      )
    }

    const beanRecord = userCoinRecords.docs[0]
    const initialBalance = beanRecord.totalBalance || 0
    const rate = WTCoinsConfiguration.pointsToAed || 1

    let pointsToRedeem = 0
    let updatedBeanHistory = [...(beanRecord.coinEarningHistory || [])]

    // 1. DEDUCTION LOGIC (Redeem)
    if (redeemBeans) {
      const minPoints = WTCoinsConfiguration.minPointsPerOrder || 0
      if (minPoints > 0 && initialBalance < minPoints) {
        return NextResponse.json(
          {
            success: false,
            message: `Minimum ${minPoints} points required for redemption. Available: ${initialBalance}`,
          },
          { status: 400 },
        )
      }

      let pointsAvailableToSpend = initialBalance
      const maxPoints = WTCoinsConfiguration.maxPointsPerOrder || 0
      if (maxPoints > 0 && pointsAvailableToSpend > maxPoints) {
        pointsAvailableToSpend = maxPoints
      }

      const maxPointsNeededForOrder = OrderValue * rate
      pointsToRedeem = Math.max(0, Math.min(pointsAvailableToSpend, maxPointsNeededForOrder))

      if (pointsToRedeem > 0) {
        let remainingToDeduct = pointsToRedeem
        updatedBeanHistory = updatedBeanHistory.map((entry: any) => {
          if (remainingToDeduct <= 0) return entry
          const entryRemaining = Number(entry.remainingAmount) || 0
          const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null
          const now = new Date()
          if (entryRemaining > 0 && (!expiryDate || expiryDate > now)) {
            const deduction = Math.min(entryRemaining, remainingToDeduct)
            remainingToDeduct -= deduction
            return {
              ...entry,
              amount: entry.amount,
              remainingAmount: entryRemaining - deduction,
            }
          }
          return entry
        })
        messages.push(`Redeemed ${pointsToRedeem} beans`)
      }
    }

    // 2. EARNING LOGIC
    const redeemedValueAED = pointsToRedeem / rate
    const remainingOrderValue = Math.max(0, OrderValue - redeemedValueAED)

    const pointsEarnRate = WTCoinsConfiguration.pointsEarn || 0 // Percentage
    const pointsToAward = Math.floor(remainingOrderValue * (pointsEarnRate / 100))

    if (pointsToAward > 0) {
      const rewardExpiryMonths = WTCoinsConfiguration.rewardExpiry || 12
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + rewardExpiryMonths)

      updatedBeanHistory.push({
        type: 'offline',
        amount: pointsToAward,
        remainingAmount: pointsToAward,
        earnedAt: new Date().toISOString(),
        offlineReferenceId: referenceId,
        expiryDate: expiryDate.toISOString(),
      })
      messages.push(`Earned ${pointsToAward} beans`)
    }

    // 3. ATOMIC UPDATE
    const pointsRedemptionHistory = [...(beanRecord.pointsRedemptionHistory || [])]
    if (pointsToRedeem > 0) {
      pointsRedemptionHistory.push({
        redeemedPoints: pointsToRedeem,
        type: 'offline',
        offlineReferenceId: referenceId,
        redeemedAt: new Date().toISOString(),
      })
    }

    await payload.update({
      collection: 'user-surge-coins',
      id: beanRecord.id,
      data: {
        coinEarningHistory: updatedBeanHistory,
        pointsRedemptionHistory: pointsRedemptionHistory,
      },
    })

    // 4. Return Summary
    return NextResponse.json({
      success: true,
      message: messages.length > 0 ? messages.join(', ') : 'No bean changes',
      data: {
        referenceId,
        totalBalance: initialBalance - pointsToRedeem + pointsToAward,
        liveBreakdown: {
          orderTotal: OrderValue,
          beansRedeemedValue: redeemedValueAED,
          payableTotal: remainingOrderValue,
          beansEarned: pointsToAward,
        },
      },
    })
  } catch (error) {
    console.error('Error in store rewards route:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    )
  }
}
