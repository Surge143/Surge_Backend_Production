import { slugField, type CollectionConfig } from 'payload'

export const AppSubCategories: CollectionConfig = {
    slug: 'app-sub-categories',
    labels: {
        singular: 'Sub Category',
        plural: 'Sub Categories',
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
        group: 'Cafe',
        // Helps you see the hierarchy in the admin dashboard list
        defaultColumns: ['id', 'title', 'parentCategory', 'slug'],
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