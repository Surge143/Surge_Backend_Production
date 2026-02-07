import type { CollectionConfig } from "payload";

export const WebOrders: CollectionConfig = {
    slug: 'web-orders',
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
                                { name: 'user', type: 'relationship', relationTo: 'users' },
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
                                        { name: 'product', type: 'relationship', relationTo: 'web-products', required: true, admin: { width: '30%' } },
                                        { name: 'variant', type: 'relationship', relationTo: 'web-products', required: true, admin: { width: '30%' } },
                                        { name: 'quantity', type: 'number', required: true, admin: { width: '15%' } },
                                        { name: 'price', type: 'number', required: true, admin: { width: '25%' } },
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
                                        { name: 'addressLine1', type: 'text', required: true },
                                        { name: 'addressLine2', type: 'text' },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'city', type: 'text', required: true },
                                        {
                                            name: 'emirates',
                                            type: 'select',
                                            required: true,
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
                                        { name: 'phoneNumber', type: 'text', required: true },
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
                                        { name: 'addressLine1', type: 'text', required: true },
                                        { name: 'addressLine2', type: 'text' },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'city', type: 'text', required: true },
                                        {
                                            name: 'emirates',
                                            type: 'select',
                                            required: true,
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
                                        { name: 'phoneNumber', type: 'text', required: true },
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
                                        condition: (data) => data?.paymentStatus === 'completed',
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
                            name: 'appliedBenefit',
                            type: 'select',
                            defaultValue: 'none',
                            options: [
                                { label: 'None', value: 'none' },
                                { label: 'Coupon', value: 'coupon' },
                                { label: 'Points', value: 'points' },
                            ],
                        },
                        {
                            name: 'couponCode',
                            type: 'relationship',
                            relationTo: 'coupon',
                            admin: {
                                condition: (data) => data?.appliedBenefit === 'coupon',
                            },
                        },
                        {
                            name: 'pointsUsed',
                            type: 'number',
                            admin: {
                                condition: (data) => data?.appliedBenefit === 'points',
                            },
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
                hidden: true, // This hides the field from the Admin Panel entirely
            },
        },
    ],
};