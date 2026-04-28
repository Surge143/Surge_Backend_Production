import { slugField, type CollectionConfig } from 'payload'

export const AppCategories: CollectionConfig = {
  slug: 'app-categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin';
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin';
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin';
    },
  },
  admin: {
    useAsTitle: 'title',
    group: 'Cafe Management',
    description: 'Organize items into groups',
    defaultColumns: ['id', 'title', 'slug'],
    hidden: ({ user }: any) => user?.role === 'shop-manager' || user?.role === 'barista',
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
      validate: async (value, { req }: any) => {
        if (!value) return true;
        try {
          const media = await req.payload.findByID({
            collection: 'media',
            id: value,
            depth: 0,
          });

          const minWidth = 1024;
          const minHeight = 1024;

          if (media && (media.width < minWidth || media.height < minHeight)) {
            return `Image dimensions must be at least ${minWidth}x${minHeight}px. Current: ${media.width}x${media.height}px.`;
          }
        } catch (error) {
          return 'Selected image could not be validated.';
        }
        return true;
      },
    },
    slugField({
      useAsSlug: 'title'
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
