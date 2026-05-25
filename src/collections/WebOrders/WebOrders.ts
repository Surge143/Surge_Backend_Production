import type { CollectionConfig } from 'payload'
import { awardWTCoins, convertPointsToAED } from '@/utilities/wtCoins'
import { refundHandler } from './endpoints/refundHandler'
import { downloadInvoiceHandler } from './endpoints/downloadInvoice'
import { linkGuestOrderToUser } from './hooks/linkGuestToUser'
import { awardReferralCoins } from '@/utilities/awardReferralCoins'
import { createOrderPaidNotification } from '@/utilities/orderNotifications'
import { sendEmail } from '@/lib/emailConfig'
import { OrderShippedEmail } from '@/lib/emailTemplates/StoreOrderShipped'
import { OrderDeliveredEmail } from '@/lib/emailTemplates/StoreOrderDelivered'
import { productHighlightsField } from '../WebProducts/fields/productHighlightsField'

function generateOrderID() {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${datePart}-${randomPart}`
}

export const WebOrders: CollectionConfig = {
  slug: 'web-orders',
  labels: {
    singular: 'Store Order',
    plural: 'Store Orders',
  },
  admin: {
    listSearchableFields: ['id', 'email', 'user.firstName', 'user.lastName'],
    useAsTitle: 'id',
    group: 'Store Management',
    description: 'View and fulfill store orders',
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
    {
      path: '/:id/invoice',
      method: 'get',
      handler: downloadInvoiceHandler,
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
            collection: 'web-orders',
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
            collection: 'web-orders',
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
      async ({ data, req: { payload }, originalDoc, operation }) => {
        const currentPaymentStatus = data.paymentStatus || originalDoc?.paymentStatus
        const isPaidStatus = currentPaymentStatus === 'completed'
        const alreadyHasInvoice = data.invoiceId || originalDoc?.invoiceId

        if (isPaidStatus && !alreadyHasInvoice) {
          data.invoiceId = generateOrderID()
          data.invoiceDate = new Date().toISOString()
        }

        // Map variant array IDs to names from web-products
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            // Check if product and variantID are provided
            if (item.product && item.variantID && !item.variantID.includes(' - ')) {
              try {
                // Ensure we handle case where product is a reference ID or populated object
                const productId = typeof item.product === 'object' ? item.product.id : item.product
                const product = await payload.findByID({
                  collection: 'web-products',
                  id: productId,
                  depth: 0,
                })

                if (product && product.name) {
                  item.productName = product.name
                }

                if (product && product.variants && Array.isArray(product.variants)) {
                  const matchedVariant = product.variants.find((v: any) => v.id === item.variantID)
                  if (matchedVariant && matchedVariant.variantName) {
                    item.variantName = matchedVariant.variantName
                  }
                }
              } catch (error) {
                console.error(`Error fetching web-product for mapping variant name:`, error)
              }
            }
          }
        }

        if (operation === 'update') {
          // Award WTCoins when delivery status changes to 'delivered'
          const isNowDelivered = data.deliveryStatus === 'delivered'
          const wasDelivered = originalDoc?.deliveryStatus === 'delivered'
          const isPaid = (data.paymentStatus || originalDoc?.paymentStatus) === 'completed'
          const alreadyAwarded = originalDoc?.wtCoinsAwarded
          const hasUser = data.user || originalDoc?.user

          if (isNowDelivered && !wasDelivered && isPaid && hasUser && !alreadyAwarded) {
            try {
              const userId =
                typeof (data.user || originalDoc.user) === 'object'
                  ? (data.user || originalDoc.user).id
                  : data.user || originalDoc.user

              if (userId) {
                // Calculate real money spent (excluding WTCoins discount)
                const pointsUsed =
                  data.pointsUsed !== undefined ? data.pointsUsed : originalDoc.pointsUsed || 0
                const totalAmount =
                  data.financials?.total !== undefined
                    ? data.financials.total
                    : originalDoc.financials?.total || 0

                const surgeCoinsDiscount = pointsUsed
                  ? await convertPointsToAED(payload, pointsUsed)
                  : 0
                const realMoneySpent = Math.max(0, totalAmount - surgeCoinsDiscount)

                if (realMoneySpent > 0) {
                  await awardWTCoins(payload, userId, realMoneySpent, originalDoc.id)
                  // Mark as awarded in the same operation
                  data.wtCoinsAwarded = true
                  console.log(`✅ Awarded WTCoins for order ${originalDoc.id} in beforeChange`)
                }
              }
            } catch (error) {
              console.error('Error awarding WTCoins on shipment:', error)
            }
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ data, doc, previousDoc, operation, req: { payload } }) => {
        await linkGuestOrderToUser({
          payload,
          doc,
          previousDoc,
          collection: 'web-orders',
          paidStatus: 'completed',
        })

        // --- REAL-TIME SOCKET EMISSION ---
        const { emitWebOrderCreated, emitWebOrderUpdated } = await import('@/utilities/socket')
        const isNowCompleted = doc.paymentStatus === 'completed'
        const wasCompleted = previousDoc?.paymentStatus === 'completed'

        if (isNowCompleted) {
          // Re-fetch at depth 2 so item.product is fully populated (includes productHighlights)
          // for the Store Dashboard formatOrder mapping
          const populatedDoc = await payload.findByID({
            collection: 'web-orders',
            id: doc.id,
            depth: 2,
            overrideAccess: true,
          })
          if (operation === 'create' || !wasCompleted) {
            // New paid order — broadcast so Store Dashboard picks it up instantly
            emitWebOrderCreated(populatedDoc)
          } else {
            emitWebOrderUpdated(populatedDoc)
          }
        }

        // --- REFERRAL & NOTIFICATION LOGIC ---
        const isNowPaid = doc.paymentStatus === 'completed'
        const wasPaid = previousDoc?.paymentStatus === 'completed'
        const isNowDelivered = doc.deliveryStatus === 'delivered'
        const wasDelivered = previousDoc?.deliveryStatus === 'delivered'
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user

        if (userId) {
          setImmediate(async () => {
            const becamePaid = isNowPaid && !wasPaid

            const justDelivered = isNowDelivered && !wasDelivered && isNowPaid
            const justPaid = becamePaid && isNowDelivered

            if (justDelivered || justPaid) {
              await awardReferralCoins(payload, userId, doc.id, 'web-orders')
            }

            // 2. Notification: Trigger on PAYMENT
            if (isNowPaid && !wasPaid) {
              await createOrderPaidNotification(payload, userId, doc.id, 'store')

              // 3. Award WTCoins if already delivered but not yet awarded (Payment after Delivery)
              if (doc.deliveryStatus === 'delivered' && !doc.wtCoinsAwarded) {
                try {
                  const totalAmount = doc.financials?.total || 0
                  const pointsUsed = doc.pointsUsed || 0
                  const surgeCoinsDiscount = pointsUsed
                    ? await convertPointsToAED(payload, pointsUsed)
                    : 0
                  const realMoneySpent = Math.max(0, totalAmount - surgeCoinsDiscount)

                  if (realMoneySpent > 0) {
                    await awardWTCoins(payload, userId, realMoneySpent, doc.id)
                    await payload.update({
                      collection: 'web-orders',
                      id: doc.id,
                      data: { wtCoinsAwarded: true },
                    })
                    console.log(
                      `✅ Awarded WTCoins for order ${doc.id} in afterChange (Payment after Delivery)`,
                    )
                  }
                } catch (error) {
                  console.error('Error awarding WTCoins on payment after delivery:', error)
                }
              }
            }
          })
        }
        const isShipped = data.deliveryStatus === 'shipped'

        if (isShipped) {
          try {
            await sendEmail({
              to: data?.email,
              subject: 'Your order has been shipped!',
              body: `Order #${data.invoiceId} has been shipped. It is on its way!`,
              html: OrderShippedEmail(doc),
            })
          } catch (error) {
            console.error('Error during shipment logic:', error)
          }
        }

        if (isNowDelivered && !wasDelivered && userId) {
          try {
            await sendEmail({
              to: data?.email,
              subject: 'Your order has been delivered!',
              body: `Order #${data.invoiceId} has been delivered. Thank you for shopping with us!`,
              html: OrderDeliveredEmail(doc),
            })
          } catch (error) {
            console.error('Error during shipment logic:', error)
          }
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ─────────────────────────────────────────────────────────────────────
        // TAB 1 · Order Details
        // ─────────────────────────────────────────────────────────────────────
        {
          label: 'Order Details',
          fields: [
            // ── Customer Information ──────────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Customer Information',
              admin: { initCollapsed: false },
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
                      admin: { width: '33%', readOnly: true },
                    },
                    {
                      name: 'user',
                      type: 'relationship',
                      relationTo: 'users',
                      required: false,
                      admin: {
                        width: '33%',
                        readOnly: true,
                        condition: (data) => data?.customerType === 'user',
                        description: 'Select the registered user account for this order.',
                      },
                    },
                    {
                      name: 'email',
                      label: 'Customer Email',
                      type: 'text',
                      admin: {
                        width: '33%',
                        readOnly: true,
                        description: 'Stored at checkout for guest-to-user linking.',
                      },
                    },
                  ],
                },
              ],
            },
            // ── Order Information ─────────────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Order Information',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'deliveryOption',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Delivery', value: 'delivery' },
                        { label: 'Pickup', value: 'pickup' },
                      ],
                      admin: { width: '33%', readOnly: true },
                    },
                    {
                      name: 'origin',
                      type: 'select',
                      required: true,
                      options: [{ label: 'One Time', value: 'one-time' }],
                      admin: { width: '33%', readOnly: true },
                    },
                    {
                      name: 'stripeOrderId',
                      type: 'text',
                      admin: {
                        width: '33%',
                        readOnly: true,
                        description: 'The payment ID from Stripe',
                      },
                    },
                  ],
                },
              ],
            },
            // ── Order Items ───────────────────────────────────────────────────
            {
              name: 'items',
              type: 'array',
              label: 'Order Items',
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
                      admin: { width: '30%', readOnly: true },
                    },
                    {
                      name: 'variantID',
                      label: 'Variation ID',
                      type: 'text',
                      admin: {
                        width: '20%',
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
                      name: 'quantity',
                      type: 'number',
                      required: true,
                      admin: { width: '10%', readOnly: true },
                    },
                    {
                      name: 'price',
                      label: 'Unit Price (AED)',
                      type: 'number',
                      required: true,
                      admin: { width: '15%', readOnly: true },
                    },
                    {
                      name: 'productName',
                      type: 'text',
                      admin: { hidden: true, readOnly: true },
                    },
                    productHighlightsField,
                  ],
                },
              ],
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────────
        // TAB 2 · Shipping & Billing
        // ─────────────────────────────────────────────────────────────────────
        {
          label: 'Shipping & Billing',
          fields: [
            {
              name: 'shippingAddress',
              type: 'group',
              label: 'Shipping Address',
              admin: {
                readOnly: true,
                condition: (data) => data?.deliveryOption === 'delivery',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'addressFirstName',
                      label: 'First Name',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                    {
                      name: 'addressLastName',
                      label: 'Last Name',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'addressLine1',
                      label: 'Address Line 1',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                    {
                      name: 'addressLine2',
                      label: 'Address Line 2',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', admin: { width: '25%', readOnly: true } },
                    {
                      name: 'emirates',
                      type: 'select',
                      admin: { width: '25%', readOnly: true },
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
                    {
                      name: 'phoneNumber',
                      label: 'Phone Number',
                      type: 'text',
                      admin: { width: '25%', readOnly: true },
                    },
                    {
                      name: 'addressCountry',
                      label: 'Country',
                      type: 'text',
                      defaultValue: 'United Arab Emirates',
                      admin: { width: '25%', readOnly: true },
                    },
                  ],
                },
              ],
            },
            {
              name: 'billingAddress',
              type: 'group',
              label: 'Billing Address',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'addressFirstName',
                      label: 'First Name',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                    {
                      name: 'addressLastName',
                      label: 'Last Name',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'addressLine1',
                      label: 'Address Line 1',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                    {
                      name: 'addressLine2',
                      label: 'Address Line 2',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', admin: { width: '25%', readOnly: true } },
                    {
                      name: 'emirates',
                      type: 'select',
                      admin: { width: '25%', readOnly: true },
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
                    {
                      name: 'phoneNumber',
                      label: 'Phone Number',
                      type: 'text',
                      admin: { width: '25%', readOnly: true },
                    },
                    {
                      name: 'addressCountry',
                      label: 'Country',
                      type: 'text',
                      defaultValue: 'United Arab Emirates',
                      admin: { width: '25%', readOnly: true },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ─────────────────────────────────────────────────────────────────────
        // TAB 3 · Payment & Fulfilment
        // ─────────────────────────────────────────────────────────────────────
        {
          label: 'Payment & Fulfilment',
          fields: [
            // ── Order Status ──────────────────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Order Status',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'paymentStatus',
                      type: 'select',
                      required: true,
                      admin: { width: '50%', readOnly: true },
                      validate: (val, { data }) => {
                        if (
                          val === 'refunded' &&
                          data?.deliveryStatus !== 'placed' &&
                          data?.deliveryStatus !== 'cancelled'
                        ) {
                          return 'Refunds are only allowed while the delivery status is "Placed" or "Cancelled".'
                        }
                        return true
                      },
                      options: [
                        { label: 'Pending', value: 'pending' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Failed', value: 'failed' },
                        { label: 'Refund Initiated', value: 'refund-initiated' },
                        { label: 'Refunded', value: 'refunded' },
                      ],
                    },
                    {
                      name: 'deliveryStatus',
                      type: 'select',
                      defaultValue: 'placed',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        condition: (data) => data?.paymentStatus === 'completed',
                      },
                      options: [
                        { label: 'Placed', value: 'placed' },
                        { label: 'Shipped', value: 'shipped' },
                        { label: 'Completed', value: 'delivered' },
                        { label: 'Cancelled', value: 'cancelled' },
                        { label: 'Refund Initiated', value: 'refund-initiated' },
                        { label: 'Refunded', value: 'refunded' },
                      ],
                    },
                  ],
                },
              ],
            },
            // ── Fulfilment Dates (Delivery) ───────────────────────────────────
            {
              type: 'collapsible',
              label: 'Delivery Fulfilment',
              admin: {
                initCollapsed: false,
                condition: (data) => data?.deliveryOption === 'delivery',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'deliveringBy',
                      label: 'Delivering By',
                      type: 'date',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        date: { displayFormat: 'MM/dd/yyyy', pickerAppearance: 'dayOnly' },
                      },
                    },
                    {
                      name: 'deliveredOn',
                      label: 'Delivered On',
                      type: 'date',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        date: { displayFormat: 'MM/dd/yyyy', pickerAppearance: 'dayOnly' },
                      },
                    },
                  ],
                },
              ],
            },
            // ── Fulfilment Dates (Pickup) ─────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Pickup Fulfilment',
              admin: {
                initCollapsed: false,
                condition: (data) => data?.deliveryOption === 'pickup',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'isPickupReady',
                      label: 'Pickup Ready',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Mark when the order is packed and ready for customer pickup',
                      },
                    },
                    {
                      name: 'pickedUpDate',
                      label: 'Picked Up Date',
                      type: 'date',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        date: { displayFormat: 'MM/dd/yyyy', pickerAppearance: 'dayOnly' },
                      },
                    },
                  ],
                },
              ],
            },
            // ── Refund Details ────────────────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Refund Details',
              admin: {
                initCollapsed: false,
                condition: (data) =>
                  data?.paymentStatus === 'refund-initiated' || data?.paymentStatus === 'refunded',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'refundReason',
                      label: 'Refund Reason',
                      type: 'text',
                      admin: { width: '50%', readOnly: true },
                    },
                    {
                      name: 'refundedOn',
                      label: 'Refunded On',
                      type: 'date',
                      admin: {
                        width: '25%',
                        readOnly: true,
                        date: { displayFormat: 'MM/dd/yyyy', pickerAppearance: 'dayOnly' },
                      },
                    },
                    {
                      name: 'refundedAmount',
                      label: 'Refunded Amount (AED)',
                      type: 'number',
                      min: 0,
                      admin: { width: '25%', readOnly: true },
                    },
                  ],
                },
              ],
            },
            // ── Discounts & Points ────────────────────────────────────────────
            {
              type: 'collapsible',
              label: 'Discounts & Points',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'couponCode',
                      type: 'relationship',
                      relationTo: 'surge-coupon',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        condition: (data) => data?.origin === 'one-time',
                      },
                    },
                    {
                      name: 'pointsUsed',
                      label: 'WT Points Used',
                      type: 'number',
                      admin: { width: '50%', readOnly: true },
                    },
                  ],
                },
              ],
            },
            // ── Financial Breakdown ───────────────────────────────────────────
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
                      label: 'Subtotal',
                      type: 'number',
                      required: true,
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Sum of all item prices × quantities',
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
                      name: 'couponDiscount',
                      label: 'Coupon Discount',
                      type: 'number',
                      admin: {
                        width: '33%',
                        readOnly: true,
                        description: 'Discount applied via coupon code',
                      },
                    },
                    {
                      name: 'surgeCoinsDiscount',
                      label: 'Surge Coins Discount',
                      type: 'number',
                      admin: {
                        width: '33%',
                        readOnly: true,
                        description: 'Discount applied via Surge Coins redemption',
                      },
                    },
                    {
                      name: 'taxPercentage',
                      label: 'Tax %',
                      type: 'number',
                      min: 0,
                      max: 100,
                      admin: {
                        width: '33%',
                        readOnly: true,
                        description: 'Tax rate applied on taxable amount',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'taxAmount',
                      label: 'Tax Amount',
                      type: 'number',
                      admin: {
                        width: '50%',
                        readOnly: true,
                        description: 'Computed tax on (subtotal − discounts + shipping)',
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
                        description: 'Final amount charged (subtotal − discounts + shipping + tax)',
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
      name: 'wtCoinsAwarded',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        readOnly: true,
        description: 'Tracks if WTCoins have been awarded for this order',
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
        readOnly: true,
      },
    },
    {
      name: 'invoiceDate',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
}
