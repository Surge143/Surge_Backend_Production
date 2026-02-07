import type { GlobalConfig } from "payload";

const emiratesList = [
    'Abu Dhabi',
    'Dubai',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah'
];

export const ShipAndTax: GlobalConfig = {
    slug: 'ship-and-tax',
    admin: {
        group: 'Settings',
    },
    access: {
        read: () => true,
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'tax',
            label: 'Tax',
            type: 'number',
            admin: {
                width: '50%',
                description: 'Add tax percentage here (e.g., 5 for 5%)'
            },
        },
        {
            name: 'emirateCharges',
            label: 'Shipping Charges by Emirate (AED)',
            type: 'group',
            admin: {
                description: 'Add shipping charges for each emirate in AED'
            },
            fields: [

                {
                    type: 'row',
                    fields: [
                        {
                            name: 'abu_dhabi',
                            label: 'Abu Dhabi',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                        {
                            name: 'dubai',
                            label: 'Dubai',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'sharjah',
                            label: 'Sharjah',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                        {
                            name: 'ajman',
                            label: 'Ajman',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'umm_al_quwain',
                            label: 'Umm Al Quwain',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                        {
                            name: 'ras_al_khaimah',
                            label: 'Ras Al Khaimah',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'fujairah',
                            label: 'Fujairah',
                            type: 'number',
                            admin: { width: '50%' },
                        },
                    ],
                },
            ],
        },
    ],
}