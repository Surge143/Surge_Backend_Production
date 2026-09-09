import type { CollectionConfig } from 'payload'

export const WTStamps: CollectionConfig = {
  slug: 'surge-stamps',
  labels: {
    singular: 'Surge Stamp',
    plural: 'Surge Stamps',
  },
  admin: {
    group: 'Loyalty & Rewards',
    description: 'Manage stamp card progress',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  access: {
    // This collection had NO access block at all — every operation defaulted
    // to open, meaning any request (even unauthenticated) could read anyone's
    // stamp/reward balance, and any logged-in user could PATCH their own (or
    // literally anyone's) stampReward to any number and go redeem free items.
    // All legitimate stamp/reward changes happen server-side (the payment
    // webhook, the offline redeem system) via the Local API, which bypasses
    // this entirely — so there's no legitimate customer-facing write path to
    // preserve here.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager') return true
      return { user: { equals: user.id } } as any
    },
    create: ({ req: { user } }) =>
      !!user && (user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager'),
    update: ({ req: { user } }) =>
      !!user && (user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager'),
    delete: ({ req: { user } }) => !!user && (user.role === 'super-admin' || user.role === 'admin'),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
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
      admin: { description: 'Log of all stamps earned' },
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
        {
          name: 'earnedAt',
          type: 'date',
          defaultValue: () => new Date(),
          admin: { readOnly: true },
        },
        {
          name: 'linkedOrder',
          type: 'relationship',
          relationTo: ['web-orders', 'app-orders'],
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
      ],
    },
    {
      name: 'stampsRedemptionHistory',
      type: 'array',
      admin: { description: 'Log of all stamps spent' },
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
          relationTo: ['web-orders', 'app-orders'],
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
        {
          name: 'redeemedAt',
          type: 'date',
          defaultValue: () => new Date(),
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
