import type { CollectionConfig } from "payload";
import { beforeWebCartChange } from "./hooks/beforeWebCartChange";
import { productHighlightsField } from '../WebProducts/fields/productHighlightsField'

export const WebCart: CollectionConfig = {
    slug: 'web-cart',
    labels: {
        singular: 'Abandoned Cart',
        plural: 'Abandoned Carts',
    },
    admin: {
        defaultColumns: ['user', 'items'],
        group: 'Store Management',
        description: "Follow up on customers who didn't check out",
        hidden: ({ user }: any) => user?.role !== 'super-admin',
    },
    hooks: {
        beforeChange: [beforeWebCartChange],
    },
    access: {
        // The custom /api/website/cart route already scopes correctly to req.user,
        // but this collection was also reachable at the raw /api/web-cart REST
        // endpoint with no owner check at all — anyone could read/edit/wipe any
        // other customer's cart by guessing an ID. Mirrors AppCart/access.ts,
        // which already does this correctly for the mobile app's cart.
        read: ({ req: { user } }) => {
            if (!user) return false;
            const u = user as any;
            if (u.role === 'admin' || u.role === 'super-admin') return true;
            return { user: { equals: user.id } };
        },
        update: ({ req: { user } }) => {
            if (!user) return false;
            const u = user as any;
            if (u.role === 'admin' || u.role === 'super-admin') return true;
            return { user: { equals: user.id } };
        },
        delete: ({ req: { user } }) => {
            if (!user) return false;
            const u = user as any;
            if (u.role === 'admin' || u.role === 'super-admin') return true;
            return { user: { equals: user.id } };
        },
        create: ({ req: { user }, data }: any) => {
            if (!user) return false;
            const u = user as any;
            if (u.role === 'admin' || u.role === 'super-admin') return true;
            // A customer may only ever create a cart record for themselves.
            return !data?.user || String(data.user) === String(user.id);
        },
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true,
        },
        {
            name: 'items',
            type: 'array',
            fields: [
                {
                    name: 'product',
                    type: 'relationship',
                    relationTo: 'web-products',
                    required: true,
                },
                {
                    name: 'vId',
                    label: 'Variant ID',
                    type: 'text',
                },
                {
                    name: 'quantity',
                    type: 'number',
                    defaultValue: 1,
                    min: 1,
                },
                productHighlightsField,
            ],
        },
    ],
    timestamps: true,
};