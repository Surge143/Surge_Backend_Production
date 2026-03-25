import { slugField, type CollectionConfig } from 'payload'

export const AppSubCategories: CollectionConfig = {
    slug: 'app-sub-categories',
    labels: {
        singular: 'Sub-category',
        plural: 'Sub-categories',
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
        group: 'Cafe Management',
        description: 'More specific groupings within a category',
        defaultColumns: ['id', 'title', 'parentCategory', 'slug'],
        hidden: ({ user }: any) => user?.role === 'shop-manager' || user?.role === 'barista',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'parentCategory',
            label: 'Parent Category',
            type: 'relationship',
            relationTo: 'app-categories', // Reference this same collection
            hasMany: false,
        },
        slugField({
            useAsSlug: 'title',
        })
    ],
}