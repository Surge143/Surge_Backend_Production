import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitWebOrderUpdated } from '@/utilities/socket'

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['admin', 'super-admin'].includes((user as any).role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { orderId, ...updateData } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'web-orders',
      id: orderId,
      data: updateData,
      depth: 2,
      overrideAccess: true,
    })

    // Emit real-time update
    emitWebOrderUpdated(updated)

    return NextResponse.json({ success: true, order: updated })
  } catch (err: any) {
    console.error('[update-web-order] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
