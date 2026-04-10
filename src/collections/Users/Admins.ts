import type { CollectionConfig, Where } from 'payload'

const roleHierarchy: Record<string, number> = {
  'super-admin': 1,
  admin: 2,
  'shop-manager': 3,
  barista: 4,
}

export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: {
    singular: 'Staff Member',
    plural: 'Staff Member',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24,
  },
  access: {
    // 1. CREATE: Can only create roles LOWER than their own
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user?.role === 'super-admin') return true
      if (user?.role === 'barista') return false // Baristas can't create anyone
      return true
    },

    read: async ({ req: { user, payload } }): Promise<boolean | Where> => {
      if (!user) return false

      // Super Admins can see everyone, including themselves
      if (user?.role === 'super-admin') return true

      // Define the roles that are "below" the current user
      const lowerRoles = Object.keys(roleHierarchy).filter(
        (r) => roleHierarchy[r] > roleHierarchy[user?.role as string],
      )

      // Shop Manager specific logic
      if (user?.role === 'shop-manager') {
        const managedShops = await payload.find({
          collection: 'shop',
          where: { shopManager: { equals: user.id } },
          limit: 1,
          depth: 0,
        })

        const shopId = managedShops.docs[0]?.id

        // Only show people with lower roles in their specific shop
        // Removed the { id: { equals: user.id } } part
        return {
          and: [{ role: { in: lowerRoles } }, { shop: { equals: shopId || 'none' } }],
        }
      }

      // For Admin role:
      // Only show people with roles strictly lower than theirs
      // Removed the { id: { equals: user.id } } part
      return {
        role: { in: lowerRoles },
      }
    },

    update: ({ req: { user } }) => {
      if (!user) return false
      if (user?.role === 'super-admin') return true

      // Baristas can only edit themselves
      if (user?.role === 'barista') {
        return {
          id: { equals: user.id },
        } as Where
      }

      const lowerRoles = Object.keys(roleHierarchy).filter(
        (r) => roleHierarchy[r] > roleHierarchy[user?.role as string],
      )

      return {
        or: [{ id: { equals: user.id } }, { role: { in: lowerRoles } }],
      } as Where
    },

    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user?.role === 'super-admin') return true

      return {
        role: {
          in: Object.keys(roleHierarchy).filter(
            (r) => roleHierarchy[r] > roleHierarchy[user?.role as string],
          ),
        },
      } as Where
    },
  },

  admin: {
    useAsTitle: 'email',
    group: 'Profiles',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },

  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Shop Manager', value: 'shop-manager' },
        { label: 'Barista', value: 'barista' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'speciality',
      type: 'text',
      admin: {
        condition: (data) => data.role === 'barista',
      },
    },
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shop',
      admin: {
        condition: (data) => data.role === 'barista',
      },
      filterOptions: async ({ req }) => {
        const { user, payload } = req
        if (!user) return false
        if (user?.role === 'super-admin' || user?.role === 'admin') return true

        if (user?.role === 'shop-manager') {
          const managedShops = await payload.find({
            collection: 'shop',
            where: { shopManager: { equals: user.id } },
            limit: 1,
            depth: 0,
          })
          if (managedShops.docs.length > 0) {
            return {
              id: { equals: managedShops.docs[0].id },
            }
          }
        }
        return false
      },
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (req.user && data?.role) {
          const userLevel = roleHierarchy[req.user?.role as string] || 999
          const targetLevel = roleHierarchy[data.role as string] || 999

          // BLOCK if trying to create/update someone to a level equal or higher than self
          if (targetLevel <= userLevel && req.user?.role !== 'super-admin') {
            throw new Error('You cannot assign a role equal to or higher than your own.')
          }
        }
        return data
      },
    ],
  },
}
