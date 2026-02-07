import type { CollectionConfig } from 'payload'

export const AppCategories: CollectionConfig = {
  slug: 'app-categories',
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
    group: 'App',
    defaultColumns: ['id', 'title', 'slug'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [({ value, data }) => {
          if (value) return value;
          return (data?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }],
      },
    },
  ],
}