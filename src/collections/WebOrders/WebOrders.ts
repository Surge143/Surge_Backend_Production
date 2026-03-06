import type { CollectionConfig } from "payload";
import { awardWTCoins, convertPointsToAED } from "./hooks/wtCoinsUtils";
import { refundHandler } from "./endpoints/refundHandler";
import { linkGuestOrderToUser } from "./hooks/linkGuestToUser";
import { awardReferralCoins } from "@/utilities/awardReferralCoins";
import { createOrderPaidNotification } from "@/utilities/orderNotifications";

export const WebOrders: CollectionConfig = {
    slug: 'web-orders',
    labels: {
        singular: 'Store Order',
        plural: 'Store Orders'
    },
    admin: {
        useAsTitle: 'id',
        group: 'Store',
    },
    endpoints: [
        {
            path: '/:id/cancel',
            method: 'get',
            handler: refundHandler,
        },
    ],
    access: {
        read: () => true,
        create: () => true,
        update: async ({ req: { user, payload }, id }) => {
            if (!user) return false
            // Admins and shop-managers always allowed
            if (
                user.role === 'admin' ||
                user.role === 'super-admin' ||
                user.role === 'shop-manager'
            ) return true
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
        delete: ({ req: { user } }) =>
            user?.role === 'super-admin' || user?.role === 'admin',
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
        ],
        afterChange: [
            async ({ doc, previousDoc, req: { payload } }) => {
                await linkGuestOrderToUser({
                    payload,
                    doc,
                    previousDoc,
                    collection: 'web-orders',
                    paidStatus: 'completed',
                });

                // --- REFERRAL REWARD LOGIC ---
                const isNowPaid = doc.paymentStatus === 'completed';
                const wasPaid = previousDoc?.paymentStatus === 'completed';
                const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user;
                if (isNowPaid && !wasPaid && userId) {
                    setImmediate(async () => {
                        await awardReferralCoins(payload, userId);
                        await createOrderPaidNotification(payload, userId, doc.id, 'store');
                    });
                }
            }
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
                                    admin: {

                                    },
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
                                    admin: {

                                    },
                                },
                                {
                                    name: 'email',
                                    label: 'Customer Email',
                                    type: 'text',
                                    admin: {
                                        description: 'Stored at checkout for guest-to-user linking.',

                                    },
                                },
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
                                            admin: {
                                                width: '25%',

                                                description: 'The ID of the row in the Product Variants array'
                                            }
                                        },
                                        {
                                            name: 'quantity',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '10%', }
                                        },
                                        {
                                            name: 'price',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '15%', }
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
                                condition: (data) => data?.deliveryOption === 'delivery',

                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'addressFirstName', type: 'text' },
                                        { name: 'addressLastName', type: 'text' },
                                    ],
                                },
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
                            admin: {

                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'addressFirstName', type: 'text' },
                                        { name: 'addressLastName', type: 'text' },
                                    ],
                                },
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
                                    admin: {

                                    },
                                    validate: (val, { data }) => {
                                        if (val === 'refunded' && data?.deliveryStatus !== 'placed' && data?.deliveryStatus !== 'cancelled') {
                                            return 'Refunds are only allowed while the delivery status is "Placed" or "Cancelled".';
                                        }
                                        return true;
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
                                        condition: (data) => data?.paymentStatus === 'completed' && data?.deliveryOption === 'delivery',
                                    },
                                    options: [
                                        { label: 'Placed', value: 'placed' },
                                        { label: 'Shipped', value: 'shipped' },
                                        { label: 'Delivered', value: 'delivered' },
                                        { label: 'Cancelled', value: 'cancelled' },
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
                            admin: {

                            },
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
                                            required: true,
                                            admin: { width: '50%', description: 'Sum of all item prices × quantities', }
                                        },
                                        {
                                            name: 'couponDiscount',
                                            label: 'Coupon Discount',
                                            type: 'number',
                                            admin: { width: '50%', description: 'Discount applied via coupon code', }
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
                                            admin: { width: '50%', description: 'Discount applied via WT Coins redemption', }
                                        },
                                        {
                                            name: 'shippingCharge',
                                            label: 'Shipping Charge',
                                            type: 'number',
                                            admin: { width: '50%', description: 'Shipping fee (0 for pickup orders)', }
                                        },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        {
                                            name: 'taxAmount',
                                            label: 'Tax',
                                            type: 'number',
                                            admin: { width: '50%', description: 'Tax applied on (subtotal − discounts + shipping)', }
                                        },
                                        {
                                            name: 'total',
                                            label: 'Grand Total',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '50%', description: 'Final amount charged (subtotal − discounts + shipping + tax)', }
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
                description: 'Tracks if WTCoins have been awarded for this order',

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