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
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
      },
    },
    maxPerDoc: 50,
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
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this sub-category.',
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
    {
      name: 'createdBy',
      label: 'Created By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who created this sub-category.',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user && req.user.collection === 'admins') {
              return req.user.email
            }
            return value
          },
        ],
      },
    },
  ],
}
