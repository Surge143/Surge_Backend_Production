import type { CollectionConfig, CollectionAfterChangeHook } from 'payload';
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
                description: "Current spendable balance (calculated from active earnings)",
                readOnly: true,
            }
        },
        {
            name: 'coinEarningHistory',
            type: 'array',
            admin: { description: "Log of all points earned" },
            fields: [
                { name: 'amount', type: 'number', required: true },
                {
                    name: 'remainingAmount',
                    type: 'number',
                    required: true,
                    admin: { description: "Points remaining from this earning that haven't expired or been used" }
                },
                { name: 'earnedAt', type: 'date', defaultValue: () => new Date() },
                { name: 'linkedOrder', type: 'relationship', relationTo: ['web-orders', 'app-orders', 'web-subscription'] },
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
                    relationTo: ['web-orders', 'app-orders', 'web-subscription'],
                    required: true,
                },
            ]
        },
    ],
    hooks: {
        afterChange: [
            async ({ doc, req: { payload } }) => {
                // Calculate total balance from non-expired earnings with remaining points
                const now = new Date();
                const totalBalance = (doc.coinEarningHistory || []).reduce((acc: number, entry: any) => {
                    const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null;
                    if (!expiryDate || expiryDate > now) {
                        return acc + (entry.remainingAmount || 0);
                    }
                    return acc;
                }, 0);

                // Update totalBalance if it differs (to avoid infinite hook loops)
                if (doc.totalBalance !== totalBalance) {
                    await payload.update({
                        collection: 'user-wt-coins',
                        id: doc.id,
                        data: {
                            totalBalance: totalBalance,
                        },
                        // Important: override access and skip hooks to avoid recursion
                        overrideAccess: true,
                    });
                }
            }
        ]
    },
    timestamps: true,
}