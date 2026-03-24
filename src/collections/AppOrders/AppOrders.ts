import type { CollectionConfig } from 'payload'
import { beforeValidateHook } from './hooks/beforeValidate'
import { afterChangeHook } from './hooks/afterChange'
import { afterDeleteHook } from './hooks/afterDelete'
import { refundHandler } from './endpoints/refundHandler'
import { linkGuestOrderToUser } from '../WebOrders/hooks/linkGuestToUser'

function generateOrderID() {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${datePart}-${randomPart}`
}

export const AppOrders: CollectionConfig = {
  slug: 'app-orders',

  labels: {
    singular: 'Order',
    plural: 'Orders',
  },
  admin: {
    defaultColumns: ['id', 'shop', 'updatedAt'],
    group: 'Cafe',
  },
  endpoints: [
    {
      path: '/:id/cancel',
      method: 'get',
      handler: refundHandler,
    },
  ],
  hooks: {
    beforeValidate: [beforeValidateHook],
    beforeChange: [
      ({ data, originalDoc }) => {
        const currentPaymentStatus = data.paymentStatus || originalDoc?.paymentStatus
        const isPaid = currentPaymentStatus === 'paid'
        const alreadyHasInvoice = data.invoiceId || originalDoc?.invoiceId

        if (isPaid && !alreadyHasInvoice) {
          data.invoiceId = generateOrderID()
          data.invoiceDate = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      afterChangeHook,
      async ({ doc, previousDoc, req: { payload } }) => {
        await linkGuestOrderToUser({
          payload,
          doc,
          previousDoc,
          collection: 'app-orders',
          paidStatus: 'paid',
        })
      },
    ],
    afterDelete: [afterDeleteHook],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Order Details',
          fields: [
            {
              name: 'user',
              type: 'relationship',
              relationTo: 'users',
              required: false,
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'email',
              label: 'Customer Email',
              type: 'text',
              admin: {
                description: 'Stored at checkout for guest-to-user linking.',
                readOnly: true,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'orderAcceptance',
                  type: 'select',
                  defaultValue: 'pending',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Accepted', value: 'accepted' },
                    { label: 'Rejected', value: 'rejected' },
                  ],
                  required: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'appOrderStatus',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready For Pickup', value: 'ready' },
                { label: 'Order Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
              admin: {
                condition: (data) =>
                  data?.orderAcceptance === 'accepted' && data?.orderType === 'take-away',
              },
            },
            {
              name: 'appOrderStatusDine',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready to serve', value: 'ready' },
                { label: 'Order Served', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
              admin: {
                condition: (data) =>
                  data?.orderAcceptance === 'accepted' && data?.orderType === 'dine-in',
              },
            },
            {
              name: 'paymentStatus',
              type: 'select',
              required: true,
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
                { label: 'Refund Initiated', value: 'refund-initiated' },
                { label: 'Refunded', value: 'refunded' },
              ],
              admin: {},
            },
            {
              name: 'refundReason',
              label: 'Refund Reason',
              type: 'text',
            },
            {
              name: 'refundedAmount',
              label: 'Refunded Amount',
              type: 'number',
              admin: {
                readOnly: true,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shop',
                  type: 'relationship',
                  relationTo: 'shop',
                  required: true,
                  admin: { width: '50%', readOnly: true },
                },
                {
                  name: 'barista',
                  type: 'relationship',
                  relationTo: 'admins',
                  admin: { width: '50%', readOnly: true },
                  filterOptions: {
                    role: { equals: 'barista' },
                  },
                },
              ],
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              admin: {
                readOnly: true,
              },
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'shop-menu',
                  required: true,
                } as any, // Needed due to Payload type complexities in some environments
                {
                  name: 'quantity',
                  type: 'number',
                  defaultValue: 1,
                  min: 1,
                },
                {
                  name: 'customizations',
                  type: 'json',
                },
              ],
            },
            {
              name: 'specialInstructions',
              type: 'textarea',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'orderRating',
              type: 'number',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'baristaRating',
              type: 'number',
              admin: {
                readOnly: true,
              },
            },
          ],
        },
        {
          label: 'Logistics & Time',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'orderType',
                  type: 'select',
                  options: [
                    { label: 'Take Away', value: 'take-away' },
                    { label: 'Dine In', value: 'dine-in' },
                  ],
                  required: true,
                  admin: { width: '50%', readOnly: true },
                },
                {
                  name: 'timeSelection',
                  type: 'radio',
                  defaultValue: 'now',
                  options: [
                    { label: 'Set to Now', value: 'now' },
                    { label: 'Specific Time Slot', value: 'custom' },
                  ],
                  admin: {
                    width: '50%',
                    readOnly: true,
                    condition: (data) => data?.orderType === 'take-away',
                  },
                },
              ],
            },
            {
              name: 'slot',
              type: 'relationship',
              relationTo: 'slots',
              required: false,
              admin: {
                readOnly: true,
                condition: (data) =>
                  data?.timeSelection === 'custom' && data?.orderType === 'take-away',
              },
            },
          ],
        },
        {
          label: 'Rewards & Payment',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'isCouponUsed',
                  type: 'checkbox',
                  admin: { width: '30%', style: { marginTop: '35px' }, readOnly: true },
                },
                {
                  name: 'coupon',
                  type: 'relationship',
                  relationTo: 'shop-coupon',
                  admin: {
                    width: '70%',
                    readOnly: true,
                    condition: (data) => Boolean(data?.isCouponUsed),
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'coinsUsed',
                  type: 'number',
                  admin: { width: '50%', readOnly: true },
                },
                {
                  name: 'stampRewards',
                  type: 'relationship',
                  relationTo: 'shop-menu',
                  hasMany: true,
                  filterOptions: {
                    isStampFreeProduct: { equals: true },
                  },
                  admin: { width: '50%', readOnly: true },
                },
              ],
            },
            {
              name: 'financials',
              type: 'group',
              label: 'Financial Breakdown',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'subtotal',
                      label: 'Subtotal (Before Discounts)',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Sum of all item prices × quantities',
                      },
                    },
                    {
                      name: 'couponDiscount',
                      label: 'Coupon Discount',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Discount applied via coupon code',
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
                      name: 'taxAmount',
                      label: 'Tax',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Tax applied on order total after discounts',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'total',
                      label: 'Grand Total',
                      type: 'number',
                      admin: {
                        width: '100%',
                        readOnly: true,
                        description:
                          'Final amount charged to the customer (subtotal − discounts + tax)',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'stripeOrderId',
              type: 'text',
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
    {
      name: 'scheduledForPrep',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        description:
          'Slot orders accepted more than 30 min before their slot time are held here. The cron job clears this flag at T-30 to release them into the Queued section.',
      },
    },
    {
      name: 'isStampsAwarded',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        hidden: true,
        description:
          'Flag to track if stamps have been awarded for this order to avoid double-crediting.',
      },
    },
    {
      name: 'stripeData',
      type: 'json',
      admin: {
        readOnly: true,
        hidden: true,
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
