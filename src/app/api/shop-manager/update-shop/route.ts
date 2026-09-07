import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitShopStatusUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { shopId, ...updateData } = body

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // A shop-manager may only edit their own shop — without this, any
    // shop-manager account could edit any other shop's settings.
    if ((user as any).role === 'shop-manager') {
      const managedShops = await payload.find({
        collection: 'shop',
        where: { shopManager: { equals: user.id } },
        limit: 1,
        depth: 0,
      })
      const managedShopId = managedShops.docs[0]?.id
      if (!managedShopId || String(shopId) !== String(managedShopId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updated = await payload.update({
      collection: 'shop',
      id: shopId,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    })

    emitShopStatusUpdated(updated)

    return NextResponse.json({ success: true, shop: updated })
  } catch (err: any) {
    console.error('[update-shop] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
