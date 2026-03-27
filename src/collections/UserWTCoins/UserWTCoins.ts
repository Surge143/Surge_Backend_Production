import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { validateFutureDate } from '@/utilities/validateFutureDate'

export const UserWTCoins: CollectionConfig = {
  slug: 'user-wt-coins',
  labels: {
    singular: 'WT Beans Customer',
    plural: 'WT Beans Customers',
  },
  admin: {
    description: 'View and adjust customer coin balances',
    group: 'Loyalty & Rewards',
    useAsTitle: 'user',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user?.role === 'admin' || user?.role === 'super-admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const now = new Date()

        // 1. Ensure we have the history array to work with
        const earnings = data.coinEarningHistory || []

        // 2. Calculate the sum of remainingAmount for non-expired entries
        const newTotal = earnings.reduce((acc: number, entry: any) => {
          const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null

          // Only add if not expired (or no expiry set) and has remaining points
          if (expiryDate && expiryDate > now) {
            return acc + (Number(entry.remainingAmount) || 0)
          }
          return acc
        }, 0)

        // 3. Directly modify the data object before it hits the DB
        return {
          ...data,
          totalBalance: newTotal,
        }
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // Crucial: One record per user
      admin: {
        description: 'User who owns this balance',
      },
    },
    {
      name: 'totalBalance',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Current spendable balance (calculated from active earnings)',
        readOnly: true,
      },
    },
    {
      name: 'coinEarningHistory',
      type: 'array',
      admin: { description: 'Log of all points earned' },
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
        { name: 'amount', type: 'number', required: true },
        {
          name: 'remainingAmount',
          type: 'number',
          required: true,
          admin: {
            description: "Points remaining from this earning that haven't expired or been used",
          },
        },
        {
          name: 'earnedAt',
          type: 'date',
          defaultValue: () => new Date(),
          admin: { readOnly: true },
        },
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
        { name: 'expiryDate', type: 'date', validate: validateFutureDate },
      ],
    },
    {
      name: 'pointsRedemptionHistory',
      type: 'array',
      admin: { description: 'Log of all points spent' },
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
        { name: 'redeemedPoints', type: 'number', required: true },
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
        {
          name: 'redeemedAt',
          type: 'date',
          defaultValue: () => new Date(),
          admin: { readOnly: true },
        },
      ],
    },
  ],
  timestamps: true,
}
