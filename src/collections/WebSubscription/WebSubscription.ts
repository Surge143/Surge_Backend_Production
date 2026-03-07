import type { CollectionConfig } from "payload";
import { linkGuestOrderToUser } from "../WebOrders/hooks/linkGuestToUser";
import { refundHandler } from "./endpoints/refundHandler";
import { awardReferralCoins } from "@/utilities/awardReferralCoins";

export const WebSubscription: CollectionConfig = {
    slug: 'web-subscription',
    labels: {
        singular: 'Store Subscription',
        plural: 'Store Subscriptions'
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
    hooks: {
        afterChange: [
            async ({ doc, previousDoc, req: { payload } }) => {
                await linkGuestOrderToUser({
                    payload,
                    doc,
                    previousDoc,
                    collection: 'web-subscription',
                    paidStatus: 'completed',
                });

                // --- REFERRAL REWARD LOGIC ---
                const isNowPaid = doc.paymentStatus === 'completed';
                const wasPaid = previousDoc?.paymentStatus === 'completed';
                const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user;
                if (isNowPaid && !wasPaid && userId) {
                    setImmediate(async () => {
                        await awardReferralCoins(payload, userId);
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
                                    admin: {},
                                },
                                {
                                    name: 'stripeSubscriptionID',
                                    type: 'text',
                                    admin: { description: 'The ID from Stripe', }
                                },
                                {
                                    name: 'nextPaymentDate',
                                    type: 'date',
                                    admin: {},
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
                            admin: {},
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
                                            name: 'subFreqID',
                                            label: 'Subscription Freq ID',
                                            type: 'text',
                                            required: true,
                                            admin: {
                                                width: '25%',
                                                description: 'The ID of the row in the subFreq array'
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
                            admin: {

                            },
                            type: 'group',
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
                                        { name: 'addressLine1', type: 'text' }
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
                                        { name: 'phoneNumber', type: 'text', },
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
                                    admin: {

                                    }
                                },
                                {
                                    name: 'subsStatus',
                                    type: 'select',
                                    defaultValue: 'active',
                                    admin: {
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
                                },
                            ],
                        },
                        {
                            name: 'pointsUsed',
                            type: 'number',
                            admin: {

                            }
                        },
                        {
                            name: 'financials',
                            type: 'group',
                            label: 'Financial Breakdown',
                            admin: {

                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        {
                                            name: 'subtotal',
                                            label: 'Subtotal (Base Price × Qty)',
                                            type: 'number',
                                            required: true,
                                            admin: { width: '50%', description: 'Product base price multiplied by quantity, before any discounts' }
                                        },
                                        {
                                            name: 'subscriptionDiscount',
                                            label: 'Subscription Discount',
                                            type: 'number',
                                            admin: { width: '50%', description: 'Discount from the subscription plan percentage' }
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
                                            name: 'taxPercentage',
                                            label: 'Tax Percentage',
                                            type: 'number',
                                            min: 0,
                                            max: 100,
                                            admin: { width: '50%', description: 'Tax percentage applied on (subtotal − discounts + shipping)', }
                                        },
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
                                            admin: { width: '50%', description: 'Final recurring amount charged (first payment may differ due to WT Coins)', }
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

            },
        },
        {
            name: 'guestAccessToken',
            type: 'text',
            admin: {
                hidden: true,
            },
        }
    ],
};