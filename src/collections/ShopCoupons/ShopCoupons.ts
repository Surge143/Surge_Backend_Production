import type { CollectionConfig } from "payload";
import { validateFutureDate } from "@/utilities/validateFutureDate";

export const ShopCoupons: CollectionConfig = {
    slug: "shop-coupon",
    labels: {
        singular: "Cafe Coupon",
        plural: "Cafe Coupons"
    },
    versions: {
        drafts: true,
        maxPerDoc: 50,
    },
    admin: {
        useAsTitle: "code",
        components: {
            beforeListTable: [
                '@/collections/ShopCoupons/components/ShopCouponQuickCreate#ShopCouponQuickCreate',
            ],
        },
        defaultColumns: ['code', "shop", 'couponStatus', 'expiryDate', 'discountType', 'discountAmount'],
        group: 'Cafe',
    },

    access: {
        read: () => true,
        create: ({ req: { user } }) =>
            user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
        update: async ({ req: { user, payload }, id }) => {
            if (!user) return false
            if (user.role === 'admin' || user.role === 'super-admin') return true
            if (user.role === 'shop-manager') {
                if (!id) return false
                try {
                    const shopCoupon = await payload.findByID({
                        collection: 'shop-coupon',
                        id: String(id),
                        depth: 2,
                    })

                    const couponRelation = shopCoupon.couponRelation
                    if (Array.isArray(couponRelation) && couponRelation.length > 0) {
                        const originalCoupon = typeof couponRelation[0] === 'object' ? couponRelation[0] : null

                        if (originalCoupon && originalCoupon.createdBy) {
                            const couponCreator = typeof originalCoupon.createdBy === 'object'
                                ? originalCoupon.createdBy
                                : await payload.findByID({ collection: 'admins', id: originalCoupon.createdBy })

                            if (couponCreator && (couponCreator.role === 'admin' || couponCreator.role === 'super-admin')) {
                                return false
                            }
                        }
                    }
                    return { createdBy: { equals: user.id } }
                } catch (error) {
                    console.error('Error checking coupon creator:', error)
                    return false
                }
            }
            return false
        },
        delete: async ({ req: { user } }) => {
            if (!user) return false
            if (user.role === 'admin' || user.role === 'super-admin' || user.role === 'shop-manager') return true
            return false
        },
    },

    hooks: {
        beforeChange: [
            async ({ data, req: { user, payload }, operation }) => {
                if (operation === 'create' && user) {
                    data.createdBy = user.id;

                    if (user.role === 'shop-manager' && !data.shop) {
                        try {
                            const shops = await payload.find({
                                collection: 'shop',
                                where: { shopManager: { equals: user.id } },
                                limit: 1,
                                depth: 0,
                            })
                            if (shops.docs.length > 0) {
                                data.shop = shops.docs[0].id
                            }
                        } catch (e) {
                            console.error('Could not auto-fill shop for shop-manager:', e)
                        }
                    }
                }
                return data;
            },
        ],
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'General Info',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: "code",
                                    label: "Coupon Code",
                                    type: "text",
                                    required: true,
                                    admin: {
                                        width: '50%',
                                        placeholder: 'e.g. SUMMER50',
                                        description: 'Unique code customers enter at checkout. Use uppercase letters and numbers only.',
                                    }
                                },
                                {
                                    name: 'couponStatus',
                                    label: 'Status',
                                    type: 'select',
                                    required: true,
                                    defaultValue: "active",
                                    options: [
                                        { label: "Active", value: "active" },
                                        { label: "Inactive", value: "inactive" }
                                    ],
                                    admin: {
                                        width: '50%',
                                        description: 'Inactive coupons cannot be applied at checkout even if the code is correct.',
                                    }
                                },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'discountType',
                                    label: 'Discount Type',
                                    type: 'select',
                                    required: true,
                                    defaultValue: "percentage",
                                    options: [
                                        { label: 'Percentage', value: 'percentage' },
                                        { label: 'Fixed Amount', value: 'fixed' },
                                    ],
                                    admin: {
                                        width: '50%',
                                        description: 'Percentage deducts a % of the order total; Fixed Amount deducts a flat dollar value.',
                                    }
                                },
                                {
                                    name: 'discountAmount',
                                    label: ({ data, siblingData }: any) => (data?.discountType || siblingData?.discountType) === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount',
                                    type: 'number',
                                    required: true,
                                    validate: (val: any, { data }: any) => {
                                        if (data?.discountType === 'percentage' && (val < 0 || val > 100)) return 'Percentage must be between 0 and 100';
                                        if (val < 0) return 'Discount cannot be negative';
                                        return true;
                                    },
                                    admin: {
                                        width: '50%',
                                        description: ({ data, siblingData }: any) => (data?.discountType || siblingData?.discountType) === 'percentage' ? 'Value between 0-100' : 'Total dollar amount to deduct',
                                    },
                                },
                            ]
                        }
                    ]
                },
                {
                    label: 'Conditions & Limits',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'applicability',
                                    type: 'select',
                                    label: 'Applicability',
                                    defaultValue: 'all',
                                    required: true,
                                    options: [
                                        { label: 'Entire Cart', value: 'all' },
                                        { label: 'Specific Products', value: 'products' },
                                    ],
                                    admin: {
                                        width: '50%',
                                        description: 'Choose whether this coupon applies to the entire cart or only specific products.',
                                    }
                                },
                                {
                                    name: 'expiryDate',
                                    label: 'Expiry Date',
                                    type: 'date',
                                    required: true,
                                    validate: validateFutureDate,
                                    admin: {
                                        width: '50%',
                                        description: 'Coupon will be automatically invalidated after this date.',
                                    }
                                },
                            ]
                        },
                        {
                            name: 'products',
                            type: 'relationship',
                            label: 'Target Products',
                            relationTo: ['shop-menu', 'web-products'],
                            hasMany: true,
                            admin: {
                                condition: (_, { applicability } = {}) => applicability === 'products',
                                description: 'Select the specific products or menu items this coupon applies to.',
                            },
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'minimumAmount',
                                    label: 'Minimum Purchase Amount',
                                    type: 'number',
                                    required: true,
                                    min: 0,
                                    validate: (val: any) => {
                                        if (val < 0) return 'Minimum amount cannot be negative';
                                        return true;
                                    },
                                    admin: {
                                        width: '33%',
                                        description: 'Minimum cart total required to apply this coupon. Set to 0 for no minimum.',
                                    }
                                },
                                {
                                    name: 'usageLimit',
                                    label: 'Total Usage Limit',
                                    type: 'number',
                                    min: 0,
                                    validate: (val: any) => {
                                        if (val !== null && val < 0) return 'Limit cannot be negative';
                                        return true;
                                    },
                                    admin: {
                                        width: '33%',
                                        placeholder: 'Unlimited',
                                        description: 'Max number of times this coupon can be used across all users.',
                                    },
                                },
                                {
                                    name: 'usageLimitPerUser',
                                    label: 'Limit Per User',
                                    type: 'number',
                                    required: true,
                                    defaultValue: 1,
                                    min: 0,
                                    validate: (val: any) => {
                                        if (val < 0) return 'Per user limit cannot be negative';
                                        return true;
                                    },
                                    admin: {
                                        width: '34%',
                                        description: 'Max number of times a single customer can use this coupon.',
                                    },
                                },
                            ]
                        }
                    ]
                }
            ]
        },
        // --- Sidebar Fields ---
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            required: true,
            admin: {
                position: 'sidebar',
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
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
            name: 'couponFor',
            type: 'group',
            label: 'Coupon Visibility',
            defaultValue: { website: false, app: true },
            admin: {
                hidden: true,
            },
            validate: (value: any) => {
                if (value?.website || value?.app) return true;
                return 'You must select at least one platform';
            },
            fields: [
                {
                    name: 'website',
                    type: 'checkbox',
                    label: 'Available on Website',
                },
                {
                    name: 'app',
                    type: 'checkbox',
                    label: 'Available on App',
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
                description: 'Toggle on to show this coupon in "Available Offers".'
            },
        },
        {
            name: 'usageCount',
            type: 'number',
            defaultValue: 0,
            admin: {
                hidden: true,
                description: 'Internal counter of how many times this coupon has been used.'
            },
        },
    ]
}