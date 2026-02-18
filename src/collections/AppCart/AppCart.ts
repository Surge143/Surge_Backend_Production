import type { CollectionConfig } from 'payload';
import { canReadCart, canUpdateOrDeleteCart } from './access';
import { beforeCartChange } from './hooks/beforeCartChange';

const AppCart: CollectionConfig = {
    slug: 'app-cart',
    admin: {
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
                { label: 'App', value: 'app' },
                { label: 'Website', value: 'website' },
            ],
        },
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            required: true,
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
                    name: 'quantity',
                    type: 'number',
                    defaultValue: 1,
                    min: 1,
                },
                {
                    name: 'price',
                    type: 'number',
                    admin: {
                        description: 'Snapshotted base price of the product at the time of addition/selection.',
                    }
                },
                {
                    name: 'customizations',
                    type: 'json',
                    admin: {
                        description: 'Stores a snapshot of customization selections (sectionTitle, label, price) to preserve price history.',
                    }
                }
            ],
        },
    ],
};

export { AppCart };
