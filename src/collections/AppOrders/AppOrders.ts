import type { CollectionConfig, Where } from "payload";

export const AppOrders: CollectionConfig = {
    slug: "app-orders",

    labels: {
        singular: "App Order",
        plural: "App Orders"
    },
    admin: {
        defaultColumns: ["name", "shop", "updatedAt"],
        group: 'App',
    },
    hooks: {
        beforeValidate: [
            async ({ data, req: { payload } }) => {
                if (data?.items && Array.isArray(data.items) && data.shop) {
                    const shopId = typeof data.shop === 'object' ? data.shop.id : data.shop;
                    const itemIds = data.items.map((item: any) => typeof item.product === 'object' ? item.product.id : item.product);

                    const menuItems = await payload.find({
                        collection: 'shop-menu',
                        where: {
                            id: { in: itemIds },
                        },
                        depth: 0,
                    });

                    const invalidItems = menuItems.docs.filter(item => item.shop !== shopId);
                    if (invalidItems.length > 0) {
                        throw new Error(`All items in the order must belong to the selected shop. Invalid items found.`);
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
            type: 'tabs',
            tabs: [
                {
                    label: 'Order Details',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: "name",
                                    type: "text",
                                    required: true,
                                    admin: { width: '50%' }
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
                                    admin: { width: '50%' }
                                },
                            ]
                        },
                        {
                            name: 'appOrderStatus',
                            type: 'select',
                            required: true,
                            options: [
                                { label: 'Preparing', value: 'preparing' },
                                { label: 'Pickup', value: 'pickup' },
                                { label: 'Order Pickedup', value: 'pickedup' },
                            ],
                            admin: {
                                condition: (data) => data?.orderAcceptance === 'accepted'
                            }
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: "shop",
                                    type: "relationship",
                                    relationTo: "shop",
                                    required: true,
                                    admin: { width: '50%' },
                                },
                                {
                                    name: 'barista',
                                    type: 'relationship',
                                    relationTo: 'admins',
                                    admin: { width: '50%' },
                                },
                            ]
                        },
                        {
                            name: "items",
                            type: "array",
                            required: true,
                            fields: [
                                {
                                    name: 'product',
                                    type: 'relationship',
                                    relationTo: 'shop-menu',
                                    required: true,
                                },
                                {
                                    name: 'quantity',
                                    type: 'number',
                                    defaultValue: 1,
                                    min: 1,
                                },
                                {
                                    name: 'customizations',
                                    type: 'json',
                                }
                            ]
                        },
                        {
                            name: 'specialInstructions',
                            type: 'textarea',
                        },
                    ]
                },
                {
                    label: 'Logistics & Time',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'orderType',
                                    type: 'select',
                                    options: [
                                        { label: 'Take Away', value: 'take-away' },
                                        { label: 'Dine In', value: 'dine-in' },
                                    ],
                                    required: true,
                                    admin: { width: '50%' }
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
                                        width: '50%',
                                        // FIXED: Ensure strict data check
                                        condition: (data) => data?.orderType === 'take-away',
                                    }
                                },
                            ]
                        },
                        {
                            name: 'slot',
                            type: 'relationship',
                            relationTo: 'slots',
                            admin: {
                                // FIXED: Accessing sibling data inside row/tab
                                condition: (data) => data?.timeSelection === 'custom' && data?.orderType === 'take-away',
                            },
                        },
                    ]
                },
                {
                    label: 'Rewards & Payment',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'isCouponUsed',
                                    type: 'checkbox',
                                    admin: { width: '30%', style: { marginTop: '35px' } }
                                },
                                {
                                    name: 'coupon',
                                    type: 'relationship',
                                    relationTo: 'shop-coupon',
                                    admin: {
                                        width: '70%',
                                        condition: (data) => Boolean(data?.isCouponUsed)
                                    },
                                },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'coinsUsed',
                                    type: 'number',
                                    admin: { width: '50%' }
                                },
                                {
                                    name: 'stampRewards',
                                    type: 'relationship',
                                    relationTo: 'shop-menu',
                                    admin: { width: '50%' },
                                },
                            ]
                        },
                        {
                            name: 'financials',
                            type: 'group',
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'subtotal', type: 'number', admin: { width: '33%' } },
                                        { name: 'discountAmount', type: 'number', admin: { width: '33%' } },
                                        { name: 'total', type: 'number', admin: { width: '34%' } },
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'stripeOrderId',
                            type: 'text',
                            admin: { readOnly: true }
                        },
                    ]
                }
            ]
        },
        {
            name: 'stripeData',
            type: 'json',
            admin: {
                readOnly: true,
                hidden: true,
            }
        }
    ],
}
