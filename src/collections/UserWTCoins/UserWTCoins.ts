import type { CollectionConfig } from 'payload';

export const UserWTCoins: CollectionConfig = {
    slug: 'user-wt-coins',
    admin: {
        description: "Aggregated User WT Coins Balance",
        group: 'WTCoins',
        useAsTitle: 'user',
    },
    access: {
        read: ({ req: { user } }) => {
            if (!user) return false;
            if (user.role === 'admin' || user.role === 'super-admin') return true;
            return { user: { equals: user.id } };
        },
        create: ({ req: { user } }) => !!user,
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true, // Crucial: One record per user
            admin: {
                description: "User who owns this balance",
            }
        },
        {
            name: 'totalBalance',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: "Current spendable balance",
            }
        },
        {
            name: 'earningHistory',
            type: 'array',
            admin: { description: "Log of all points earned" },
            fields: [
                { name: 'amount', type: 'number', required: true },
                { name: 'earnedAt', type: 'date', defaultValue: () => new Date() },
                { name: 'expiryDate', type: 'date' },
            ]
        },
        {
            name: 'redeemedPointsHistory',
            type: 'array',
            admin: { description: "Log of all points spent" },
            fields: [
                { name: 'redeemedPoints', type: 'number', required: true },
                {
                    name: 'associatedOrder',
                    type: 'relationship',
                    relationTo: 'web-orders',
                    required: true,
                },
            ]
        },
    ],
    timestamps: true,
}