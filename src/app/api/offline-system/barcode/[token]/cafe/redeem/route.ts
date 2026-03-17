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

    const { stampsRewardRedeemed, referenceId, OrderValue, beansRedeemed } = (await req.json()) as {
      stampsRewardRedeemed: boolean
      referenceId: string
      OrderValue: number
      beansRedeemed: boolean
    }

    const userId = decryptedToken as any
    const messages: string[] = []
    let stampRecord: any = null
    let beanRecord: any = null
    let pointsToRedeem = 0
    let updatedBeanHistory: any[] = []

    // 0. FETCH INITIAL STATES for Summary
    const [stampRecords, userCoinRecords] = await Promise.all([
      payload.find({
        collection: 'wt-stamps',
        where: { user: { equals: userId } },
        limit: 1,
      }),
      payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: userId } },
        limit: 1,
      }),
    ])

    stampRecord = stampRecords.docs[0] || null
    beanRecord = userCoinRecords.docs[0] || null

    const initialRewards = {
      beans: beanRecord?.totalBalance || 0,
      stampRewards: stampRecord?.stampReward || 0,
      stamps: stampRecord?.stampCount || 0,
    }

    // 1. PRE-VALIDATION: Check all requested redemptions first
    if (stampsRewardRedeemed) {
      if (!stampRecord) {
        return NextResponse.json(
          { success: false, message: 'No stamp record found for user' },
          { status: 404 },
        )
      }

      if ((stampRecord.stampReward || 0) < 1) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stamp rewards' },
          { status: 400 },
        )
      }
    }

    if (beansRedeemed) {
      const WTCoinsConfiguration: any = await payload.findGlobal({
        slug: 'wt-coins',
        depth: 0,
      })

      if (!beanRecord) {
        return NextResponse.json(
          { success: false, message: 'No bean record found for user' },
          { status: 404 },
        )
      }

      const userBalance = beanRecord.totalBalance || 0

      // 1. Check Minimum requirement
      const minPoints = WTCoinsConfiguration.minPointsPerOrder || 0
      if (minPoints > 0 && userBalance < minPoints) {
        return NextResponse.json(
          {
            success: false,
            message: `Minimum ${minPoints} points required for redemption. Available: ${userBalance}`,
          },
          { status: 400 },
        )
      }

      // 2. Determine points available to spend (respecting Max limit)
      let pointsAvailableToSpend = userBalance
      const maxPoints = WTCoinsConfiguration.maxPointsPerOrder || 0
      if (maxPoints > 0 && pointsAvailableToSpend > maxPoints) {
        pointsAvailableToSpend = maxPoints
      }

      // 3. Calculate points needed for the full order total
      const rate = WTCoinsConfiguration.pointsToAed || 1
      const maxPointsNeededForOrder = OrderValue * rate

      // 4. Final points to use (cannot exceed available or what's needed for the order)
      pointsToRedeem = Math.max(0, Math.min(pointsAvailableToSpend, maxPointsNeededForOrder))

      // Calculate updated history for beans (FIFO)
      let remainingToDeduct = pointsToRedeem
      updatedBeanHistory = (beanRecord.coinEarningHistory || []).map((entry: any) => {
        if (remainingToDeduct <= 0) return entry

        const entryRemaining = Number(entry.remainingAmount) || 0
        const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null
        const now = new Date()

        if (entryRemaining > 0 && (!expiryDate || expiryDate > now)) {
          const deduction = Math.min(entryRemaining, remainingToDeduct)
          remainingToDeduct -= deduction
          return {
            ...entry,
            amount: entry.amount, // Explicitly keep original earned amount
            remainingAmount: entryRemaining - deduction,
          }
        }
        return entry
      })

      if (remainingToDeduct > 0) {
        return NextResponse.json(
          { success: false, message: 'Internal error: balance calculation mismatch' },
          { status: 500 },
        )
      }
    }

    // 2. EXECUTION
    if (stampsRewardRedeemed && stampRecord) {
      await payload.update({
        collection: 'wt-stamps',
        id: stampRecord.id,
        data: {
          stampReward: (stampRecord.stampReward || 0) - 1,
          stampsRedemptionHistory: [
            ...(stampRecord.stampsRedemptionHistory || []),
            {
              redeemedStamps: 1,
              type: 'offline',
              offlineReferenceId: referenceId,
              redeemedAt: new Date().toISOString(),
            },
          ],
        },
      })
      messages.push('Stamp reward redeemed successfully')
    }

    if (beansRedeemed && beanRecord && pointsToRedeem > 0) {
      await payload.update({
        collection: 'user-wt-coins',
        id: beanRecord.id,
        data: {
          coinEarningHistory: updatedBeanHistory,
          pointsRedemptionHistory: [
            ...(beanRecord.pointsRedemptionHistory || []),
            {
              redeemedPoints: pointsToRedeem,
              type: 'offline',
              offlineReferenceId: referenceId,
              redeemedAt: new Date().toISOString(),
            },
          ],
        },
      })
      messages.push(`Beans redeemed successfully (${pointsToRedeem} points)`)
    }

    return NextResponse.json({
      success: true,
      message: messages.length > 0 ? messages.join(', ') : 'No redemption requested',
      data: {
        referenceId,
        orderValue: OrderValue,
        summary: {
          beans: {
            initial: initialRewards.beans,
            final: initialRewards.beans - pointsToRedeem,
          },
          stampRewards: {
            initial: initialRewards.stampRewards,
            final: initialRewards.stampRewards - (stampsRewardRedeemed ? 1 : 0),
          },
          stamps: {
            initial: `${initialRewards.stamps}/10`,
            final: `${initialRewards.stamps}/10`, // Not changed in redemption
          },
        },
      },
    })
  } catch (error) {
    console.error('Error redeeming rewards:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    )
  }
}
