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
  ],
}