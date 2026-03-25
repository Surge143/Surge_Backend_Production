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
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      useAsSlug: 'title'
    })
  ],
}