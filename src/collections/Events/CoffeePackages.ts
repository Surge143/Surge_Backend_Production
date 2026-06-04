import type { CollectionConfig } from 'payload'

export const CoffeePackages: CollectionConfig = {
  slug: 'coffee-packages',
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: 'Events',
    description: 'Coffee packages displayed on the events page.',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'name',
      label: 'Package Name',
      type: 'text',
      required: true,
    },
    {
      name: 'features',
      label: 'Included Features',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Feature',
        plural: 'Features',
      },
      fields: [
        {
          name: 'value',
          label: 'Feature',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. "Coffee Setup", "Professional Barista"',
          },
        },
      ],
    },
    {
      name: 'servingOptions',
      label: 'Serving Options',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Section Title',
          type: 'text',
          required: true,
          defaultValue: 'Serving Options',
        },
        {
          name: 'tiers',
          label: 'Tiers',
          type: 'array',
          required: true,
          minRows: 1,
          labels: {
            singular: 'Tier',
            plural: 'Tiers',
          },
          fields: [
            {
              name: 'cups',
              label: 'Cups',
              type: 'number',
              required: true,
              admin: {
                description: 'e.g. 50, 100, 150',
              },
            },
            {
              name: 'price',
              label: 'Price (AED)',
              type: 'number',
              required: true,
              admin: {
                description: 'e.g. 1500',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'optionalAddOns',
      label: 'Optional Add-ons',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Section Title',
          type: 'text',
          required: true,
          defaultValue: 'Optional Add-ons',
        },
        {
          name: 'items',
          label: 'Add-ons',
          type: 'array',
          labels: {
            singular: 'Add-on',
            plural: 'Add-ons',
          },
          fields: [
            {
              name: 'label',
              label: 'Label',
              type: 'text',
              required: true,
              admin: {
                description: 'e.g. "Extra Cups — AED 30/cup"',
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
