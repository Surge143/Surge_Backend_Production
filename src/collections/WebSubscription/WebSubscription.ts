import type { CollectionConfig } from "payload";

export const WebSubscription: CollectionConfig = {
    slug: 'web-subscription',
    admin: {
        useAsTitle: 'id',
        group: 'Website',
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
                                    name: 'stripeSubscriptionID',
                                    type: 'text',
                                    admin: { description: 'The ID from Stripe' }
                                },
                                {
                                    name: 'nextPaymentDate',
                                    type: 'date',
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
                                            required: true,
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
                                        { label: 'Refunded', value: 'refunded' },
                                    ],
                                },
                                {
                                    name: 'subsStatus',
                                    type: 'select',
                                    defaultValue: 'placed',
                                    admin: {
                                        condition: (data) => data?.paymentStatus === 'completed',
                                    },
                                    options: [
                                        { label: 'Active', value: 'active' },
                                        { label: 'Inactive', value: 'inactive' },
                                        { label: 'Cancalled', value: 'cancelled' },
                                    ],
                                },
                            ],
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