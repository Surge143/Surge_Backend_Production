import type { CollectionConfig } from "payload";
import { awardWTCoins, convertPointsToAED } from "./hooks/wtCoinsUtils";

export const WebOrders: CollectionConfig = {
    slug: 'web-orders',
    admin: {
        useAsTitle: 'id',
        group: 'Website',
    },
    hooks: {
        beforeChange: [
            async ({ data, req, originalDoc, operation }) => {
                if (operation === 'update') {
                    // Award WTCoins when delivery status changes to 'shipped'
                    const isNowShipped = data.deliveryStatus === 'shipped'
                    const wasShipped = originalDoc?.deliveryStatus === 'shipped'
                    const alreadyAwarded = originalDoc?.wtCoinsAwarded
                    const hasUser = data.user || originalDoc?.user

                    if (isNowShipped && !wasShipped && hasUser && !alreadyAwarded) {
                        try {
                            const userId = typeof (data.user || originalDoc.user) === 'object'
                                ? (data.user || originalDoc.user).id
                                : (data.user || originalDoc.user)

                            if (typeof userId === 'number') {
                                // Calculate real money spent (excluding WTCoins discount)
                                const pointsUsed = data.pointsUsed !== undefined ? data.pointsUsed : (originalDoc.pointsUsed || 0)
                                const totalAmount = data.financials?.total !== undefined ? data.financials.total : (originalDoc.financials?.total || 0)

                                const wtCoinsDiscount = pointsUsed ? await convertPointsToAED(req.payload, pointsUsed) : 0
                                const realMoneySpent = Math.max(0, totalAmount - wtCoinsDiscount)

                                if (realMoneySpent > 0) {
                                    await awardWTCoins(req.payload, userId, realMoneySpent, originalDoc.id)
                                    // Mark as awarded in the same operation
                                    data.wtCoinsAwarded = true
                                    console.log(`✅ Awarded WTCoins for order ${originalDoc.id} in beforeChange`)
                                }
                            } else {
                                console.error('User ID is not a number, skipping WTCoins award')
                            }
                        } catch (error) {
                            console.error('Error awarding WTCoins on shipment:', error)
                        }
                    }
                }
                return data
            }
        ]
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
                                    },
                                },
                                {
                                    name: 'user',
                                    type: 'relationship',
                                    relationTo: 'users',
                                    required: false, // Optional because it's hidden for guests
                                    admin: {
                                        width: '50%',
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
                                },
                                {
                                    name: 'stripeOrderId',
                                    type: 'text',
                                    admin: { description: 'The ID from Stripe' }
                                },
                                {
                                    name: 'origin',
                                    type: 'select',
                                    required: true,
                                    options: [
                                        { label: 'Subscription', value: 'subscription' },
                                        { label: 'One Time', value: 'one-time' },
                                    ],
                                }
                            ],
                        },
                        {
                            name: 'items',
                            type: 'array',
                            required: true,
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        {
                                            name: 'product',
                                            type: 'relationship',
                                            relationTo: 'web-products',
                                            required: true,
                                            admin: { width: '25%' }
                                        },
                                        {
                                            name: 'variantID',
                                            label: 'Variation ID',
                                            type: 'text',
                                            required: true,
                                            admin: {
                                                width: '25%',
                                                description: 'The ID of the row in the Product Variants array'
                                            }
                                        },
                                        {
                                            name: 'quantity',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '10%' }
                                        },
                                        {
                                            name: 'price',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '15%' }
                                        },
                                    ],
                                },
                            ],
                        },
                        { name: 'newsAndOffers', type: 'checkbox', defaultValue: false },
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
                                condition: (data) => data?.deliveryOption === 'delivery',
                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'addressLine1', type: 'text' },
                                        { name: 'addressLine2', type: 'text' },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'city', type: 'text' },
                                        {
                                            name: 'emirates',
                                            type: 'select',
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
                                        { name: 'phoneNumber', type: 'text' },
                                    ],
                                },
                            ],
                        },
                        {
                            name: 'billingAddress',
                            type: 'group',
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'addressLine1', type: 'text' },
                                        { name: 'addressLine2', type: 'text' },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'city', type: 'text' },
                                        {
                                            name: 'emirates',
                                            type: 'select',
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
                                        { name: 'phoneNumber', type: 'text' },
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
                                        { label: 'Refunded', value: 'refunded' },
                                    ],
                                },
                                {
                                    name: 'deliveryStatus',
                                    type: 'select',
                                    defaultValue: 'placed',
                                    admin: {
                                        condition: (data) => data?.paymentStatus === 'completed' && data?.deliveryOption === 'delivery',
                                    },
                                    options: [
                                        { label: 'Placed', value: 'placed' },
                                        { label: 'Shipped', value: 'shipped' },
                                        { label: 'Delivered', value: 'delivered' },
                                    ],
                                },
                            ],
                        },
                        {
                            name: 'couponCode',
                            type: 'relationship',
                            relationTo: 'coupon',
                            admin: {
                                condition: (data) => data?.origin === 'one-time',
                            },
                        },
                        {
                            name: 'pointsUsed',
                            type: 'number',
                        },
                        {
                            name: 'financials',
                            type: 'group',
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'subtotal', type: 'number', required: true },
                                        { name: 'discountAmount', type: 'number' },
                                        { name: 'total', type: 'number', required: true },
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
                description: 'Tracks if WTCoins have been awarded for this order'
            },
        },
        {
            name: 'stripeData',
            type: 'json',
            admin: {
                hidden: true, // This hides the field from the Admin Panel entirely
            },
        },
    ],
};