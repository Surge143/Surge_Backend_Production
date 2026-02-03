import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const AppSubCategories: CollectionConfig = {
    slug: 'app-sub-categories',
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
        group: 'App',
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
            fieldToUse: 'title',
        }),
    ],
}