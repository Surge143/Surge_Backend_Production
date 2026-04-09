import type { CollectionConfig } from 'payload'
import { validateWebCouponHandler } from './endpoints/validateWebCoupon'
import { getShopCouponsHandler as getWebCouponsHandler } from './endpoints/getWebCoupons'
import { validateFutureDate } from '@/utilities/validateFutureDate'

export const Coupon: CollectionConfig = {
  slug: 'surge-coupon',
  labels: {
    singular: 'Coupon',
    plural: 'Coupons',
  },
  endpoints: [
    {
      path: '/coupons/:couponCode',
      method: 'get',
      handler: validateWebCouponHandler,
    },
    {
      path: '/coupons',
      method: 'get',
      handler: getWebCouponsHandler,
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 1000,
      },
    },
    maxPerDoc: 50,
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: [
      'code',
      'couponStatus',
      'isPubliclyVisible',
      'applicability',
      'discountType',
      'discountAmount',
      'expiryDate',
    ],
    group: 'Store Management',
    description: 'Create and manage store discount codes',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, req: { user }, operation }) => {
        if (operation === 'create' && user) {
          data.createdBy = user.id
        }

        if (data.code) data.code = data.code.toUpperCase()

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req: { payload }, operation }) => {
        if (operation === 'update') {
          // Prevent infinite loops and unnecessary updates by checking if relevant fields changed
          const changedFields = [
            'couponStatus',
            'code',
            'couponFor',
            'isPubliclyVisible',
            'applicability',
            'products',
            'discountType',
            'discountAmount',
            'expiryDate',
            'minimumAmount',
            'usageLimit',
            'usageLimitPerUser',
            'usageCount',
          ]

          const hasChanged = changedFields.some(
            (field) => JSON.stringify(doc[field]) !== JSON.stringify(previousDoc[field]),
          )

          if (!hasChanged) return doc

          const shopCoupons = await payload.find({
            collection: 'surge-shop-coupon',
            where: { couponRelation: { equals: doc.id } },
            depth: 0,
            limit: 1000, // Increase limit to ensure all linked coupons are updated
          })

          if (shopCoupons.docs.length > 0) {
            await Promise.all(
              shopCoupons.docs.map((shopCoupon) =>
                payload.update({
                  collection: 'surge-shop-coupon',
                  id: shopCoupon.id,
                  data: {
                    couponStatus: doc.couponStatus,
                    code: doc.code,
                    couponFor: doc.couponFor,
                    isPubliclyVisible: doc.isPubliclyVisible,
                    applicability: doc.applicability,
                    products: doc.products,
                    discountType: doc.discountType,
                    discountAmount: doc.discountAmount,
                    expiryDate: doc.expiryDate,
                    minimumAmount: doc.minimumAmount,
                    usageLimit: doc.usageLimit,
                    usageLimitPerUser: doc.usageLimitPerUser,
                    usageCount: doc.usageCount,
                  } as any,
                  context: { fromCouponSync: true }, // Standard loop prevention in this project
                }),
              ),
            )
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'code',
                  label: 'Coupon Code',
                  type: 'text',
                  required: true,
                  unique: true,
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. SUMMER50',
                    description:
                      'Unique code customers enter at checkout. Use uppercase letters and numbers only.',
                  },
                },
                {
                  name: 'couponTagline',
                  label: 'Coupon Tagline',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                    placeholder: 'Save AED 20 on your first specialty coffee purchase.',
                    description: 'Tagline to display on the coupon.',
                  },
                },
                {
                  name: 'couponStatus',
                  label: 'Status',
                  type: 'select',
                  required: true,
                  defaultValue: 'active',
                  options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ],
                  admin: {
                    width: '50%',
                    description:
                      'Inactive coupons cannot be applied at checkout even if the code is correct.',
                  },
                },
              ],
            },
            {
              name: 'discountType',
              type: 'select',
              required: true,
              defaultValue: 'percentage',
              options: [
                { label: 'Percentage', value: 'percentage' },
                { label: 'Fixed Amount', value: 'fixed' },
              ],
              admin: {
                width: '50%',
                description:
                  'Percentage deducts a % of the order total; Fixed Amount deducts a flat dollar value.',
              },
            },
            {
              name: 'discountAmount',
              type: 'number',
              required: true,
              label: ({ data, siblingData }: any) =>
                (data?.discountType || siblingData?.discountType) === 'percentage'
                  ? 'Discount Percentage (%)'
                  : 'Discount Amount',
              validate: (val: any, { data }: any) => {
                if (data?.discountType === 'percentage' && (val < 0 || val > 100))
                  return 'Percentage must be between 0 and 100'
                if (val < 0) return 'Discount cannot be negative'
                return true
              },
              admin: {
                width: '50%',
                description: ({ data, siblingData }: any) =>
                  (data?.discountType || siblingData?.discountType) === 'percentage'
                    ? 'Value between 0-100'
                    : 'Total dollar amount to deduct',
              },
            },
          ],
        },
        {
          label: 'Conditions & Limits',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'applicability',
                  type: 'select',
                  label: 'Applicability',
                  defaultValue: 'all',
                  required: true,
                  options: [
                    { label: 'Entire Cart', value: 'all' },
                    { label: 'Specific Products', value: 'products' },
                  ],
                  admin: {
                    width: '50%',
                    description:
                      'Choose whether this coupon applies to the entire cart or only specific products.',
                    hidden: true,
                  },
                },
                {
                  name: 'expiryDate',
                  type: 'date',
                  required: true,
                  validate: validateFutureDate,
                  admin: {
                    width: '50%',
                    description: 'Coupon will be automatically invalidated after this date.',
                  },
                },
              ],
            },
            {
              name: 'products',
              type: 'relationship',
              relationTo: ['shop-menu', 'web-products'],
              hasMany: true,
              required: true,
              admin: {
                condition: (_, { applicability } = {}) => applicability === 'products',
                description: 'Select the specific products or menu items this coupon applies to.',
                hidden: true,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'minimumAmount',
                      type: 'number',
                      required: true,
                      min: 0,
                      validate: (val: any) => {
                        if (val < 0) return 'Per user limit cannot be negative'
                        return true
                      },
                      admin: {
                        width: '33%',
                        description:
                          'Minimum cart total (in $) required to apply this coupon. Set to 0 for no minimum.',
                      },
                    },
                    {
                      name: 'usageLimit',
                      type: 'number',
                      min: 0,
                      validate: (val: any) => {
                        if (val !== null && val < 0) return 'Limit cannot be negative'
                        return true
                      },
                      admin: {
                        width: '33%',
                        placeholder: 'Unlimited',
                        description:
                          'Max number of times this coupon can be used in total. Leave blank for unlimited.',
                      },
                    },
                    {
                      name: 'usageLimitPerUser',
                      type: 'number',
                      required: true,
                      defaultValue: 1,
                      min: 0,
                      validate: (val: any) => {
                        if (val < 0) return 'Per user limit cannot be negative'
                        return true
                      },
                      admin: {
                        width: '34%',
                        description: 'Max number of times a single customer can use this coupon.',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    // --- SIDEBAR FIELDS (Untouched as requested) ---
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
      name: 'isPubliclyVisible',
      label: 'Visible to Customers',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Toggle on to show this coupon in "Available Offers".',
      },
    },
    {
      name: 'couponFor',
      type: 'group',
      label: 'Coupon For',
      admin: {
        position: 'sidebar',
        description: 'Choose which platform(s) this coupon is valid on.',
      },
      validate: (value: any) =>
        value?.website || value?.app ? true : 'Select at least one platform',
      fields: [
        {
          name: 'website',
          type: 'checkbox',
          label: 'Website',
          admin: {
            width: '50%',
            description: 'Check to enable this coupon on the website.',
          },
        },
        {
          name: 'app',
          type: 'checkbox',
          label: 'App',
          admin: {
            width: '50%',
            description: 'Check to enable this coupon on the mobile app.',
          },
        },
      ],
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: { hidden: true },
    },
  ],
}
