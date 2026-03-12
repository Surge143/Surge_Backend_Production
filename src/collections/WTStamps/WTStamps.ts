import type { CollectionConfig } from 'payload'

export const WTStamps: CollectionConfig = {
    slug: 'wt-stamps',
    labels: {
        singular: 'Stamp',
        plural: 'Stamps',
    },
    admin: {
        group: 'Loyalty Program',
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'stampCount',
            type: 'number',
            required: true,
            defaultValue: 0,
            min: 0,
            max: 10,
        },
        {
            name: 'stampReward',
            type: 'number',
            required: true,
            defaultValue: 0,
            min: 0,
        },
        {
            name: 'stampEarningHistory',
            type: 'array',
            admin: { description: "Log of all stamps earned" },
            fields: [
                {
                    name: 'type',
                    type: 'select',
                    defaultValue: 'online',
                    options: [
                        { label: 'Offline', value: 'offline' },
                        { label: 'Online', value: 'online' },
                    ],
                },
                { name: 'stamps', type: 'number', required: true },
                { name: 'earnedAt', type: 'date', defaultValue: () => new Date(), admin: { readOnly: true } },
                {
                    name: 'linkedOrder',
                    type: 'relationship',
                    relationTo: ['web-orders', 'app-orders', 'web-subscription'],
                    admin: {
                        condition: (data, siblingData) => siblingData.type === 'online',
                    },
                },
                {
                    name: 'offlineReferenceId',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData) => siblingData.type === 'offline',
                    },
                },
            ]
        },
        {
            name: 'stampsRedemptionHistory',
            type: 'array',
            admin: { description: "Log of all stamps spent" },
            fields: [
                { name: 'redeemedStamps', type: 'number', required: true },
                {
                    name: 'type',
                    type: 'select',
                    defaultValue: 'online',
                    options: [
                        { label: 'Offline', value: 'offline' },
                        { label: 'Online', value: 'online' },
                    ],
                },
                {
                    name: 'associatedOrder',
                    type: 'relationship',
                    relationTo: ['web-orders', 'app-orders', 'web-subscription'],
                    validate: (value, { siblingData }) => {
                        if (siblingData?.type === 'online' && !value) {
                            return 'This field is required for online transactions'
                        }
                        return true
                    },
                    admin: {
                        condition: (data, siblingData) => siblingData.type === 'online',
                    },
                },
                {
                    name: 'offlineReferenceId',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData) => siblingData.type === 'offline',
                    },
                },
                { name: 'redeemedAt', type: 'date', defaultValue: () => new Date(), admin: { readOnly: true } },
            ]
        },
    ]
}