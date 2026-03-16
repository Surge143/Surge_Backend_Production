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

    const { stampsEarned, referenceId } = (await req.json()) as {
      stampsEarned: number
      referenceId: string
    }

    // Find existing stamp record for user
    const stampRecords = await payload.find({
      collection: 'wt-stamps',
      where: {
        user: {
          equals: decryptedToken,
        },
      },
    })

    let stampCount = stampsEarned
    let stampReward = 0
    let recordId: any = null

    if (stampRecords.docs.length > 0) {
      const record = stampRecords.docs[0]
      recordId = record.id
      const totalStamps = (record.stampCount || 0) + stampsEarned

      // Calculate rewards (rollover at 10)
      const earnedRewards = Math.floor(totalStamps / 10)
      stampCount = totalStamps % 10
      stampReward = (record.stampReward || 0) + earnedRewards
    } else {
      // First time earning stamps
      const earnedRewards = Math.floor(stampsEarned / 10)
      stampCount = stampsEarned % 10
      stampReward = earnedRewards
    }

    const earningHistoryItem = {
      type: 'offline' as const,
      stamps: stampsEarned,
      earnedAt: new Date().toISOString(),
      referenceId,
    }

    if (recordId) {
      await payload.update({
        collection: 'wt-stamps',
        id: recordId,
        data: {
          stampCount,
          stampReward,
          stampEarningHistory: [
            ...(stampRecords.docs[0].stampEarningHistory || []),
            earningHistoryItem,
          ],
        },
      })
    } else {
      await payload.create({
        collection: 'wt-stamps',
        data: {
          user: decryptedToken,
          stampCount,
          stampReward,
          stampEarningHistory: [earningHistoryItem],
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Stamps updated successfully',
      data: {
        stampCount,
        stampReward,
      },
    })
  } catch (error) {
    console.error('Error earning stamps:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    )
  }
}
