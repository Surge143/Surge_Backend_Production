import { CollectionConfig, slugField } from 'payload'

export const FeaturedNews: CollectionConfig = {
  slug: 'featured-news',
  admin: {
    useAsTitle: 'title',
    group: 'Marketing',
    description: 'Featured news items managed exclusively from the admin panel.',
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
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    slugField({
      useAsSlug: 'title',
    }),
  ],
  timestamps: true,
}
