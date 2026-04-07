import { CollectionConfig, slugField } from 'payload'

export const Menu: CollectionConfig = {
  slug: 'menu',
  labels: {
    singular: 'Menu Builder',
    plural: 'Menu Builder',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Cafe Management',
    description: 'Add or edit food & drink items',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, req, context, operation }) => {
        const { payload } = req
        if (operation === 'update') {
          // fromTemplateSync is true when this update was triggered by syncTemplates.
          // In that case we also push customizations down to ShopMenu.
          // On direct admin saves, we skip customizations so per-shop edits are not reverted.
          const isTemplateSync = !!(context as any)?.fromTemplateSync

          const shopMenuItems = await payload.find({
            collection: 'shop-menu',
            where: { menuRelation: { contains: doc.id } },
            depth: 0,
            req,
            overrideAccess: true,
          })

          if (shopMenuItems.docs.length > 0) {
            await Promise.all(
              shopMenuItems.docs.map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: any = {
                  name: doc.name,
                  tagline: doc.tagline,
                  image: doc.image && typeof doc.image === 'object' ? doc.image.id : doc.image,
                  description: doc.description,
                  category:
                    doc.category && typeof doc.category === 'object'
                      ? doc.category.id
                      : doc.category,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  subCategories: doc.subCategories?.map((s: any) =>
                    typeof s === 'object' ? s.id : s,
                  ),
                  slug: doc.slug,
                  dietaryType: doc.dietaryType,
                  // Loyalty flags are authoritative on Menu; always push them down
                  isStampEligible: doc.isStampEligible ?? false,
                  isStampFreeProduct: doc.isStampFreeProduct ?? false,
                }
                // Only propagate customizations when triggered by template sync
                if (isTemplateSync) {
                  data.customizations = doc.customizations
                }
                return payload.update({
                  collection: 'shop-menu',
                  id: item.id,
                  data,
                  req,
                  depth: 0,
                  overrideAccess: true,
                })
              }),
            )
          }
        }
        return doc
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        // If it's a new upload and no folder is selected yet
        if (operation === 'create' && !data.folder) {
          // You can find your folder ID in the Admin URL when viewing the folder
          // or query for it:
          const productFolder = await req.payload.find({
            collection: 'payload-folders',
            where: { name: { equals: 'products' } },
          })

          if (productFolder.docs.length > 0) {
            data.folder = productFolder.docs[0].id
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
      name: 'tagline',
      type: 'text',
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
              admin: {
                position: 'sidebar',
                width: '50%',
              },
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
                position: 'sidebar',
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
              min: 0,
              admin: {
                placeholder: 'Enter Food Item Price',
              },
            },
            {
              name: 'salePrice',
              type: 'number',
              min: 0,
              admin: {
                placeholder: 'Enter Food Item Sale Price',
              },
              validate: (val, { siblingData }) => {
                if (!val) return true
                const regularPrice = siblingData?.regularPrice
                if (regularPrice && Number(val) > Number(regularPrice)) {
                  return 'The Sale Price cannot be higher than the Regular Price.'
                }
                return true
              },
            },
            {
              name: 'dietaryType',
              type: 'select',
              required: true,
              defaultValue: 'veg',
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
              name: 'injectTemplate',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/collections/Menu/components/TemplateInjector#TemplateInjector',
                },
              },
            },
            {
              name: 'customizations',
              type: 'array',
              label: 'Customization Panels',
              minRows: 0,
              maxRows: 1,
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
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: 'template',
                  type: 'relationship',
                  relationTo: 'customization-template',
                  admin: {
                    readOnly: true,
                  },
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
              admin: {
                description:
                  'Enable this to allow customers to earn a loyalty stamp when they purchase this item.',
              },
            },
            {
              name: 'isStampFreeProduct',
              label: 'Stamp Free Product',
              type: 'checkbox',
              admin: {
                description:
                  'Enable this if this item can be redeemed for free once a customer has collected enough stamps.',
              },
            },
          ],
        },
      ],
    },
  ],
}
