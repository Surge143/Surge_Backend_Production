import type { CollectionConfig } from "payload";
import { beforeValidateHook } from "./hooks/beforeValidate";
import { afterChangeHook } from "./hooks/afterChange";
import { afterDeleteHook } from "./hooks/afterDelete";
import { refundHandler } from "./endpoints/refundHandler";
import { linkGuestOrderToUser } from "../WebOrders/hooks/linkGuestToUser";

export const AppOrders: CollectionConfig = {
    slug: "app-orders",

    labels: {
        singular: "App Order",
        plural: "App Orders"
    },
    admin: {
        defaultColumns: ["name", "shop", "updatedAt"],
        group: 'App',
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
        beforeChange: [],
        afterChange: [
            afterChangeHook,
            async ({ doc, previousDoc, req: { payload } }) => {
                await linkGuestOrderToUser({
                    payload,
                    doc,
                    previousDoc,
                    collection: 'app-orders',
                    paidStatus: 'paid',
                });
            }
        ],
        afterDelete: [afterDeleteHook]
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
                                    admin: { width: '50%' }
                                },
                            ]
                        },
                        {
                            name: 'appOrderStatus',
                            type: 'select',
                            required: true,
                            defaultValue: 'pending',
                            options: [
                                { label: 'Pending', value: 'pending' },
                                { label: 'Preparing', value: 'preparing' },
                                { label: 'Pickup', value: 'pickup' },
                                { label: 'Order Pickedup', value: 'pickedup' },
                                { label: 'Cancelled', value: 'cancelled' },
                            ],
                            admin: {
                                condition: (data) => data?.orderAcceptance === 'accepted'
                            }
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
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: "shop",
                                    type: "relationship",
                                    relationTo: "shop",
                                    required: true,
                                    admin: { width: '50%' },
                                },
                                {
                                    name: 'barista',
                                    type: 'relationship',
                                    relationTo: 'admins',
                                    admin: { width: '50%' },
                                    filterOptions: {
                                        role: { equals: 'barista' }
                                    }
                                },
                            ]
                        },
                        {
                            name: "items",
                            type: "array",
                            required: true,
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
                                }
                            ]
                        },
                        {
                            name: 'specialInstructions',
                            type: 'textarea',
                        },
                    ]
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
                                    admin: { width: '50%' }
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
                                        condition: (data) => data?.orderType === 'take-away',
                                    }
                                },
                            ]
                        },
                        {
                            name: 'slot',
                            type: 'relationship',
                            relationTo: 'slots',
                            required: false,
                            admin: {
                                condition: (data) => data?.timeSelection === 'custom' && data?.orderType === 'take-away',
                            },
                        },
                    ]
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
                                    admin: { width: '30%', style: { marginTop: '35px' } }
                                },
                                {
                                    name: 'coupon',
                                    type: 'relationship',
                                    relationTo: 'shop-coupon',
                                    admin: {
                                        width: '70%',
                                        condition: (data) => Boolean(data?.isCouponUsed)
                                    },
                                },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'coinsUsed',
                                    type: 'number',
                                    admin: { width: '50%' }
                                },
                                {
                                    name: 'stampRewards',
                                    type: 'relationship',
                                    relationTo: 'shop-menu',
                                    hasMany: true,
                                    filterOptions: async ({ req: { payload } }) => {
                                        const stampRewardProductsGlobal = await payload.findGlobal({
                                            slug: 'stamp-reward-products',
                                            depth: 0,
                                        });

                                        const validStampProductIds = (stampRewardProductsGlobal?.stampProducts || []).map((p: any) => typeof p === 'object' ? p.id : p);

                                        return {
                                            id: { in: validStampProductIds }
                                        };
                                    },
                                    admin: { width: '50%' },
                                },
                            ]
                        },
                        {
                            name: 'financials',
                            type: 'group',
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'subtotal', type: 'number', admin: { width: '33%' } },
                                        { name: 'discountAmount', type: 'number', admin: { width: '33%' } },
                                        { name: 'total', type: 'number', admin: { width: '34%' } },
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'stripeOrderId',
                            type: 'text',
                            admin: { readOnly: true }
                        },
                    ]
                }
            ]
        },
        {
            name: 'stripeData',
            type: 'json',
            admin: {
                readOnly: true,
                hidden: true,
            }
        }
    ],
}
