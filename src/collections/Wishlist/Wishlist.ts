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
    // The custom /api/wishlist route already scopes correctly to req.user, but
    // this collection was also reachable at the raw /api/wishlist REST endpoint
    // with no owner check at all — anyone could read/edit/wipe any other
    // customer's wishlist by guessing an ID.
    read: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as any;
      if (u.role === 'admin' || u.role === 'super-admin') return true;
      return { user: { equals: user.id } };
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as any;
      if (u.role === 'admin' || u.role === 'super-admin') return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      const u = user as any;
      if (u.role === 'admin' || u.role === 'super-admin') return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user }, data }: any) => {
      if (!user) return false;
      const u = user as any;
      if (u.role === 'admin' || u.role === 'super-admin') return true;
      // A customer may only ever create a wishlist record for themselves.
      return !data?.user || String(data.user) === String(user.id);
    },
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
