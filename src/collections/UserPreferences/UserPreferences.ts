import type { CollectionConfig } from 'payload';

const UserPreferences: CollectionConfig = {
    slug: 'user-preferences',
    admin: {
        group: 'Common',
        defaultColumns: ['user', 'updatedAt'],
        hidden: true,
        description: 'Stores per-user product customization preferences for the cafe app.',
    },
    access: {
        // Only the owning user or admins can read
        read: () => true,  // row-level filtering is done in the API route
        create: () => false,  // managed exclusively via the afterCartChange hook
        update: () => false,  // managed exclusively via the afterCartChange hook
        delete: ({ req }) => req.user?.collection === 'admins',
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true,
            index: true,
            admin: {
                readOnly: true,
            },
        },
        {
            name: 'cafeProductPreferences',
            label: 'Cafe Product Preferences',
            type: 'array',
            admin: {
                description: 'Last-used customization selections per cafe menu product.',
            },
            fields: [
                {
                    name: 'productId',
                    type: 'text',
                    required: true,
                    index: true,
                    admin: {
                        description: 'The shop-menu product ID this preference belongs to.',
                        readOnly: true,
                    },
                },
                {
                    name: 'customizations',
                    type: 'json',
                    admin: {
                        description: 'Snapshot of the last-used customization selections (sectionTitle, label, price).',
                        readOnly: true,
                    },
                },
                {
                    name: 'savedAt',
                    type: 'date',
                    admin: {
                        description: 'When this preference was last saved.',
                        readOnly: true,
                        date: {
                            displayFormat: 'dd/MM/yyyy HH:mm',
                        },
                    },
                },
            ],
        },
    ],
    timestamps: true,
};

export { UserPreferences };
