import { CollectionConfig } from 'payload'

export const ShopMenu: CollectionConfig = {
  slug: 'shop-menu',
  orderable: true,
  labels: {
    singular: 'Menu',
    plural: 'Menu',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shop', 'updatedAt'],
    components: {
      beforeListTable: [
        '@/collections/ShopMenu/components/ShopMenuQuickCreate#ShopMenuQuickCreate',
      ],
    },
    group: 'Cafe Management',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
      },
    },
    maxPerDoc: 50,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'shop-manager') {
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
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'super-admin') return true
      if (user.role === 'shop-manager') {
        return { 'shop.shopManager': { equals: user.id } }
      }
      return false
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req: { user, payload }, operation }) => {
        if (operation === 'create' && user) {
          data.createdBy = user.id
        }

        // Handle shop assignment for shop-managers on create
        if (user?.role === 'shop-manager' && operation === 'create') {
          const managedShops = await payload.find({
            collection: 'shop',
            where: { shopManager: { equals: user.id } },
            depth: 0,
          })

          if (managedShops.docs.length === 0) {
            throw new Error('You do not have a shop assigned to your account.')
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

        // Prevent duplicate product names within the same shop (create only)
        if (operation === 'create' && data.name && data.shop) {
          const existing = await payload.find({
            collection: 'shop-menu',
            where: {
              and: [{ name: { equals: data.name } }, { shop: { equals: data.shop } }],
            },
            limit: 1,
            overrideAccess: true,
          })
          if (existing.totalDocs > 0) {
            throw new Error(`A product named "${data.name}" already exists for this shop.`)
          }
        }

        // Customizations and loyalty flags are admin-only — strip from shop-manager saves
        if (user?.role === 'shop-manager') {
          delete data.customizations
          delete data.isStampEligible
          delete data.isStampFreeProduct
        }
        // On create, inherit loyalty flags from the linked Menu item
        if (operation === 'create' && data.menuRelation?.length) {
          const menuIds = data.menuRelation.map((id: any) => (typeof id === 'object' ? id.id : id))
          const menuItems = await payload.find({
            collection: 'menu',
            where: { id: { in: menuIds } },
            depth: 0,
            overrideAccess: true,
          })
          const menuItem = menuItems.docs[0]
          if (menuItem) {
            data.isStampEligible = menuItem.isStampEligible ?? false
            data.isStampFreeProduct = menuItem.isStampFreeProduct ?? false
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter Food Item Name',
      },
    },
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shop',
      required: true,
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
      name: 'menuRelation',
      type: 'relationship',
      relationTo: 'menu',
      hasMany: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'admins',
      admin: {
        condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
        position: 'sidebar',
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'tagline',
      type: 'text',
      required: false,
      admin: {
        placeholder: 'Enter Food Item Tagline',
        description: 'Keep it between 5 and 50 characters.',
      },
      minLength: 5,
      maxLength: 50,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Upload Food Item Image',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'textarea',
              required: false,
              admin: {
                placeholder: 'Enter Food Item Description',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'app-categories',
              required: true,
            },
            {
              name: 'subCategories',
              type: 'relationship',
              relationTo: 'app-sub-categories',
              hasMany: true,
              required: true,
              validate: (val) => {
                if (!val || (Array.isArray(val) && val.length === 0)) {
                  return 'At least one sub-category is mandatory.'
                }
                return true
              },
              admin: {
                condition: (data) => Boolean(data?.category),
              },
              filterOptions: ({ data }) => {
                if (data?.category) {
                  return {
                    parentCategory: { equals: data.category },
                  }
                }
                return false
              },
            },
            {
              name: 'regularPrice',
              type: 'number',
              required: true,
              admin: {
                placeholder: 'Enter Food Item Price',
              },
            },
            {
              name: 'salePrice',
              type: 'number',
              admin: {
                placeholder: 'Enter Food Item Sale Price',
              },
            },
            {
              name: 'dietaryType',
              type: 'select',
              options: [
                { label: 'Veg', value: 'veg' },
                { label: 'Non-Veg', value: 'non-veg' },
                { label: 'Vegan', value: 'vegan' },
              ],
              admin: {
                placeholder: 'Select Food Item Dietary Type',
                description: 'Select dietary type of the food item',
              },
            },
          ],
          label: 'Food Item Details',
        },
        {
          fields: [
            {
              name: 'stockCount',
              type: 'number',
              label: 'Stock Quantity',
              admin: {
                placeholder: 'Enter Stock Quantity',
              },
            },
            {
              name: 'inStock',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Check if the item is in stock',
              },
            },
          ],
          label: 'Stock Management',
        },
        {
          fields: [
            {
              name: 'customizations',
              type: 'array',
              label: 'Customization Panels',
              minRows: 0,
              maxRows: 1,
              admin: {
                readOnly: true,
                description: 'Synced automatically from Menu Builder and Customization Templates. Edit via the Menu Builder instead.',
                components: {
                  RowLabel:
                    '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                },
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: 'template',
                  type: 'relationship',
                  relationTo: 'customization-template',
                },
                {
                  name: 'sections',
                  type: 'array',
                  label: 'Sections',
                  admin: {
                    components: {
                      RowLabel:
                        '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                    },
                  },
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'selectionType',
                      type: 'radio',
                      enumName: 'sm_sect_sel_type',
                      options: [
                        { label: 'Single', value: 'single' },
                        { label: 'Multiple', value: 'multiple' },
                      ],
                    },
                    {
                      name: 'groups',
                      type: 'array',
                      label: 'Option Groups',
                      admin: {
                        components: {
                          RowLabel:
                            '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                        },
                      },
                      fields: [
                        {
                          name: 'groupTitle',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'options',
                          dbName: 'grp_opts',
                          type: 'array',
                          fields: [
                            {
                              name: 'label',
                              type: 'text',
                              required: true,
                            },
                            {
                              name: 'price',
                              type: 'number',
                              defaultValue: 0,
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'options',
                      type: 'array',
                      admin: {
                        condition: (_, siblingData) => !siblingData.groups?.length,
                        components: {
                          RowLabel:
                            '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                        },
                      },
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'price',
                          type: 'number',
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          label: 'Customization Panel',
        },
        {
          label: 'Loyalty Program',
          fields: [
            {
              name: 'isStampEligible',
              label: 'Stamp Eligible',
              type: 'checkbox',
              defaultValue: false,
              access: {
                update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
                create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
              },
              admin: {
                description:
                  'Enable to allow customers to earn a loyalty stamp when purchasing this item. (Admin only — synced from Menu)',
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
              },
            },
            {
              name: 'isStampFreeProduct',
              label: 'Stamp Free Product',
              type: 'checkbox',
              defaultValue: false,
              access: {
                update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
                create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
              },
              admin: {
                description:
                  'Enable if this item can be redeemed for free once a customer has collected enough stamps. (Admin only — synced from Menu)',
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this item.',
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
      name: 'slug',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'isLatest',
      label: 'Latest Product',
      type: 'checkbox',
      defaultValue: false,
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Synced from Menu Builder. Only super-admins can override this directly on a shop item.',
      },
    },
  ],
}
