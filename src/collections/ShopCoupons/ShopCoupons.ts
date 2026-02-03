import type { CollectionConfig } from "payload";

export const ShopCoupons: CollectionConfig = {
    slug: "shop-coupon",
    labels: {
        singular: "Shop Coupon",
        plural: "Shop Coupons"
    },

    admin: {
        useAsTitle: "code",
        components: {
            beforeListTable: [
                '@/collections/ShopCoupons/components/ShopCouponQuickCreate#ShopCouponQuickCreate',
            ],
        },
        defaultColumns: ['code', "shop", 'status', 'expiryDate', 'discountType', 'discountAmount',],
        group: 'App',
    },

    access: {
        read: () => true,
        create: ({ req: { user } }) =>
            user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
        update: async ({ req: { user, payload }, id }) => {
            if (!user) return false
            if (user.role === 'admin' || user.role === 'super-admin') return true
            if (user.role === 'shop-manager') {
                // Check if the original coupon was created by admin/super-admin
                // If so, shop-manager cannot update it
                if (!id) return false
                try {
                    const shopCoupon = await payload.findByID({
                        collection: 'shop-coupon',
                        id: String(id),
                        depth: 2, // Need depth to get coupon.createdBy
                    })

                    // Get the first coupon from the couponRelation array
                    const couponRelation = shopCoupon.couponRelation
                    if (Array.isArray(couponRelation) && couponRelation.length > 0) {
                        const originalCoupon = typeof couponRelation[0] === 'object' ? couponRelation[0] : null

                        if (originalCoupon && originalCoupon.createdBy) {
                            const couponCreator = typeof originalCoupon.createdBy === 'object'
                                ? originalCoupon.createdBy
                                : await payload.findByID({ collection: 'admins', id: originalCoupon.createdBy })

                            // If the original coupon was created by admin/super-admin, deny access
                            if (couponCreator && (couponCreator.role === 'admin' || couponCreator.role === 'super-admin')) {
                                return false
                            }
                        }
                    }

                    // Otherwise, allow if this shop-manager created this shop-coupon
                    return { createdBy: { equals: user.id } }
                } catch (error) {
                    console.error('Error checking coupon creator:', error)
                    return false
                }
            }
            return false
        },
        delete: async ({ req: { user, payload }, id }) => {
            if (!user) return false
            if (user.role === 'admin' || user.role === 'super-admin') return true
            if (user.role === 'shop-manager') {
                return true
            }
            return false
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
    },
    fields: [
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            required: true,
            admin: {
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
                position: 'sidebar',
                readOnly: true,
            },
        },
        {
            name: 'couponRelation',
            type: 'relationship',
            relationTo: 'coupon',
            hasMany: true,
            required: true,
            admin: {
                position: 'sidebar',
                readOnly: true,
                hidden: true,
            },
        },
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
                description: 'Please select at least one option.',
                hidden: true,
            },
            defaultValue: {
                website: false,
                app: true
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