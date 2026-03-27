import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Fetch ALL active (placed + shipped) orders with payment completed — no date cap
    const activeResult = await payload.find({
      collection: 'web-orders',
      where: {
        and: [
          { deliveryStatus: { in: ['placed', 'shipped'] } },
          { paymentStatus: { equals: 'completed' } },
        ],
      },
      depth: 2,
      limit: 500,
      sort: '-createdAt',
      overrideAccess: true,
    })

    // Fetch delivered orders for today
    const deliveredResult = await payload.find({
      collection: 'web-orders',
      where: {
        and: [
          { deliveryStatus: { equals: 'delivered' } },
          { paymentStatus: { equals: 'completed' } },
          { createdAt: { greater_than_equal: todayStart.toISOString() } },
        ],
      },
      depth: 2,
      limit: 100,
      sort: '-updatedAt',
      overrideAccess: true,
    })

    // Fetch cancelled/refunded orders for today
    const cancelledResult = await payload.find({
      collection: 'web-orders',
      where: {
        and: [
          { deliveryStatus: { in: ['cancelled', 'refund-initiated', 'refunded'] } },
          { createdAt: { greater_than_equal: todayStart.toISOString() } },
        ],
      },
      depth: 2,
      limit: 100,
      sort: '-updatedAt',
      overrideAccess: true,
    })

    return NextResponse.json({
      orders: activeResult.docs,
      delivered: deliveredResult.docs,
      cancelled: cancelledResult.docs,
    })
  } catch (err: any) {
    console.error('[store-manager/dashboard-data] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
