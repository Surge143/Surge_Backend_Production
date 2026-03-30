import { type CollectionConfig } from 'payload'

export const WebSubCategories: CollectionConfig = {
  slug: 'web-sub-categories',
  labels: {
    singular: 'Sub-category',
    plural: 'Sub-categories',
  },
  access: {
    read: () => true,
  },
  admin: {
    group: 'Store Management',
    description: 'More specific product groupings',
    defaultColumns: ['slug', 'parentCategory'],
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  fields: [
    {
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'web-categories',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'level1',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'level2',
          type: 'array',
          admin: { condition: (_, siblingData) => !!siblingData?.name },
          fields: [
            { name: 'name', type: 'text', required: true },
            {
              name: 'level3',
              type: 'array',
              admin: { condition: (_, siblingData) => !!siblingData?.name },
              fields: [{ name: 'name', type: 'text', required: true }],
            },
          ],
        },
      ],
    },
  ],
}
