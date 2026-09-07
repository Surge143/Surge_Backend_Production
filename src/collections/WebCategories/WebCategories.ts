import { slugField, type CollectionConfig } from 'payload'

export const WebCategories: CollectionConfig = {
  slug: 'web-categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
  },
  admin: {
    useAsTitle: 'title',
    group: 'Store Management',
    description: 'Organize products into groups',
    defaultColumns: ['id', 'title', 'slug'],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'brewingGuide',
      type: 'group',
      fields: [
        {
          name: 'tabs',
          label: 'Tabs',
          type: 'array',
          fields: [
            {
              name: 'tabName',
              type: 'text',
              required: true,
            },
            {
              name: 'video',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Upload video',
              },
              filterOptions: { mimeType: { contains: 'video' } },
            },
            {
              name: 'parameters',
              type: 'array',
              required: true,
              fields: [
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'value',
                  required: true,
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    slugField({
      useAsSlug: 'title',
    }),
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this category.',
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
        description: 'The email of the admin who created this category.',
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