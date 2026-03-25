import { slugField, type CollectionConfig } from 'payload'

export const WebCategories: CollectionConfig = {
    slug: 'web-categories',
    labels: {
        singular: 'Category',
        plural: 'Categories',
    },
    access: {
        read: () => true,
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
    admin: {
        useAsTitle: 'title',
        group: 'Store Management',
        description: 'Organize products into groups',
        defaultColumns: ['id', 'title', 'slug'],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        slugField({
            useAsSlug: "title",
        })
    ],
}