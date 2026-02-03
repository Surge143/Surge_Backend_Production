import type { CollectionConfig } from "payload";
import { getShopCouponsHandler } from "./endpoints/coupons/getCoupons";
import { validateCouponHandler } from "./endpoints/coupons/validateCouponHandler";
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
            handler: validateCouponHandler,
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
            type: 'text',
            required: true,
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
