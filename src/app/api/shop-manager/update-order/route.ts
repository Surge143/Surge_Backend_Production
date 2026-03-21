import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitOrderUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { orderId, ...updateData } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
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
