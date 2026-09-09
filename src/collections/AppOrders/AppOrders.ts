import type { CollectionConfig } from 'payload'
import { beforeValidateHook } from './hooks/beforeValidate'
import { afterChangeHook } from './hooks/afterChange'
import { afterDeleteHook } from './hooks/afterDelete'
import { refundHandler } from './endpoints/refundHandler'
import { downloadInvoiceHandler } from './endpoints/downloadInvoice'

// Only staff (or internal server code, which uses overrideAccess and bypasses
// this entirely — e.g. the Stripe webhook that actually confirms payment) may
// set these fields directly. The mobile app also sends an optimistic client-side
// PATCH {paymentStatus:'paid'} right after checkout purely to make the order
// screen update instantly — that call becomes a harmless no-op for this field
// once this is in place; the real "paid" status still gets set a moment later
// by the Stripe webhook, which is unaffected. Without this, a customer could
// replay that same request on any of their own orders to mark it paid without
// ever actually paying.
const staffOnlyFieldAccess = {
  update: ({ req: { user } }: any) =>
    !!user && (user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager'),
}

function generateOrderID() {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${datePart}-${randomPart}`
}

// Deterministic, collision-proof: derived from the order's own database id
// (guaranteed unique) instead of a random 4-character suffix. invoiceId has a
// unique constraint — a collision there (unlikely on any single day at
// today's volume, but not negligible over months of real operation) would
// fail the very update that marks the order paid, even though the customer's
// payment with Stripe already succeeded.
function generateInvoiceID(docId: string | number) {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  return `${datePart}-${docId}`
}

export const AppOrders: CollectionConfig = {
  slug: 'app-orders',

  labels: {
    singular: 'Cafe Order',
    plural: 'Cafe Orders',
  },
  admin: {
    defaultColumns: ['id', 'shop', 'updatedAt'],
    group: 'Cafe Management',
    description: 'View and process incoming orders',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  endpoints: [
    {
      path: '/:id/cancel',
      method: 'post',
      handler: refundHandler,
    },
    {
      path: '/:id/invoice',
      method: 'get',
      handler: downloadInvoiceHandler,
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
          // originalDoc.id is always available here in the real flow (orders
          // are always created 'pending' first, then updated to 'paid' by the
          // webhook) — the random fallback only covers a theoretical
          // create-time-paid edge case that doesn't currently exist.
          data.invoiceId = originalDoc?.id != null ? generateInvoiceID(originalDoc.id) : generateOrderID()
          data.invoiceDate = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      afterChangeHook,
      async ({ doc, previousDoc, req: { payload } }) => {
        // Guest-to-user linking intentionally removed.
        // Guest orders stay as guest (user: null). Visibility is handled
        // by email-based access control — no linking needed.
      },
    ],
    afterDelete: [afterDeleteHook],
  },
  access: {
    // All legitimate reads/writes (cafe-checkout, shop-manager routes, the
    // Stripe webhook, refundHandler) go through the Local API with
    // overrideAccess/no req context and are unaffected by any of this — this
    // access block only governs the raw REST/GraphQL API hit directly.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'admin') return true
      if (user.role === 'shop-manager') {
        return { 'shop.shopManager': { equals: user.id } } as any
      }
      // A logged-in customer may read only their own cafe orders.
      return { user: { equals: user.id } } as any
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'admin') return true
      if (user.role === 'shop-manager') {
        return { 'shop.shopManager': { equals: user.id } } as any
      }
      // The mobile app PATCHes its own order directly after creation
      // (submitCafeOrderRatings and the cancel fallback in apiCafeOrders.ts)
      // — so the owner must still be allowed to update their own order at the
      // document level. items/financials/stampRewards/coinsUsed/coupon/
      // isCouponUsed are now individually locked to staff via
      // staffOnlyFieldAccess below, so an owner's PATCH can only ever touch
      // the handful of fields those two legitimate flows actually send
      // (ratings, appOrderStatus for cancel) — everything money/contents
      // -related is rejected regardless of what a tampered request sends.
      return { user: { equals: user.id } } as any
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super-admin' || user.role === 'admin'
    },
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
                  access: staffOnlyFieldAccess,
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Accepted', value: 'accepted' },
                    { label: 'Rejected', value: 'rejected' },
                  ],
                  required: true,
                  admin: { width: '50%', readOnly: true },
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
                readOnly: true,
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
                readOnly: true,
                condition: (data) =>
                  data?.orderAcceptance === 'accepted' && data?.orderType === 'dine-in',
              },
            },
            {
              name: 'paymentStatus',
              type: 'select',
              required: true,
              defaultValue: 'pending',
              access: staffOnlyFieldAccess,
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
                { label: 'Refund Initiated', value: 'refund-initiated' },
                { label: 'Refunded', value: 'refunded' },
              ],
              admin: { readOnly: true },
            },
            {
              name: 'refundReason',
              label: 'Refund Reason',
              type: 'text',
              admin: { readOnly: true },
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
              access: staffOnlyFieldAccess,
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
                  access: staffOnlyFieldAccess,
                  admin: { width: '30%', style: { marginTop: '35px' }, readOnly: true },
                },
                {
                  name: 'coupon',
                  type: 'relationship',
                  relationTo: 'surge-shop-coupon',
                  access: staffOnlyFieldAccess,
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
                  label: 'Surge Coins Used',
                  type: 'number',
                  access: staffOnlyFieldAccess,
                  admin: { width: '50%', readOnly: true },
                },
                {
                  name: 'stampRewards',
                  type: 'relationship',
                  relationTo: 'shop-menu',
                  hasMany: true,
                  access: staffOnlyFieldAccess,
                  // No filterOptions here — Payload re-validates a relationship
                  // field's filterOptions on EVERY partial update to this
                  // document (not just when the field itself is being changed):
                  // its existing value is cloned from the original doc and
                  // re-checked via a scoped `find` against
                  // {isStampFreeProduct: true} each time. If that internal
                  // lookup ever fails to re-match the same product for any
                  // reason (the menu item later edited into a draft state,
                  // an access-control nuance, timing), Payload throws a
                  // validation error and the ENTIRE update — including an
                  // unrelated status-only PATCH from the Shop Manager
                  // Dashboard's Accept/Advance buttons — is rejected, leaving
                  // the order's real status silently unchanged forever. This
                  // is exactly what caused a "reward order" to stay stuck as
                  // pending no matter how many times it was accepted/advanced.
                  // The real, one-time validation of stampRewards already
                  // happens explicitly in beforeValidate.ts, which only runs
                  // when stampRewards is actually part of the incoming data
                  // (i.e. at order creation) — that's the correct place for
                  // this check, not a per-save field constraint on a
                  // historical record.
                  admin: { width: '50%', readOnly: true },
                },
              ],
            },
            {
              name: 'financials',
              type: 'group',
              label: 'Financial Breakdown',
              access: staffOnlyFieldAccess,
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
                      name: 'surgeCoinsDiscount',
                      label: 'Surge Coins Discount',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Discount applied via Surge Coins redemption',
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
        readOnly: true,
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
