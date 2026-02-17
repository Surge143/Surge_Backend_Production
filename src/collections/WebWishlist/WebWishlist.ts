import type { CollectionConfig } from "payload";

const WebWishlist: CollectionConfig = {
    slug: 'web-wishlist',
    admin: {
        // hidden: true,
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
            ],
        },
    ],
};

export { WebWishlist };