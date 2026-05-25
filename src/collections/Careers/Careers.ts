import { type CollectionConfig } from 'payload'

const countWords = (val: string): number => val.trim().split(/\s+/).filter(Boolean).length

export const Careers: CollectionConfig = {
    slug: 'careers',
    admin: {
        useAsTitle: 'title',
        group: 'Marketing',
        description: 'Manage job openings and career opportunities',
        defaultColumns: ['title', 'createdBy', 'lastUpdatedBy', 'updatedAt'],
        hidden: ({ user }: any) => {
            const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
            return !isAuthorized
        },
    },
    access: {
        read: () => true,
        create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'title',
            label: 'Job Title',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'e.g., Senior Barista – Dubai Marina',
                description: 'Maximum 100 words.',
            },
            validate: (val: string | null | undefined) => {
                if (!val) return true
                const words = countWords(val)
                if (words > 100) return `Title must not exceed 100 words (currently ${words}).`
                return true
            },
        },
        {
            name: 'shortDescription',
            label: 'Short Description',
            type: 'textarea',
            required: true,
            admin: {
                placeholder: 'Briefly describe the role, key responsibilities, and requirements...',
                description: 'Maximum 500 words. Plain text only.',
            },
            validate: (val: string | null | undefined) => {
                if (!val) return true
                const words = countWords(val)
                if (words > 500) return `Short description must not exceed 500 words (currently ${words}).`
                return true
            },
        },
        {
            name: 'link',
            label: 'Application Link',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'https://example.com/apply',
                description: 'Full URL where candidates can apply.',
            },
            validate: (val: string | null | undefined) => {
                if (!val) return true
                try {
                    const url = new URL(val)
                    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                        return 'Link must start with http:// or https://'
                    }
                    return true
                } catch {
                    return 'Please enter a valid URL (e.g., https://example.com/apply)'
                }
            },
        },
        {
            name: 'lastUpdatedBy',
            label: 'Last Edited By',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'The email of the admin who last updated this career listing.',
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
                description: 'The email of the admin who created this career listing.',
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
    timestamps: true,
}