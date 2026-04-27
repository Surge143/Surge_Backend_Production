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
    versions: {
        drafts: {
            autosave: {
                interval: 3000,
            },
        },
        maxPerDoc: 50,
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
        }),
        {
            name: 'lastUpdatedBy',
            label: 'Last Edited By',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'The email of the admin who last updated this sub-category.',
            },
            hooks: {
                beforeChange: [
                    ({ req, value }) => {
                        if (req.user && req.user.collection === 'admins') {
                            return req.user.email
                        }
                        return value
                    },
                ],
            },
        },
        {
            name: 'createdBy',
            label: 'Created By',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'The email of the admin who created this sub-category.',
            },
            hooks: {
                beforeChange: [
                    ({ req, operation, value }) => {
                        if (operation === 'create' && req.user && req.user.collection === 'admins') {
                            return req.user.email
                        }
                        return value
                    },
                ],
            },
        },
    ],
}