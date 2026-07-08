import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { type CollectionConfig } from 'payload'
import { formatPriceHook, priceValidator } from '../hooks/formatPrice'
import { productHighlightsField } from './fields/productHighlightsField'

// ─── Helper: isCoffee / isMerchandise ────────────────────────────────────────
// These are reused in `admin.condition` and `validate` throughout the file.
// `data` is the full document object that Payload passes to condition callbacks.
const isCoffee = (data: Record<string, unknown>) => data?.productType === 'coffee'
const isMerchandise = (data: Record<string, unknown>) => data?.productType === 'merchandise'

// ─── Shared validator: only enforce "required" when the product is Coffee ─────
// If the product type is NOT coffee, return true (skip validation).
// If it IS coffee and the value is empty, show the error message.
const requiredForCoffee =
  (label: string) =>
    (val: unknown, { data }: { data: Record<string, unknown> }) => {
      if (!isCoffee(data)) return true // not a coffee product – skip
      if (!val || (typeof val === 'string' && val.trim() === ''))
        return `${label} is required for coffee products.`
      return true
    }

// ─── Shared validator: only enforce "required" when the product is Merchandise ─
const requiredForMerchandise =
  (label: string) =>
    (val: unknown, { data }: { data: Record<string, unknown> }) => {
      if (!isMerchandise(data)) return true // not a merchandise product – skip
      if (!val || (typeof val === 'string' && val.trim() === ''))
        return `${label} is required for merchandise products.`
      return true
    }

export const WebProducts: CollectionConfig = {
  slug: 'web-products',
  orderable: true,
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Store Management',
    description: 'Add, edit or remove products',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
    defaultColumns: [
      'productImage',
      'name',
      'productType',
      'categories',
      'regularPrice',
      'salePrice',
      'inStock',
      'variants',
      '_status',
    ],
    components: {
      views: {
        list: {
          Component: '@/collections/WebProducts/components/ProductsListView#ProductsListView',
        },
      },
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
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },

  fields: [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter Product Name',
      },
    },
    {
      name: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter Tagline',
      },
    },

    // ─── Product Type Selector ──────────────────────────────────────────────
    // This single field drives all the conditional visibility below.
    // "coffee"       → shows Coffee Characteristics, hides Merchandise Details
    // "merchandise"  → shows Merchandise Details, hides Coffee Characteristics
    {
      name: 'productType',
      label: 'Product Type',
      type: 'select',
      required: true,
      defaultValue: 'coffee',
      admin: {
        description:
          'Choose the product type. Coffee fields appear for Beans/Drip Bags/Capsules; Merchandise fields appear for Mugs/Apparel/Equipment.',
        position: 'sidebar',
      },
      options: [
        { label: 'Coffee (Beans, Drip Bags, Capsules)', value: 'coffee' },
        { label: 'Merchandise (Mugs, Apparel, Equipment)', value: 'merchandise' },
      ],
    },

    {
      type: 'tabs',
      tabs: [
        // ─── Tab 1: Pricing and Stock ──────────────────────────────────────
        {
          label: 'Pricing and Stock',
          fields: [
            {
              name: 'hasVariantOptions',
              label: 'Has Variant Options',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'variants',
              label: 'Variant Options',
              type: 'array',
              required: true,
              admin: {
                // Only show the variants array when the checkbox above is ticked
                condition: (data) => Boolean(data?.hasVariantOptions),
                components: {
                  Cell: '@/collections/WebProducts/components/cells/VariantsCell#VariantsCell',
                },
              },
              fields: [
                {
                  name: 'variantName',
                  label: 'Variant Name',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Add quantity in Grams',
                  },
                },
                {
                  name: 'variantImage',
                  label: 'Variant Image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  filterOptions: { mimeType: { contains: 'image' } },
                },

                {
                  type: 'row',
                  fields: [
                    {
                      name: 'variantRegularPrice',
                      label: 'Regular Price',
                      type: 'text',
                      required: true,
                      admin: { width: '50%' },
                      validate: priceValidator,
                      hooks: { beforeChange: [formatPriceHook] },
                    },
                    {
                      name: 'variantSalePrice',
                      label: 'Sale Price',
                      type: 'text',
                      admin: { width: '50%' },
                      validate: (val, { siblingData }) => {
                        const priceError = priceValidator(val, {} as any)
                        if (priceError !== true) return priceError

                        if (!val) return true

                        const regularPrice = siblingData?.variantRegularPrice
                        if (regularPrice && Number(val) >= Number(regularPrice)) {
                          return 'The Sale Price must be less than the Regular Price.'
                        }

                        return true
                      },
                      hooks: { beforeChange: [formatPriceHook] },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'variantInStock',
                      label: 'In Stock',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'variantStockQuantity',
                      label: 'Stock Quantity',
                      type: 'number',
                      required: true,
                      admin: {
                        width: '50%',
                        // Check siblingData for the checkbox right above it
                        condition: (_, siblingData) => Boolean(siblingData?.variantInStock),
                      },
                    },
                  ],
                },
              ],
            },
            // --- Global Pricing (If NOT Variants) ---
            {
              type: 'row',
              admin: { condition: (data) => !data?.hasVariantOptions },
              fields: [
                {
                  name: 'regularPrice',
                  label: 'Regular Price',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                    components: {
                      Cell: '@/collections/WebProducts/components/cells/PriceCell#PriceCell',
                    },
                  },
                  validate: priceValidator,
                  hooks: { beforeChange: [formatPriceHook] },
                },
                {
                  name: 'salePrice',
                  label: 'Sale Price',
                  type: 'text',
                  admin: {
                    width: '50%',
                    components: {
                      Cell: '@/collections/WebProducts/components/cells/SalePriceCell#SalePriceCell',
                    },
                  },
                  validate: (val, { siblingData }) => {
                    const priceError = priceValidator(val, {} as any)
                    if (priceError !== true) return priceError

                    if (!val) return true
                    const regularPrice = siblingData?.regularPrice
                    if (regularPrice && Number(val) > Number(regularPrice)) {
                      return 'The Sale Price cannot be higher than the Regular Price.'
                    }

                    return true
                  },
                  hooks: { beforeChange: [formatPriceHook] },
                },
              ],
            },
            {
              type: 'row',
              admin: { condition: (data) => !data?.hasVariantOptions },
              fields: [
                {
                  name: 'inStock',
                  label: 'In Stock',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '50%',
                    components: {
                      Cell: '@/collections/WebProducts/components/cells/StockCell#StockCell',
                    },
                  },
                },
                {
                  name: 'stockQuantity',
                  label: 'Stock Quantity',
                  type: 'number',
                  min: 0,
                  required: true,
                  admin: {
                    width: '50%',
                    condition: (data) => Boolean(data?.inStock),
                  },
                },
              ],
            },
          ],
        },

        // ─── Tab 2: Product Details ────────────────────────────────────────
        {
          label: 'Product Details',
          fields: [
            {
              name: 'productImage',
              label: 'Product Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Upload product image that will be visible on Product Listing',
                components: {
                  Cell: '@/collections/WebProducts/components/cells/ImageCell#ImageCell',
                },
              },
              filterOptions: { mimeType: { contains: 'image' } },
            },
            { name: 'description', label: 'Description', type: 'textarea', required: true },

            {
              name: 'categories',
              label: 'Categories',
              type: 'relationship',
              relationTo: 'web-categories',
              hasMany: false,
              required: true,
              admin: { description: 'Select category', position: 'sidebar' },
            },
            {
              name: 'subCategories',
              label: 'Sub Categories',
              type: 'json',
              required: true,
              admin: {
                condition: (data) => !!data?.categories,
                components: {
                  Field:
                    '@/collections/WebProducts/components/NestedSubCategorySelection#NestedSubCategorySelection',
                },
                position: 'sidebar',
              },
            },

            productHighlightsField,

            // ─── Coffee Characteristics ──────────────────────────────────
            // These fields are only shown (and only validated) when productType === 'coffee'.
            // A coffee product describes where it came from, how it tastes, and how to brew it.
            {
              type: 'collapsible',
              label: 'Coffee Characteristics',
              // Hide the entire section when the product is Merchandise
              admin: { condition: (data) => isCoffee(data) },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'farm',
                      label: 'Farm',
                      type: 'text',
                      // No hardcoded `required: true` — validation is driven by productType
                      admin: { width: '50%' },
                      validate: requiredForCoffee('Farm'),
                    },
                    {
                      name: 'tastingNotes',
                      label: 'Tasting Notes',
                      type: 'text',
                      admin: { width: '50%' },
                      validate: requiredForCoffee('Tasting Notes'),
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'variety',
                      label: 'Variety',
                      type: 'text',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Variety'),
                    },
                    {
                      name: 'process',
                      label: 'Process',
                      type: 'text',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Process'),
                    },
                    {
                      name: 'altitude',
                      label: 'Altitude',
                      type: 'text',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Altitude'),
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'body',
                      label: 'Body',
                      type: 'text',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Body'),
                    },
                    {
                      name: 'acidity',
                      label: 'Acidity',
                      type: 'text',
                      defaultValue: 'Soft, Mellow',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Acidity'),
                    },
                    {
                      name: 'roast',
                      label: 'Roast',
                      type: 'text',
                      admin: { width: '33.33%' },
                      validate: requiredForCoffee('Roast'),
                    },
                  ],
                },
                {
                  name: 'farmDescription',
                  label: 'Farm Description',
                  type: 'textarea',
                  validate: requiredForCoffee('Farm Description'),
                },
                {
                  name: 'videoBanner',
                  label: 'Video Banner',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { contains: 'video' } },
                  // Video banner is required only for coffee products
                  validate: (val, { data }) => {
                    if (!isCoffee(data)) return true
                    if (!val) return 'Video Banner is required for coffee products.'
                    return true
                  },
                },
                {
                  name: 'brewGuide',
                  label: 'Brew Guide',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'filter',
                          label: 'Filter',
                          type: 'checkbox',
                          admin: { width: '33.33%' },
                        },
                        {
                          name: 'espresso',
                          label: 'Espresso',
                          type: 'checkbox',
                          admin: { width: '33.33%' },
                        },
                        { name: 'milk', label: 'Milk', type: 'checkbox', admin: { width: '33.33%' } },
                      ],
                    },
                  ],
                },
              ],
            },

            // ─── Merchandise Details ─────────────────────────────────────
            // Shown only when productType === 'merchandise'.
            // These fields replace the coffee-specific characteristics section.
            {
              type: 'collapsible',
              label: 'Merchandise Details',
              // Hide the entire section when the product is Coffee
              admin: { condition: (data) => isMerchandise(data) },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'material',
                      label: 'Material',
                      type: 'text',
                      admin: {
                        width: '50%',
                        placeholder: 'e.g. Ceramic, Cotton, Stainless Steel',
                      },
                      validate: requiredForMerchandise('Material'),
                    },
                    {
                      name: 'dimensions',
                      label: 'Dimensions',
                      type: 'text',
                      admin: {
                        width: '50%',
                        placeholder: 'e.g. 10cm × 8cm × 12cm',
                      },
                      validate: requiredForMerchandise('Dimensions'),
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'weight',
                      label: 'Weight',
                      type: 'text',
                      admin: {
                        width: '50%',
                        placeholder: 'e.g. 350g',
                      },
                      validate: requiredForMerchandise('Weight'),
                    },
                    {
                      name: 'careInstructions',
                      label: 'Care Instructions',
                      type: 'text',
                      admin: {
                        width: '50%',
                        placeholder: 'e.g. Hand wash only, do not bleach',
                      },
                      validate: requiredForMerchandise('Care Instructions'),
                    },
                  ],
                },
              ],
            },

            {
              name: 'recommendedProducts',
              label: 'Recommended Products',
              type: 'relationship',
              relationTo: 'web-products',
              hasMany: true,
              admin: {
                components: {
                  Field:
                    '@/collections/WebProducts/components/RecommendedProductsField#RecommendedProductsField',
                },
              },
            },
          ],
        },

        // ─── Tab 3: SEO ────────────────────────────────────────────────────
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: false }),
            MetaImageField({ relationTo: 'media' }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'isLatest',
      label: 'Latest Product',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark this product as a latest/new arrival for the storefront.',
      },
    },
    {
      name: 'isBestseller',
      label: 'Bestseller',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark this product as a bestseller for the storefront.',
      },
    },
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this product.',
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
      name: 'createdBy',
      label: 'Created By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who created this product.',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user && req.user.collection === 'admins') {
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
      required: true,
      index: true,
      admin: {
        components: {
          Field: '@/collections/components/slugField/customSlugField#SlugField',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (data?.name || data?.tagline) {
              const name = data.name || ''
              const tagline = data.tagline || ''
              const combined = `${name} ${tagline}`.trim()

              return combined
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
            }
            return value
          },
        ],
      },
    },
  ],
}
