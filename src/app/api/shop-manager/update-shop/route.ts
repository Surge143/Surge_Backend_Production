import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitShopStatusUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { shopId, ...updateData } = body

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
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
