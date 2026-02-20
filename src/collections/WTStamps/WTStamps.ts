import type { CollectionConfig } from 'payload'

export const WTStamps: CollectionConfig = {
    slug: 'wt-stamps',
    labels: {
        singular: 'Stamp',
        plural: 'Stamps',
    },
    admin: {

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
                { name: 'stamps', type: 'number', required: true },
                { name: 'earnedAt', type: 'date', defaultValue: () => new Date() },
                {
                    name: 'linkedOrder',
                    type: 'relationship',
                    relationTo: ['web-orders', 'app-orders'],
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
                    name: 'associatedOrder',
                    type: 'relationship',
                    relationTo: ['web-orders', 'app-orders'],
                    required: true,
                },
            ]
        },
    ]
}