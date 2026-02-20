import type { CollectionConfig } from "payload";
import { getShopCouponsHandler } from "./endpoints/coupons/getCoupons";
import { validateAppCouponHandler } from "./endpoints/coupons/validateAppCouponHandler";
import { getAllItemsHandler } from "./endpoints/menu/getAllItems";
import { individualItemHandler } from "./endpoints/menu/individualItem";

export const Shop: CollectionConfig = {
    slug: "shop",
    labels: {
        singular: "Shop",
        plural: "Shops"
    },

    endpoints: [
        {
            path: '/:shopId/coupons/:couponCode',
            method: 'get',
            handler: validateAppCouponHandler,
        },
        {
            path: '/:shopId/coupons',
            method: 'get',
            handler: getShopCouponsHandler,
        },
        {
            path: '/:shopId/menu-items',
            method: 'get',
            handler: getAllItemsHandler,
        },
        {
            path: '/:shopId/menu-items/:itemId',
            method: 'get',
            handler: individualItemHandler,
        }
    ],

    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'shopManager', 'closingTime', 'openingTime'],
        group: 'App',
    },
    access: {
        read: () => { return true },
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
    fields: [
        {
            name: "name",
            type: "text",
            required: true
        },
        {
            name: 'tagline',
            type: 'text',
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: "openingTime",
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'timeOnly',
                    displayFormat: 'HH:mm',
                },
            },
            required: true,
        },
        {
            name: "closingTime",
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'timeOnly',
                    displayFormat: 'HH:mm',
                },
            },
            required: true,
        },
        {
            name: "address",
            type: 'group',
            required: true,
            fields: [
                {
                    name: "street",
                    label: "Street",
                    type: "text",
                },
                {
                    name: "apartment",
                    label: "Apartment",
                    type: "text",
                },
                {
                    name: "city",
                    label: "City",
                    type: "text",
                },
                {
                    name: "emirates",
                    label: "Emirates",
                    type: "select",
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
                {
                    name: "country",
                    label: "Country",
                    type: "text",
                    defaultValue: "United Arab Emirates",
                    admin: {
                        readOnly: true,
                    }
                },
            ]
        },
        {
            name: 'shopManager',
            type: 'relationship',
            relationTo: 'admins',
            required: true,
            filterOptions: () => {
                return {
                    role: {
                        equals: 'shop-manager',
                    },
                }
            },
        }
    ]
}
