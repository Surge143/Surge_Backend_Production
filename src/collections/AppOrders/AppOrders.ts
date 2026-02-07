import type { CollectionConfig, Where } from "payload";

export const AppOrders: CollectionConfig = {
    slug: "app-orders",
    labels: {
        singular: "App Order",
        plural: "App Orders"
    },
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "shop", "updatedAt"],
        group: 'App',
    },
    hooks: {
        beforeValidate: [
            async ({ data, req: { payload } }) => {
                if (data?.menuRelation && data?.shop) {
                    const shopId = typeof data.shop === 'object' ? data.shop.id : data.shop;
                    const menuItems = await payload.find({
                        collection: 'shop-menu',
                        where: {
                            id: { in: data.menuRelation },
                        },
                        depth: 0,
                    });

                    const invalidItems = menuItems.docs.filter(item => item.shop !== shopId);
                    if (invalidItems.length > 0) {
                        throw new Error('All items in the order must belong to the selected shop.');
                    }
                }
                return data;
            },
        ],
        beforeChange: [],
        afterChange: [
            async ({ doc, previousDoc, operation, req: { payload } }) => {
                // Import the socket utilities
                const { emitOrderCreated, emitOrderUpdated } = await import('@/utilities/socket');

                if (operation === 'create') {
                    emitOrderCreated(doc);
                } else if (operation === 'update') {
                    emitOrderUpdated(doc);
                }

                // Handle Slot Load Update
                const updateSlotLoad = async (slotId: string) => {
                    const ordersInSlot = await payload.find({
                        collection: 'app-orders',
                        where: {
                            slot: { equals: slotId },
                            orderAcceptance: { equals: 'accepted' }, // Only count accepted orders? Or all except rejected?
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
                };

                if (doc.slot) {
                    await updateSlotLoad(typeof doc.slot === 'object' ? doc.slot.id : doc.slot);
                }

                if (previousDoc && previousDoc.slot && previousDoc.slot !== doc.slot) {
                    await updateSlotLoad(typeof previousDoc.slot === 'object' ? previousDoc.slot.id : previousDoc.slot);
                }
            }
        ],
        afterDelete: [
            async ({ doc, req: { payload } }) => {
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
            }
        ]
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "shop",
            type: "relationship",
            relationTo: "shop",
            required: true,
            filterOptions: async ({ req }) => {
                const { user, payload } = req;
                if (!user) return false;
                if (user.role === 'super-admin' || user.role === 'admin') return true;

                if (user.role === 'shop-manager') {
                    const managedShops = await payload.find({
                        collection: 'shop',
                        where: { shopManager: { equals: user.id } },
                        limit: 1,
                        depth: 0,
                    });
                    if (managedShops.docs.length > 0) {
                        return {
                            id: { equals: managedShops.docs[0].id }
                        };
                    }
                }
                return false;
            }
        },
        {
            name: 'barista',
            type: 'relationship',
            relationTo: 'admins',
            filterOptions: async ({ req }) => {
                const { user, payload } = req;
                if (!user) return false;

                if (user.role === 'super-admin' || user.role === 'admin') {
                    return {
                        role: { equals: 'barista' }
                    };
                }

                if (user.role === 'shop-manager') {
                    const managedShops = await payload.find({
                        collection: 'shop',
                        where: {
                            shopManager: { equals: user.id }
                        },
                        limit: 1,
                        depth: 0,
                    });

                    if (managedShops.docs.length > 0) {
                        return {
                            and: [
                                { role: { equals: 'barista' } },
                                { shop: { equals: managedShops.docs[0].id } }
                            ]
                        };
                    }
                }

                return {
                    role: { equals: 'barista' }
                } as Where
            }
        },
        {
            name: "menuRelation",
            type: "relationship",
            relationTo: "shop-menu",
            hasMany: true,
            required: true,
            filterOptions: ({ data }) => {
                if (data?.shop) {
                    return {
                        shop: { equals: data.shop }
                    };
                }
                return false;
            }
        },
        {
            name: 'orderAcceptance',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Accepted', value: 'accepted' },
                { label: 'Rejected', value: 'rejected' },
            ],
            required: true,
        },

        {
            name: 'timeSelection',
            type: 'radio',
            defaultValue: 'now',
            options: [
                { label: 'Set to Now', value: 'now' },
                { label: 'Specific Time Slot', value: 'custom' },
            ],
            admin: {
                layout: 'horizontal',
            }
        },
        {
            name: 'slot',
            type: 'relationship',
            relationTo: 'slots',
            required: false,
            admin: {
                condition: (data) => data?.timeSelection === 'custom',
            },
        },
    ],
}