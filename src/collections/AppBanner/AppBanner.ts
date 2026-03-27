import type { CollectionConfig } from 'payload'

export const AppBanners: CollectionConfig = {
  slug: 'app-banners',
  admin: {
    useAsTitle: 'page',
    group: 'Marketing',
    description: 'Manage homepage banners in the app',
    defaultColumns: ['page', 'image', 'createdAt'],
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  labels: {
    singular: 'Banner & Promotion',
    plural: 'Banners & Promotions',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && data?.page) {
          const existing = await req.payload.find({
            collection: 'app-banners',
            where: {
              page: { equals: data.page },
            },
            limit: 0,
            depth: 0,
          })

          if (existing.totalDocs >= 3) {
            throw new Error(`Maximum of 3 banners allowed for the "${data.page}" page.`)
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'image',
      label: 'Banner Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: { contains: 'image' },
      },
      admin: {
        description: 'Upload a banner image (images only — JPEG, PNG, WebP, etc.).',
      },
    },
    {
      name: 'page',
      label: 'Page',
      type: 'select',
      required: true,
      options: [
        { label: 'Home', value: 'Home' },
        { label: 'Cafe', value: 'Cafe' },
        { label: 'Store', value: 'Store' },
      ],
      admin: {
        description:
          'Select the page this banner belongs to. Each page can have at most 3 banners.',
      },
    },
  ],
  timestamps: true,
}
