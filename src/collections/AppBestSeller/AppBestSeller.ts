import type { CollectionConfig } from 'payload'

export const AppBestSeller: CollectionConfig = {
  slug: 'app-best-seller',
  admin: {
    useAsTitle: 'shop',
    defaultColumns: ['shop', 'updatedAt'],
    group: 'Cafe Management',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return true
      if (user.role === 'admin' || user.role === 'super-admin') return true
      if (user.role === 'shop-manager') {
        return { 'shop.shopManager': { equals: user.id } }
      }
      return true
    },
    create: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'super-admin') return true
      if (user.role === 'shop-manager') {
        return { 'shop.shopManager': { equals: user.id } }
      }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.role === 'shop-manager') {
          const managedShops = await req.payload.find({
            collection: 'shop',
            where: { shopManager: { equals: req.user.id } },
            depth: 0,
          })

          if (managedShops.docs.length === 0) {
            throw new Error('No shop assigned to your account.')
          } else if (managedShops.docs.length === 1) {
            data.shop = managedShops.docs[0].id
          } else {
            if (!data.shop) {
              throw new Error('You manage multiple shops. Please select a shop before saving.')
            }
            const isOwned = managedShops.docs.some((s) => String(s.id) === String(data.shop))
            if (!isOwned) {
              throw new Error('The selected shop does not belong to your account.')
            }
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shop',
      required: true,
      unique: true,
      filterOptions: ({ user }) => {
        if (user?.role === 'shop-manager') {
          return { shopManager: { equals: user.id } }
        }
        return true
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'shop-menu',
      hasMany: true,
      // Filter product picker to items belonging to the currently selected shop.
      // When no shop is selected yet, show all (no filter) so the picker isn't blank.
      filterOptions: ({ data }) => {
        if (data?.shop) {
          return { shop: { equals: data.shop } } as any
        }
        return {} as any
      },
    },
  ],
}
