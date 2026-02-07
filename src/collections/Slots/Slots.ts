import type { CollectionConfig } from "payload";

export const Slots: CollectionConfig = {
    slug: "slots",
    labels: {
        singular: "Slot",
        plural: "Slots"
    },
    admin: {
        defaultColumns: ["slot", "shop", "currentLoad", "maxCapacity", "isActive"],
        group: 'App',
        useAsTitle: 'slot',
    },
    hooks: {
        beforeChange: [
            async ({ data, req, operation }) => {
                const { user, payload } = req;

                if (operation === 'create' && user) {
                    // 1. AUTO-CONTEXT: Assign the manager
                    data.shopManager = user.id;

                    // 2. AUTO-CONTEXT: Find and assign the shop managed by this user
                    const managedShop = await payload.find({
                        collection: 'shop',
                        where: { shopManager: { equals: user.id } },
                        limit: 1,
                    });

                    if (managedShop.docs.length > 0) {
                        data.shop = managedShop.docs[0].id;
                    }

                    // 3. TIME DEFINITION: Handle "Set to Now" logic
                    if (data.timeSelection === 'now') {
                        data.slot = new Date().toISOString();
                    }
                }
                return data;
            }
        ]
    },
    fields: [
        {
            type: 'row',
            fields: [
                {
                    name: 'isActive',
                    type: 'checkbox',
                    label: 'Accepting Bookings',
                    defaultValue: true,
                    admin: { width: '50%', style: { marginTop: '35px' } }
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
                        layout: 'horizontal',
                    }
                },
            ]
        },
        {
            name: 'slot',
            type: 'date',
            required: true,
            admin: {
                date: {
                    pickerAppearance: 'timeOnly',
                    displayFormat: 'HH:mm',
                    timeIntervals: 30,
                },
                condition: (data) => data?.timeSelection === 'custom',
            },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'maxCapacity',
                    type: 'number',
                    label: 'Maximum Capacity (Orders)',
                    required: true,
                    defaultValue: 20,
                    admin: { description: 'Total number of orders allowed for this slot.' }
                },
                {
                    name: 'currentLoad',
                    type: 'number',
                    label: 'Current Load',
                    defaultValue: 0,
                    admin: {
                        readOnly: true,
                        description: 'Total count of accepted orders in this slot.'
                    }
                },
            ]
        },
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            admin: { position: 'sidebar', readOnly: true },
        },
        {
            name: 'shopManager',
            type: 'relationship',
            relationTo: 'admins',
            admin: { position: 'sidebar', readOnly: true },
        },
    ],
};