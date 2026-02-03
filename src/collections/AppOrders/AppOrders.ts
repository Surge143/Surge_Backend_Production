import type { CollectionConfig } from "payload";

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
        afterChange: [
            async ({ doc, operation }) => {
                if (operation === 'create') {
                    // This runs on the server every time a new order is made
                    const { emitOrderCreated } = await import('@/utilities/socket');
                    emitOrderCreated(doc);
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
        },
        {
            name: "menuRelation",
            type: "relationship",
            relationTo: "shop-menu",
            hasMany: true,
            required: true,
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
        }
    ],
}