import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitSlotUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin', 'shop-manager'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { slotId, ...updateData } = body

    if (!slotId) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 })
    }

    // A shop-manager may only edit their own shop's slots — without this,
    // any shop-manager account could edit any other shop's slots.
    if ((user as any).role === 'shop-manager') {
      const slot = await payload.findByID({
        collection: 'slots',
        id: slotId,
        depth: 0,
        overrideAccess: true,
      }).catch(() => null)
      if (!slot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
      }
      const managedShops = await payload.find({
        collection: 'shop',
        where: { shopManager: { equals: user.id } },
        limit: 1,
        depth: 0,
      })
      const managedShopId = managedShops.docs[0]?.id
      const slotShopId = typeof (slot as any).shop === 'object' ? (slot as any).shop?.id : (slot as any).shop
      if (!managedShopId || String(slotShopId) !== String(managedShopId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updated = await payload.update({
      collection: 'slots',
      id: slotId,
      data: updateData,
      depth: 0,
      overrideAccess: true,
    })

    emitSlotUpdated(updated)

    return NextResponse.json({ success: true, slot: updated })
  } catch (err: any) {
    console.error('[update-slot] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
