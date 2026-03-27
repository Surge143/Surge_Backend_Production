import type { CollectionConfig } from 'payload'
import { linkGuestOrderToUser } from '../WebOrders/hooks/linkGuestToUser'
import { refundHandler } from './endpoints/refundHandler'
import { awardReferralCoins } from '@/utilities/awardReferralCoins'

function generateOrderID() {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${datePart}-${randomPart}`
}

export const WebSubscription: CollectionConfig = {
  slug: 'web-subscription',
  labels: {
    singular: 'Subscription',
    plural: 'Subscriptions',
  },
  admin: {
    useAsTitle: 'id',
    group: 'Store Management',
    description: 'Manage customers on a repeat plan',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
  },
  endpoints: [
    {
      path: '/:id/cancel',
      method: 'get',
      handler: refundHandler,
    },
  ],
  access: {
    read: async ({ req, id }) => {
      const { user, payload, query } = req
      // Admins and shop-managers always allowed
      if (
        user &&
        (user.role === 'admin' || user.role === 'super-admin' || user.role === 'shop-manager')
      )
        return true

      // If an ID is provided, check ownership or token
      if (id) {
        try {
          const order = await payload.findByID({
            collection: 'web-subscription',
            id,
            depth: 0,
            overrideAccess: true,
          })

          // Allow if owner
          const orderUserId = typeof order.user === 'object' ? order.user?.id : order.user
          if (user && String(orderUserId) === String(user.id)) return true

          // Allow if guest token matches
          const token = query?.token || req.headers?.get?.('x-guest-token')
          if (
            order.customerType === 'guest' &&
            order.guestAccessToken &&
            token === order.guestAccessToken
          ) {
            return true
          }
        } catch {
          return false
        }
      }

      // If no ID or not authorized yet, restrict to user's own orders (for listing)
      if (user) {
        return {
          user: {
            equals: user.id,
          },
        }
      }

      return false
    },
    create: () => true,
    update: async ({ req: { user, payload }, id }) => {
      if (!user) return false
      // Admins and shop-managers always allowed
      if (user.role === 'admin' || user.role === 'super-admin' || user.role === 'shop-manager')
        return true
      // Allow the order's owner to update their own order
      if (id) {
        try {
          const order = await payload.findByID({
            collection: 'web-subscription',
            id,
            depth: 0,
            overrideAccess: true,
          })
          const orderUserId = typeof order.user === 'object' ? order.user?.id : order.user
          return String(orderUserId) === String(user.id)
        } catch {
          return false
        }
      }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'super-admin' || user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, req: { payload }, originalDoc }) => {
        const currentPaymentStatus = data.paymentStatus || originalDoc?.paymentStatus
        const isPaidStatus = currentPaymentStatus === 'completed'
        const alreadyHasInvoice = data.invoiceId || originalDoc?.invoiceId

        if (isPaidStatus && !alreadyHasInvoice) {
          data.invoiceId = generateOrderID()
          data.invoiceDate = new Date().toISOString()
        }

        // Map variant and subFreq array IDs to names from web-products
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            if (item.product) {
              try {
                const productId = typeof item.product === 'object' ? item.product.id : item.product
                const product = await payload.findByID({
                  collection: 'web-products',
                  id: productId,
                  depth: 0,
                })

                if (product && product.name) {
                  item.productName = product.name
                }

                // Map variantID to variant name
                if (
                  product &&
                  item.variantID &&
                  !item.variantID.includes(' - ') &&
                  product.variants &&
                  Array.isArray(product.variants)
                ) {
                  const matchedVariant = product.variants.find((v: any) => v.id === item.variantID)
                  if (matchedVariant && matchedVariant.variantName) {
                    item.variantName = matchedVariant.variantName
                  }
                }

                // Map subFreqID to subscription frequency name
                if (
                  product &&
                  item.subFreqID &&
                  !item.subFreqID.includes(' - ') &&
                  product.subFreq &&
                  Array.isArray(product.subFreq)
                ) {
                  const matchedFreq = product.subFreq.find((f: any) => f.id === item.subFreqID)
                  if (matchedFreq && matchedFreq.duration && matchedFreq.interval) {
                    const plural = matchedFreq.duration > 1 ? 's' : ''
                    item.frequencyName = `${matchedFreq.duration} ${matchedFreq.interval}${plural}`
                  }
                }
              } catch (error) {
                console.error(`Error fetching web-product for mapping names:`, error)
              }
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req: { payload } }) => {
        await linkGuestOrderToUser({
          payload,
          doc,
          previousDoc,
          collection: 'web-subscription',
          paidStatus: 'completed',
        })

        // --- REFERRAL REWARD LOGIC ---
        const isNowPaid = doc.paymentStatus === 'completed'
        const wasPaid = previousDoc?.paymentStatus === 'completed'
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user

        if (isNowPaid && !wasPaid && userId) {
          // Trigger referral reward immediately upon first completion
          setImmediate(async () => {
            await awardReferralCoins(payload, userId, doc.id, 'web-subscription')
          })
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Order Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'customerType',
                  type: 'select',
                  defaultValue: 'guest',
                  options: [
                    { label: 'Guest', value: 'guest' },
                    { label: 'Registered User', value: 'user' },
                  ],
                  admin: {
                    width: '50%',
                    readOnly: true,
                  },
                },
                {
                  name: 'user',
                  type: 'relationship',
                  relationTo: 'users',
                  required: false, // Optional because it's hidden for guests
                  admin: {
                    width: '50%',
                    readOnly: true,
                    // This field ONLY shows up if customerType is 'user'
                    condition: (data) => data?.customerType === 'user',
                    description: 'Select the registered user account for this order.',
                  },
                },
                {
                  name: 'deliveryOption',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Delivery', value: 'delivery' },
                    { label: 'Pickup', value: 'pickup' },
                  ],
                  admin: { readOnly: true },
                },
                {
                  name: 'stripeSubscriptionID',
                  type: 'text',
                  admin: { readOnly: true, description: 'The ID from Stripe' },
                },
                {
                  name: 'nextPaymentDate',
                  type: 'date',
                  admin: { readOnly: true },
                },
                {
                  name: 'email',
                  label: 'Customer Email',
                  type: 'text',
                  admin: {
                    readOnly: true,
                    description: 'Stored at checkout for guest-to-user linking.',
                  },
                },
              ],
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'product',
                      type: 'relationship',
                      relationTo: 'web-products',
                      required: true,
                      admin: { width: '25%', readOnly: true },
                    },
                    {
                      name: 'variantID',
                      label: 'Variation ID',
                      type: 'text',
                      admin: {
                        width: '25%',
                        readOnly: true,
                        description: 'The ID of the variation',
                      },
                    },
                    {
                      name: 'variantName',
                      label: 'Variation Name',
                      type: 'text',
                      admin: {
                        width: '25%',
                        readOnly: true,
                        description: 'The name of the variation',
                      },
                    },
                    {
                      name: 'subFreqID',
                      label: 'Subscription Frequency ID',
                      type: 'text',
                      required: true,
                      admin: {
                        width: '25%',
                        readOnly: true,
                        description: 'The ID of the subscription frequency',
                      },
                    },
                    {
                      name: 'frequencyName',
                      label: 'Subscription Frequency Name',
                      type: 'text',
                      admin: {
                        width: '25%',
                        readOnly: true,
                        description: 'The name of the subscription frequency',
                      },
                    },
                    {
                      name: 'quantity',
                      type: 'number',
                      required: true,
                      admin: { width: '10%', readOnly: true },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      admin: { width: '15%', readOnly: true },
                    },
                    {
                      name: 'productName',
                      type: 'text',
                      admin: { hidden: true, readOnly: true },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping & Billing',
          fields: [
            {
              name: 'shippingAddress',
              type: 'group',
              label: 'Shipping Address (For Delivery Only)',
              admin: {
                readOnly: true,
                condition: (data) => data?.deliveryOption === 'delivery',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'addressFirstName', type: 'text', admin: { readOnly: true } },
                    { name: 'addressLastName', type: 'text', admin: { readOnly: true } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'addressLine1', type: 'text', admin: { readOnly: true } },
                    { name: 'addressLine2', type: 'text', admin: { readOnly: true } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', admin: { readOnly: true } },
                    {
                      name: 'emirates',
                      type: 'select',
                      admin: { readOnly: true },
                      options: [
                        { label: 'Abu Dhabi', value: 'abu_dhabi' },
                        { label: 'Dubai', value: 'dubai' },
                        { label: 'Sharjah', value: 'sharjah' },
                        { label: 'Ajman', value: 'ajman' },
                        { label: 'Umm Al Quwain', value: 'umm_al_quwain' },
                        { label: 'Ras Al Khaimah', value: 'ras_al_khaimah' },
                        { label: 'Fujairah', value: 'fujairah' },
                      ],
                    },
                    { name: 'phoneNumber', type: 'text', admin: { readOnly: true } },
                  ],
                },
              ],
            },
            {
              name: 'billingAddress',
              admin: { readOnly: true },
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'addressFirstName', type: 'text', admin: { readOnly: true } },
                    { name: 'addressLastName', type: 'text', admin: { readOnly: true } },
                  ],
                },
                {
                  type: 'row',
                  fields: [{ name: 'addressLine1', type: 'text', admin: { readOnly: true } }],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', admin: { readOnly: true } },
                    {
                      name: 'emirates',
                      type: 'select',
                      admin: { readOnly: true },
                      options: [
                        { label: 'Abu Dhabi', value: 'abu_dhabi' },
                        { label: 'Dubai', value: 'dubai' },
                        { label: 'Sharjah', value: 'sharjah' },
                        { label: 'Ajman', value: 'ajman' },
                        { label: 'Umm Al Quwain', value: 'umm_al_quwain' },
                        { label: 'Ras Al Khaimah', value: 'ras_al_khaimah' },
                        { label: 'Fujairah', value: 'fujairah' },
                      ],
                    },
                    { name: 'phoneNumber', type: 'text', admin: { readOnly: true } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Payment & Totals',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'paymentStatus',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Failed', value: 'failed' },
                  ],
                  admin: { readOnly: true },
                },
                {
                  name: 'subsStatus',
                  type: 'select',
                  defaultValue: 'active',
                  admin: {
                    readOnly: true,
                    condition: (data) => data?.paymentStatus === 'completed',
                  },
                  options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ],
                },
                {
                  name: 'cancelReason',
                  label: 'Cancel Reason',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
            {
              name: 'pointsUsed',
              type: 'number',
              admin: { readOnly: true },
            },
            {
              name: 'financials',
              type: 'group',
              label: 'Financial Breakdown',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'subtotal',
                      label: 'Subtotal (Base Price × Qty)',
                      type: 'number',
                      required: true,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description:
                          'Product base price multiplied by quantity, before any discounts',
                      },
                    },
                    {
                      name: 'subscriptionDiscount',
                      label: 'Subscription Discount',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Discount from the subscription plan percentage',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'wtCoinsDiscount',
                      label: 'WT Coins Discount',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Discount applied via WT Coins redemption',
                      },
                    },
                    {
                      name: 'shippingCharge',
                      label: 'Shipping Charge',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Shipping fee (0 for pickup orders)',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'taxPercentage',
                      label: 'Tax Percentage',
                      type: 'number',
                      min: 0,
                      max: 100,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Tax percentage applied on (subtotal − discounts + shipping)',
                      },
                    },
                    {
                      name: 'taxAmount',
                      label: 'Tax',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Tax applied on (subtotal − discounts + shipping)',
                      },
                    },
                    {
                      name: 'total',
                      label: 'Grand Total',
                      type: 'number',
                      required: true,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description:
                          'Final recurring amount charged (first payment may differ due to WT Coins)',
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
    {
      name: 'stripeData',
      type: 'json',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'guestAccessToken',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'invoiceId',
      type: 'text',
      unique: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'invoiceDate',
      type: 'date',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
}
