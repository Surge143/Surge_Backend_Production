import type { CollectionConfig } from 'payload';

export const UserRewards: CollectionConfig = {
    slug: 'user-rewards',
    admin: {
        description: "User Rewards",
        group: 'Rewards',
    },
    access: {
        read: ({ req: { user } }) => {
            if (!user) return false;
            if (user.role === 'admin' || user.role === 'super-admin') {
                return true;
            }
            return {
                user: {
                    equals: user.id,
                },
            };
        },
        create: ({ req: { user } }) => {
            return !!user;
        },
        update: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        delete: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
    },
    hooks: {
        beforeChange: [
            ({ data, operation, originalDoc }) => {
                if (operation === 'create') {
                    const baseDate = data.earnedAt
                        ? new Date(data.earnedAt)
                        : new Date();

                    const expiryDate = new Date(baseDate);
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                    return {
                        ...data,
                        rewardExpiry: expiryDate.toISOString(),
                    };
                }
                return data;
            },
        ],
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            admin: {
                description: "User",
            }
        },
        {
            name: 'totalEarnedPoints',
            type: 'number',
            required: true,
            admin: {
                description: "Points",
            }
        },
        {
            name: 'rewardExpiry',
            type: 'date',
            required: true,
            admin: {
                description: 'Automatically set to 1 year from earned date',
                readOnly: true,
            },
        },
        {
            name: 'redeemedPointsHistory',
            type: 'array',
            fields: [
                {
                    name: 'redeemedPoints',
                    type: 'number',
                    required: true,
                    admin: {
                        description: "Points",
                    }
                },
                {
                    name: 'associatedOrder',
                    type: 'relationship',
                    relationTo: 'web-orders',
                    required: true,
                    admin: {
                        description: "Order",
                    }
                },
            ]
        },
    ],
    timestamps: true,
}