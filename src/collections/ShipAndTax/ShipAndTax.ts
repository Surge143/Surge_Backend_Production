import type { GlobalConfig } from 'payload'

export const ShipAndTax: GlobalConfig = {
  slug: 'ship-and-tax',
  label: {
    singular: 'Shipping & Tax Configuration',
    plural: 'Shipping & Tax Configurations',
  },
  admin: {
    group: 'Shipping & Tax Configuration',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
      },
    },
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super-admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'tax',
      label: 'Tax',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        width: '30%',
        description: 'Add tax percentage here (e.g., 5 for 5%)',
      },
    },
    {
      name: 'emirateCharges',
      label: 'Shipping Charges by Emirate (AED)',
      type: 'group',
      admin: {
        description: 'Add shipping charges for each emirate in AED',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'abu_dhabi',
              label: 'Abu Dhabi',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
            {
              name: 'dubai',
              label: 'Dubai',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'sharjah',
              label: 'Sharjah',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
            {
              name: 'ajman',
              label: 'Ajman',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'umm_al_quwain',
              label: 'Umm Al Quwain',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
            {
              name: 'ras_al_khaimah',
              label: 'Ras Al Khaimah',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'fujairah',
              label: 'Fujairah',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this configuration.',
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            if (req.user && req.user.collection === 'admins') {
              return req.user.email
            }
            return value
          },
        ],
      },
    },
  ],
}
