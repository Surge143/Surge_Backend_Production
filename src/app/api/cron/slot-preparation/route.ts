import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { emitOrderUpdated } from '@/utilities/socket'

export async function GET(req: NextRequest) {
  // Allow only internal cron calls
  const secret = req.headers.get('x-cron-secret')
  if (secret !== (process.env.CRON_SECRET || 'slot-cron-internal')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const now = new Date()

    // Find all orders that are accepted but not yet started (queued section)
    const { docs: queuedOrders } = await payload.find({
      collection: 'app-orders',
      where: {
        and: [
          { orderAcceptance: { equals: 'accepted' } },
          { appOrderStatus: { equals: 'pending' } },
          { paymentStatus: { equals: 'paid' } },
        ],
      },
      depth: 2,
      limit: 200,
      overrideAccess: true,
    })

    const promoted: string[] = []

    for (const order of queuedOrders) {
      // Skip "now" orders — they have no scheduled time
      if ((order as any).timeSelection === 'now') continue

      const slotDoc =
        typeof (order as any).slot === 'object' && (order as any).slot !== null
          ? (order as any).slot
          : null

      if (!slotDoc || slotDoc.timeSelection === 'now' || !slotDoc.slot) continue

      // The slot.slot field is a date type (timeOnly picker) — only the hour:minute matters.
      // Build today's datetime at that hour:minute so we can compare with now.
      const slotDate = new Date(slotDoc.slot)
      const todayAtSlotTime = new Date()
      todayAtSlotTime.setHours(slotDate.getHours(), slotDate.getMinutes(), 0, 0)

      // Promote to preparing if we are within 30 minutes of the slot time
      const diffMs = todayAtSlotTime.getTime() - now.getTime()
      if (diffMs <= 30 * 60 * 1000) {
        const updated = await payload.update({
          collection: 'app-orders',
          id: (order as any).id,
          data: {
            appOrderStatus: 'preparing',
            appOrderStatusDine: 'preparing',
          },
          depth: 3,
          overrideAccess: true,
        })

        emitOrderUpdated(updated)
        promoted.push(String((order as any).id))
        console.log(
          `[SlotCron] Order ${(order as any).id} → preparing (slot ${slotDate.getHours()}:${String(slotDate.getMinutes()).padStart(2, '0')})`,
        )
      }
    }

    return NextResponse.json({ success: true, promoted })
  } catch (err: any) {
    console.error('[SlotCron] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
