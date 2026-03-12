import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { decryptUrlToken } from '../../_components/decryptToken'
import { headers } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const decryptedToken = await decryptUrlToken(token)

    try {
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: await headers() })

        const allowedRoles = ['shop-manager', 'admin', 'super-admin']
        if (!user || !allowedRoles.includes(user.role as string)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access. Only shop managers and admins can perform this action.' },
                { status: 401 }
            )
        }

        const usertotalBeans = await payload.find({
            collection: 'user-wt-coins',
            where: {
                user: {
                    equals: decryptedToken
                }
            },
            select: {
                totalBalance: true,
            }
        })

        const userStamps = await payload.find({
            collection: 'wt-stamps',
            where: {
                user: {
                    equals: decryptedToken
                }
            },
            select: {
                stampCount: true,
                stampReward: true,
            }
        })

        console.log(userStamps)

        const totalBeans = usertotalBeans?.docs[0]?.totalBalance || 0
        const totalStamps = userStamps?.docs[0]?.stampCount || 0
        const stampReward = userStamps?.docs[0]?.stampReward || 0

        return NextResponse.json({ success: true, totalBeans, totalStamps, stampReward })
    }
    catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: 'User not found' })
    }
}