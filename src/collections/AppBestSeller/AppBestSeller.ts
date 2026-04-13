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
    // Public can read (for frontend), but shop-managers only see their own shop's entry
    read: async ({ req: { user, payload } }) => {
      if (!user) return true // Public API reads allowed
      if (user.role === 'admin' || user.role === 'super-admin') return true
      if (user.role === 'shop-manager') {
        const managedShop = await payload.find({
          collection: 'shop',
          where: { shopManager: { equals: user.id } },
          limit: 1,
          depth: 0,
        })
        if (managedShop.docs.length > 0) {
          return { shop: { equals: managedShop.docs[0].id } }
        }
        return false
      }
      return true
    },
    create: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
    // Shop-managers can only update their own shop's entry
    update: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'super-admin') return true
      if (user.role === 'shop-manager') {
        const managedShop = await payload.find({
          collection: 'shop',
          where: { shopManager: { equals: user.id } },
          limit: 1,
          depth: 0,
        })
        if (managedShop.docs.length > 0) {
          return { shop: { equals: managedShop.docs[0].id } }
        }
        return false
      }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          // Step 1: For shop-managers, resolve shop assignment
          // so the upsert check below can use the correct shop ID
          if (req.user?.role === 'shop-manager') {
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

          // Step 2: Upsert — if a record already exists for this shop, update it
          if (data.shop) {
            const existing = await req.payload.find({
              collection: 'app-best-seller',
              where: { shop: { equals: data.shop } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            if (existing.docs.length > 0) {
              await req.payload.update({
                collection: 'app-best-seller',
                id: existing.docs[0].id,
                data: { products: data.products },
                overrideAccess: true,
              })
              throw new Error('UPSERT_OK') // Abort create — record already updated
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
      required: true,
      // Filter product picker to only show items belonging to the relevant shop
      filterOptions: async ({ data, req: { user, payload } }) => {
        // Try to get shop from current document data first
        const shopId = data?.shop
        if (shopId) {
          return { shop: { equals: shopId } } as any
        }
        // Fallback: use shop-manager's managed shop
        if (user?.role === 'shop-manager') {
          const managedShop = await payload.find({
            collection: 'shop',
            where: { shopManager: { equals: user.id } },
            limit: 1,
            depth: 0,
          })
          if (managedShop.docs.length > 0) {
            return { shop: { equals: managedShop.docs[0].id } } as any
          }
          return { id: { equals: -1 } } as any
        }
        return {} as any
      },
    },
  ],
}
