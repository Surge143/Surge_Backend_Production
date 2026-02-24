import type { CollectionConfig } from 'payload'

const Wishlist: CollectionConfig = {
    slug: 'wishlist',
    admin: {
        group: 'Common',
        defaultColumns: ['user', 'updatedAt'],
    },
    access: {
        read: () => true, // Access control is handled at document level or via custom API
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
            index: true,
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
            ],
        },
    ],
}

export { Wishlist }
