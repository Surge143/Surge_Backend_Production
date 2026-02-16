import type { GlobalConfig } from 'payload'

export const WTCoins: GlobalConfig = {
    slug: 'wt-coins',
    admin: {
        description: "White Mantis Coins Configuration",
        group: 'WTCoins',
    },
    access: {
        read: () => true,
        update: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Earning Rates',
                    fields: [
                        {
                            name: 'pointsEarn',
                            label: "Points to earn",
                            type: 'number',
                            required: true,
                            admin: {
                                description: "Points to earn per order in percentage"
                            }
                        },
                        {
                            name: 'pointsToAed',
                            label: "Points to AED",
                            type: 'number',
                            required: true,
                            admin: {
                                description: "Points to AED conversion rate in percentage",
                            }
                        },
                        {
                            name: 'rewardExpiry',
                            label: "Reward Expiry",
                            type: 'number',
                            required: true,
                            defaultValue: 12,
                            admin: {
                                description: "Reward expiry in months",
                                readOnly: true,
                            }
                        }
                    ]
                },
                {
                    label: 'Redemption Rules',
                    fields: [
                        {
                            name: 'maxPointsPerOrder',
                            label: "Max Points Per Order",
                            type: 'number',
                            required: true,
                            defaultValue: 0,
                            min: 0,
                            admin: {
                                description: "The maximum number of points a user can spend on a single order. Add 0 for no limit."
                            }
                        },
                        {
                            name: 'minPointsPerOrder',
                            label: "Minimum Points for Redemption",
                            type: 'number',
                            required: true,
                            defaultValue: 0,
                            admin: {
                                description: "Minimum points a user must have to use them in an order. Add 0 for no limit."
                            }
                        },
                    ]
                }
            ]
        }
    ],
}