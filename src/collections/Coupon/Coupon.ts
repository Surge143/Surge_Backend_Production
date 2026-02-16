import type { CollectionConfig } from "payload";
import { validateWebCouponHandler } from "./endpoints/validateWebCoupon";

export const Coupon: CollectionConfig = {
    slug: "coupon",
    labels: {
        singular: "Coupon",
        plural: "Coupons"
    },
    endpoints: [
        {
            path: '/coupons/:couponCode',
            method: 'get',
            handler: validateWebCouponHandler,
        },
    ],
    admin: {
        useAsTitle: "code",
        defaultColumns: ["code", "status", "isPubliclyVisible", "applicability", "discountType", "discountAmount", "expiryDate"],
    },
    access: {
        read: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager';
        },
        update: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        delete: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        create: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
    },
    hooks: {
        beforeChange: [
            async ({ data, req: { user }, operation }) => {
                if (operation === 'create' && user) {
                    data.createdBy = user.id;
                }
                return data;
            },
        ],
        afterChange: [
            async ({ doc, req: { payload }, operation }) => {
                if (operation === 'update') {
                    // Update all related shop coupons
                    const shopCoupons = await payload.find({
                        collection: 'shop-coupon',
                        where: {
                            couponRelation: {
                                contains: doc.id,
                            },
                        },
                        depth: 0,
                    });

                    if (shopCoupons.docs.length > 0) {
                        await Promise.all(
                            shopCoupons.docs.map((shopCoupon) =>
                                payload.update({
                                    collection: 'shop-coupon',
                                    id: shopCoupon.id,
                                    data: {
                                        status: doc.status,
                                        code: doc.code,
                                        couponFor: doc.couponFor,
                                        isPubliclyVisible: doc.isPubliclyVisible,
                                        applicability: doc.applicability,
                                        products: doc.products,
                                        discountType: doc.discountType,
                                        discountAmount: doc.discountAmount,
                                        expiryDate: doc.expiryDate,
                                        minimumAmount: doc.minimumAmount,
                                        usageLimit: doc.usageLimit,
                                        usageLimitPerUser: doc.usageLimitPerUser,
                                        usageCount: doc.usageCount,
                                    },
                                })
                            )
                        );
                    }
                }
                return doc;
            },
        ],
    },
    fields: [
        {
            name: 'createdBy',
            type: 'relationship',
            relationTo: 'admins',
            admin: {
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
                position: 'sidebar',
                readOnly: true,
                hidden: true,
            },
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            admin: {
                description: 'Select status'
            },
            defaultValue: "active",
            options: [
                {
                    label: "Active",
                    value: "active"
                },
                {
                    label: "Inactive",
                    value: "inactive"
                }
            ]
        },
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
            admin: {
                description: 'Enter coupon code',
            }
        },
        {
            name: 'couponFor',
            type: 'group',
            label: 'Coupon For',
            admin: {
                description: 'Please select at least one option.'
            },
            // Validation logic for the group
            validate: (value: any) => {
                if (value?.website || value?.app) {
                    return true;
                }
                return 'You must select at least one: Website or App or Both';
            },

            fields: [
                {
                    name: 'website',
                    type: 'checkbox',
                    label: 'Website',
                    admin: {
                        width: '50%',
                    },
                },
                {
                    name: 'app',
                    type: 'checkbox',
                    label: 'App',
                    admin: {
                        width: '50%',
                    },
                },
            ],
        },
        {
            name: 'isPubliclyVisible',
            label: 'Visible to Customers',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                position: 'sidebar',
                description: 'Toggle on to show this coupon in the "Available Offers" section on both Web and App.'
            },
        },
        {
            name: 'applicability',
            type: 'select',
            label: 'Coupon Applicability',
            defaultValue: 'all',
            required: true,
            options: [
                {
                    label: 'Apply to Entire Cart',
                    value: 'all',
                },
                {
                    label: 'Specific Products Only',
                    value: 'products',
                },
            ],
        },
        {
            name: 'products',
            type: 'relationship',
            label: 'Products',
            relationTo: ['shop-menu', 'web-products'],
            hasMany: true,
            required: true,
            admin: {
                description: 'Select products',
                condition: (_, { applicability } = {}) => applicability === 'products',
            },
        },
        {
            name: "discountType",
            label: "Discount Type",
            type: "select",
            required: true,
            admin: {
                description: 'Select discount type'
            },
            defaultValue: "percentage",
            options: [
                {
                    label: "Percentage",
                    value: "percentage"
                },
                {
                    label: "Fixed",
                    value: "fixed"
                }
            ]
        },
        {
            name: "discountAmount",
            label: "Discount Amount",
            type: "number",
            required: true,
            admin: {
                description: 'Enter discount amount'
            }
        },
        {
            name: 'expiryDate',
            label: 'Expiry Date',
            type: 'date',
            required: true,
            admin: {
                description: 'Select expiry date'
            }
        },
        {
            name: 'minimumAmount',
            label: 'Minimum Amount',
            type: 'number',
            required: true,
            admin: {
                description: 'Enter minimum amount'
            }
        },
        {
            name: 'usageLimit',
            label: 'Total Usage Limit',
            type: 'number',
            admin: {
                description: 'The maximum number of times this coupon can be used across all customers (e.g., "First 100 people").',
                placeholder: 'Leave blank for unlimited',
            },
        },
        {
            name: 'usageLimitPerUser',
            label: 'Usage Limit Per User',
            type: 'number',
            required: true,
            defaultValue: 1,
            admin: {
                description: 'How many times a single customer can use this specific coupon.',
            },
        },
        {
            name: 'usageCount',
            label: 'Current Usage Tracker',
            type: 'number',
            defaultValue: 0,
            admin: {
                hidden: true, // Keep hidden as this is your internal counter
                description: 'Internal counter of how many times this coupon has been successfully redeemed.',
            },
        },
    ]
}