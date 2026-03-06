import type { CollectionConfig } from "payload";
import { getShopCouponsHandler } from "./endpoints/coupons/getCoupons";
import { validateAppCouponHandler } from "./endpoints/coupons/validateAppCouponHandler";
import { getAllItemsHandler } from "./endpoints/menu/getAllItems";
import { getBestSellerHandler } from "./endpoints/menu/bestSeller";
import { individualItemHandler } from "./endpoints/menu/individualItem";
import { getBaristaHandler } from "./endpoints/barista/getBarista";


export const Shop: CollectionConfig = {
    slug: "shop",
    labels: {
        singular: "Shop",
        plural: "Shops"
    },
    endpoints: [
        { path: '/:shopId/coupons/:couponCode', method: 'get', handler: validateAppCouponHandler },
        { path: '/:shopId/coupons', method: 'get', handler: getShopCouponsHandler },
        { path: '/:shopId/menu-items', method: 'get', handler: getAllItemsHandler },
        { path: '/:shopId/best-seller', method: 'get', handler: getBestSellerHandler },
        { path: '/:shopId/menu-items/:itemId', method: 'get', handler: individualItemHandler },
        { path: '/:shopId/barista', method: 'get', handler: getBaristaHandler }
    ],
    admin: {
        useAsTitle: 'shopManager',
        defaultColumns: ['isShopOpen', 'shopManager', 'address.city', 'openingTime', 'closingTime'],
        group: 'Cafe',
    },
    access: {
        read: () => true,
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'operationalSettings',
            type: 'group',
            label: 'Operational Settings',
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: "openingTime",
                            type: 'date',
                            required: true,
                            admin: {
                                width: '50%',
                                date: {
                                    pickerAppearance: 'timeOnly',
                                    displayFormat: 'HH:mm',
                                },
                            },
                        },
                        {
                            name: "closingTime",
                            type: 'date',
                            required: true,
                            admin: {
                                width: '50%',
                                date: {
                                    pickerAppearance: 'timeOnly',
                                    displayFormat: 'HH:mm',
                                },
                            },
                        },
                    ]
                },
                {
                    name: 'operatingDays',
                    type: 'group',
                    label: 'Days of Operation',
                    admin: {
                        description: 'Select which days the shop is open for business.'
                    },
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                { name: 'monday', type: 'checkbox', label: 'Mon', defaultValue: true, admin: { width: '14%' } },
                                { name: 'tuesday', type: 'checkbox', label: 'Tue', defaultValue: true, admin: { width: '14%' } },
                                { name: 'wednesday', type: 'checkbox', label: 'Wed', defaultValue: true, admin: { width: '14%' } },
                                { name: 'thursday', type: 'checkbox', label: 'Thu', defaultValue: true, admin: { width: '14%' } },
                                { name: 'friday', type: 'checkbox', label: 'Fri', defaultValue: true, admin: { width: '14%' } },
                                { name: 'saturday', type: 'checkbox', label: 'Sat', defaultValue: false, admin: { width: '15%' } },
                                { name: 'sunday', type: 'checkbox', label: 'Sun', defaultValue: false, admin: { width: '15%' } },
                            ]
                        }
                    ]
                },
            ]
        },
        {
            name: "address",
            type: 'group',
            label: 'Location & Address',
            required: true,
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: "street",
                            label: "Street Address",
                            type: "text",
                            admin: { width: '70%' }
                        },
                        {
                            name: "apartment",
                            label: "Apt / Suite",
                            type: "text",
                            admin: { width: '30%' }
                        },
                    ]
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: "city",
                            label: "City",
                            type: "text",
                            admin: { width: '50%' }
                        },
                        {
                            name: "emirates",
                            label: "Emirate",
                            type: "select",
                            required: true,
                            admin: { width: '50%' },
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
                    ]
                },
                {
                    name: "country",
                    label: "Country",
                    type: "text",
                    defaultValue: "United Arab Emirates",
                    admin: {
                        readOnly: true,
                        description: 'Country is fixed to UAE for this cafe group.'
                    }
                },
            ]
        },
        // --- Sidebar (Logic Kept Untouched) ---
        {
            name: 'isShopOpen',
            label: 'Live Shop Status',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                position: 'sidebar',
                description: 'Immediately opens/closes shop for customers.',
            },
        },
        {
            name: 'shopManager',
            type: 'relationship',
            relationTo: 'admins',
            required: true,
            filterOptions: () => ({
                role: { equals: 'shop-manager' },
            }),
            admin: {
                position: 'sidebar',
            }
        }
    ]
}