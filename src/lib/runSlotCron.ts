import { getPayload } from 'payload'
import config from '@payload-config'
import { emitOrderUpdated } from '@/utilities/socket'

const THIRTY_MIN_MS = 30 * 60 * 1000

/**
 * Finds all slot orders held in the "scheduledForPrep" hidden state and
 * releases them into the Queued section when within 30 minutes of their slot.
 * Called both from the API route (manual/test trigger) and from instrumentation.ts
 * (automatic 1-minute interval when running on Coolify / self-hosted).
 */
export async function runSlotCron(): Promise<{ released: string[] }> {
  const payload = await getPayload({ config })
  const now = new Date()

  const { docs: scheduledOrders } = await payload.find({
    collection: 'app-orders',
    where: {
      and: [
        { orderAcceptance: { equals: 'accepted' } },
        { scheduledForPrep: { equals: true } },
        { paymentStatus: { equals: 'paid' } },
      ],
    },
    depth: 2,
    limit: 200,
    overrideAccess: true,
  })

  const released: string[] = []

  for (const order of scheduledOrders) {
    const slotDoc =
      typeof (order as any).slot === 'object' && (order as any).slot !== null
        ? (order as any).slot
        : null

    if (!slotDoc || slotDoc.timeSelection === 'now' || !slotDoc.slot) continue

    const slotDate = new Date(slotDoc.slot)
    const todayAtSlotTime = new Date()
    todayAtSlotTime.setHours(slotDate.getHours(), slotDate.getMinutes(), 0, 0)

    const diffMs = todayAtSlotTime.getTime() - now.getTime()

    if (diffMs <= THIRTY_MIN_MS) {
      const updated = await payload.update({
        collection: 'app-orders',
        id: (order as any).id,
        data: { scheduledForPrep: false },
        depth: 3,
        overrideAccess: true,
      })

      emitOrderUpdated(updated)
      released.push(String((order as any).id))
      console.log(
        `[SlotCron] Order ${(order as any).id} released to Queued ` +
          `(slot ${slotDate.getHours()}:${String(slotDate.getMinutes()).padStart(2, '0')}, ` +
          `T-${Math.round(diffMs / 60000)}min)`,
      )
    }
  }

  return { released }
}
