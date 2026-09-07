import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitOrderUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { orderId, ...updateData } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // A shop-manager may only edit their own shop's orders — without this,
    // any shop-manager account could edit any other shop's orders.
    if ((user as any).role === 'shop-manager') {
      const order = await payload.findByID({
        collection: 'app-orders',
        id: orderId,
        depth: 0,
        overrideAccess: true,
      }).catch(() => null)
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      const managedShops = await payload.find({
        collection: 'shop',
        where: { shopManager: { equals: user.id } },
        limit: 1,
        depth: 0,
      })
      const managedShopId = managedShops.docs[0]?.id
      const orderShopId = typeof (order as any).shop === 'object' ? (order as any).shop?.id : (order as any).shop
      if (!managedShopId || String(orderShopId) !== String(managedShopId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updated = await payload.update({
      collection: 'app-orders',
      id: orderId,
      data: updateData,
      depth: 3,
      overrideAccess: true,
    })

    // Emit real-time update
    emitOrderUpdated(updated)

    return NextResponse.json({ success: true, order: updated })
  } catch (err: any) {
    console.error('[update-order] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
