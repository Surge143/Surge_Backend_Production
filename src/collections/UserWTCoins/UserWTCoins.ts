import type { CollectionConfig } from 'payload';
import { validateFutureDate } from '@/utilities/validateFutureDate';

export const UserWTCoins: CollectionConfig = {
    slug: 'user-wt-coins',
    admin: {
        description: "Aggregated User WT Coins Balance",
        group: 'Loyalty Program',
        useAsTitle: 'user',
    },
    access: {
        read: ({ req: { user } }) => {
            if (!user) return false;
            if (user?.role === 'admin' || user?.role === 'super-admin') return true;
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
            min: 0,
            admin: {
                description: "Current spendable balance",
            }
        },
        {
            name: 'coinEarningHistory',
            type: 'array',
            admin: { description: "Log of all points earned" },
            fields: [
                { name: 'amount', type: 'number', required: true },
                { name: 'earnedAt', type: 'date', defaultValue: () => new Date() },
                { name: 'linkedOrder', type: 'relationship', relationTo: ['web-orders', 'app-orders'] },
                { name: 'expiryDate', type: 'date', validate: validateFutureDate },
            ]
        },
        {
            name: 'pointsRedemptionHistory',
            type: 'array',
            admin: { description: "Log of all points spent" },
            fields: [
                { name: 'redeemedPoints', type: 'number', required: true },
                {
                    name: 'associatedOrder',
                    type: 'relationship',
                    relationTo: ['web-orders', 'app-orders'],
                    required: true,
                },
            ]
        },
    ],
    timestamps: true,
}