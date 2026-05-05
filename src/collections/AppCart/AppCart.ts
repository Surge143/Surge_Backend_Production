import type { CollectionConfig } from 'payload';
import { canReadCart, canUpdateOrDeleteCart } from './access';
import { beforeCartChange } from './hooks/beforeCartChange';
import { afterCartChange } from './hooks/afterCartChange';
import { productHighlightsField } from '../WebProducts/fields/productHighlightsField'

const AppCart: CollectionConfig = {
    slug: 'app-cart',
    labels: {
        singular: 'Cart',
        plural: 'Carts',
    },
    admin: {
        group: 'Cafe',
        defaultColumns: ['user', 'origin', 'updatedAt'],
        hidden: true,
    },
    access: {
        read: canReadCart,
        update: canUpdateOrDeleteCart,
        delete: canUpdateOrDeleteCart,
        create: () => true,
    },
    hooks: {
        beforeChange: [beforeCartChange],
        afterChange: [afterCartChange],
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
            name: 'origin',
            type: 'select',
            required: true,
            options: [
                { label: 'Cafe', value: 'cafe' },
                { label: 'Store', value: 'store' },
            ],
        },
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            admin: {
                condition: (data) => data?.origin === 'cafe',
            },
        },
        {
            name: 'items',
            type: 'array',
            fields: [
                {
                    name: 'product',
                    type: 'relationship',
                    relationTo: ['shop-menu', 'web-products'],
                    required: true,
                },
                {
                    name: 'vId',
                    label: 'Variant ID',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData, { user }) => data?.origin === 'store',
                    },
                },
                {
                    name: 'quantity',
                    type: 'number',
                    defaultValue: 1,
                    min: 1,
                },
                {
                    name: 'customizations',
                    type: 'json',
                    admin: {
                        description: 'Snapshot of selections (sectionTitle, label, price).',
                        condition: (data) => data?.origin === 'cafe',
                    },
                },
                productHighlightsField,
            ],
        },
    ],
    timestamps: true,
};

export { AppCart };