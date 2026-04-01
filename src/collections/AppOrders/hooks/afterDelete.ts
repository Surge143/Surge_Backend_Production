import { CollectionAfterDeleteHook } from 'payload'

export const afterDeleteHook: CollectionAfterDeleteHook = async ({ doc, req: { payload } }) => {
  if (doc.slot) {
    try {
      const slotId = typeof doc.slot === 'object' ? doc.slot.id : doc.slot

      // Recalculate total load for the slot
      const ordersInSlot = await payload.find({
        collection: 'app-orders',
        where: {
          slot: { equals: slotId },
          orderAcceptance: { equals: 'accepted' },
        },
        depth: 0,
        overrideAccess: true, // Crucial: ensure hook can read regardless of user permissions
      })

      const totalLoad = ordersInSlot.totalDocs // Use totalDocs for accuracy

      await payload.update({
        collection: 'slots',
        id: slotId,
        data: {
          currentLoad: totalLoad,
        },
        overrideAccess: true, // Crucial: ensure hook can update slots
      })

      console.log(`✅ [afterDelete] Updated load for slot ${slotId} to ${totalLoad}`)
    } catch (err) {
      console.error(`❌ [afterDelete] Error updating slot load after order deletion:`, err)
      // We don't throw here to avoid blocking the deletion itself if the hook fails
    }
  }
}
