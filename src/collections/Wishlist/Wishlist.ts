import type { CollectionConfig } from 'payload'

const Wishlist: CollectionConfig = {
  slug: 'wishlist',
  labels: {
    singular: 'Wishlist',
    plural: 'Wishlists',
  },
  admin: {
    group: 'Content',
    description: 'See what customers are saving',
    defaultColumns: ['user', 'updatedAt'],
    hidden: ({ user }: any) => user?.role !== 'super-admin',
  },
  access: {
    read: () => true, // Access control is handled at document level or via custom API
    update: () => true,
    delete: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: ['shop-menu', 'web-products'],
          required: true,
        },
        {
          name: 'shop',
          type: 'relationship',
          relationTo: 'shop',
          admin: {
            condition: (data, siblingData) => {
              // Only show if the product relationship is to shop-menu
              return siblingData?.product?.relationTo === 'shop-menu'
            },
          },
        },
      ],
    },
  ],
}

export { Wishlist }
