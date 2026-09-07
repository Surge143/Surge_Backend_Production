import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    let shopId = searchParams.get('shopId')

    // A shop-manager's shopId is always derived from their own account, never
    // trusted from the query string — otherwise any shop-manager could pass
    // another shop's ID and see that shop's live orders/staff. Admins/super-admins
    // keep the existing behavior (pass a shopId to filter, or omit it to see all).
    if ((user as any).role === 'shop-manager') {
      const managedShops = await payload.find({
        collection: 'shop',
        where: { shopManager: { equals: user.id } },
        limit: 1,
        depth: 0,
      })
      shopId = managedShops.docs[0]?.id ? String(managedShops.docs[0].id) : null
      if (!shopId) {
        return NextResponse.json({ error: 'No shop assigned to this account' }, { status: 403 })
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Fetch today's live orders only
    const ordersResult = await payload.find({
      collection: 'app-orders',
      where: {
        and: [
          {
            or: [
              { orderAcceptance: { equals: 'pending' } },
              {
                and: [
                  { orderAcceptance: { equals: 'accepted' } },
                  {
                    or: [
                      { appOrderStatus: { in: ['pending', 'preparing', 'ready'] } },
                      { appOrderStatusDine: { in: ['pending', 'preparing', 'ready'] } },
                    ],
                  },
                ],
              },
            ],
          },
          { paymentStatus: { equals: 'paid' } },
          { createdAt: { greater_than_equal: todayStart.toISOString() } },
          ...(shopId ? [{ shop: { equals: shopId } }] : []),
        ],
      },
      depth: 3,
      limit: 200,
      sort: '-createdAt',
    })

    const cancelledResult = await payload.find({
      collection: 'app-orders',
      where: {
        and: [
          {
            or: [
              { orderAcceptance: { equals: 'rejected' } },
              { appOrderStatus: { equals: 'cancelled' } },
              { appOrderStatusDine: { equals: 'cancelled' } },
            ],
          },
          { paymentStatus: { in: ['paid', 'refund-initiated', 'refunded', 'failed'] } },
          { createdAt: { greater_than: todayStart.toISOString() } },
          ...(shopId ? [{ shop: { equals: shopId } }] : []),
        ],
      },
      depth: 3,
      limit: 100,
      sort: '-updatedAt',
    })

    // Fetch slots
    const slotsResult = await payload.find({
      collection: 'slots',
      ...(shopId ? { where: { shop: { equals: shopId } } } : {}),
      limit: 50,
      sort: 'slot',
    })

    // Fetch baristas for the requested shop only
    const baristasResult = await payload.find({
      collection: 'admins',
      where: {
        and: [
          { role: { equals: 'barista' } },
          ...(shopId ? [{ shop: { equals: shopId } }] : []),
        ],
      },
      limit: 50,
      overrideAccess: true,
      depth: 0,
    })

    // Fetch shop info
    let shopDoc: any = null
    if (shopId) {
      shopDoc = await payload.findByID({
        collection: 'shop',
        id: shopId,
        depth: 0,
      })
    } else {
      const shopResult = await payload.find({
        collection: 'shop',
        limit: 1,
      })
      shopDoc = shopResult.docs[0] || null
    }

    return NextResponse.json({
      orders: ordersResult.docs,
      cancelled: cancelledResult.docs,
      slots: slotsResult.docs,
      baristas: baristasResult.docs,
      shop: shopDoc,
    })
  } catch (err: any) {
    console.error('[dashboard-data] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
