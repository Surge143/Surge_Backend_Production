import { CollectionAfterDeleteHook } from 'payload';

export const afterDeleteHook: CollectionAfterDeleteHook = async ({ doc, req: { payload } }) => {
    if (doc.slot) {
        const slotId = typeof doc.slot === 'object' ? doc.slot.id : doc.slot;
        const ordersInSlot = await payload.find({
            collection: 'app-orders',
            where: {
                slot: { equals: slotId },
                orderAcceptance: { equals: 'accepted' },
            },
            depth: 0,
        });

        const totalLoad = ordersInSlot.docs.length;

        await payload.update({
            collection: 'slots',
            id: slotId,
            data: {
                currentLoad: totalLoad,
            },
        });
    }
};
