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
