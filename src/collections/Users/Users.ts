import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',

    auth: true,

    access: {
        create: ({ req }) => {
            return !req.user
        },
        read: () => { return true },
        update: ({ req, id }) => {
            if (req.user?.role === 'super-admin') return true
            if (req.user?.role === 'admin') return true
            if (req.user && req.user.id === id) return true

            return false
        },
        delete: ({ req, id }) => {
            if (req.user?.role === 'super-admin') return true
            if (req.user?.role === 'admin') return true
            if (req.user && req.user.id === id) return true

            return false
        },
    },

    fields: [
        {
            name: 'role',
            type: 'select',
            required: true,
            defaultValue: 'customer',
            options: [
                { label: 'Customer', value: 'customer' },
            ],
        },
        {
            name: "gender",
            type: "select",
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
            ],
        },
        {
            name: "phone",
            type: "text",
        },
        {
            name: "name",
            type: "text",
        },
        {
            name: "profileImage",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "address",
            type: "group",
            fields: [
                {
                    name: "street",
                    type: "text",
                },
                {
                    name: "apartment",
                    type: "text",
                },
                {
                    name: "city",
                    type: "text",
                },
                {
                    name: "state",
                    type: "text",
                },
                {
                    name: "country",
                    type: "text",
                },
            ],
        }

    ],
}
