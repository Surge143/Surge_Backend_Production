import type { CollectionConfig } from "payload";
import { beforeWebCartChange } from "./hooks/beforeWebCartChange";

export const WebCart: CollectionConfig = {
    slug: 'web-cart',
    admin: {
        defaultColumns: ['user', 'items'],
        group: 'Website',
    },
    hooks: {
        beforeChange: [beforeWebCartChange],
    },
    access: {
        read: () => true,
        update: () => true,
        delete: () => true,
        create: () => true,
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
            ],
        },
    ],
    timestamps: true,
};