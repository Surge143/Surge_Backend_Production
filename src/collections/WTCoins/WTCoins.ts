import type { GlobalConfig } from 'payload'

export const WTCoins: GlobalConfig = {
  slug: 'surge-coins',
  label: {
    singular: 'Surge Coins Configuration',
    plural: 'Surge Coins Configuration',
  },
  admin: {
    description: 'Track coins earned and redeemed',
    group: 'Loyalty & Rewards',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin' 
      return !isAuthorized
    },
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
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
              label: 'Points to earn',
              type: 'number',
              required: true,
              admin: {
                description: 'Points to earn per order in percentage',
              },
            },
            {
              name: 'pointsToAed',
              label: 'Points to AED',
              type: 'number',
              required: true,
              admin: {
                description: 'Points to AED conversion rate in percentage',
              },
            },
            {
              name: 'rewardExpiry',
              label: 'Reward Expiry',
              type: 'number',
              required: true,
              defaultValue: 12,
              admin: {
                description: 'Reward expiry in months',
                readOnly: true,
              },
            },
          ],
        },
        {
          label: 'Redemption Rules',
          fields: [
            {
              name: 'maxPointsPerOrder',
              label: 'Max Points Per Order',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description:
                  'The maximum number of points a user can spend on a single order. Add 0 for no limit.',
              },
            },
            {
              name: 'minPointsPerOrder',
              label: 'Minimum Points for Redemption',
              type: 'number',
              required: true,
              defaultValue: 0,
              admin: {
                description:
                  'Minimum points a user must have to use them in an order. Add 0 for no limit.',
              },
            },
          ],
        },
        {
          label: 'Referral Rewards',
          fields: [
            {
              name: 'referralRewardForReferrer',
              label: 'Coins for Referrer',
              type: 'number',
              required: true,
              defaultValue: 0,
              admin: {
                description:
                  'WTCoins awarded to the user who shared their referral code when the referred user completes their first order.',
              },
            },
            {
              name: 'referralRewardForReferred',
              label: 'Coins for Referred User',
              type: 'number',
              required: true,
              defaultValue: 0,
              admin: {
                description:
                  'WTCoins awarded to the new user who used a referral code on their first order.',
              },
            },
          ],
        },
      ],
    },
  ],
}
