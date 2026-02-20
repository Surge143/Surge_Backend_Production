import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',

    auth: true,

    access: {
        create: ({ req, id }) => {
            if (req.user?.role === 'super-admin') return true
            if (req.user?.role === 'admin') return true
            if (req.user && req.user.id === id) return true

            return false
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
            admin: {
                hidden: true,
            }
        },
        {
            name: "gender",
            label: 'Gender',
            type: "select",
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
            ],
        },
        {
            name: "phone",
            label: 'Phone Number',
            type: "text",
        },
        {
            name: "firstName",
            label: "First Name",
            type: "text",
        },
        {
            name: "lastName",
            label: "Last Name",
            type: "text",
        },
        {
            name: "profileImage",
            label: "Profile Image",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "addresses",
            label: 'Addresses',
            type: "array",
            admin: {
                initCollapsed: true, // Optional: keeps the UI tidy
            },
            minRows: 0,
            maxRows: 5, // This limits the array to a maximum of 5 items
            fields: [
                {
                    name: 'label',
                    label: "Label",
                    type: 'text',
                },
                {
                    name: 'addressFirstName',
                    label: 'First Name',
                    type: 'text',
                },
                {
                    name: 'addressLastName',
                    label: 'Last Name',
                    type: 'text',
                },
                {
                    name: "street",
                    label: "Street",
                    type: "text",
                },
                {
                    name: "apartment",
                    label: "Apartment",
                    type: "text",
                },
                {
                    name: "city",
                    label: "City",
                    type: "text",
                },
                {
                    name: "emirates",
                    label: "Emirates",
                    type: "select",
                    required: true,
                    options: [
                        { label: 'Abu Dhabi', value: 'abu_dhabi' },
                        { label: 'Dubai', value: 'dubai' },
                        { label: 'Sharjah', value: 'sharjah' },
                        { label: 'Ajman', value: 'ajman' },
                        { label: 'Umm Al Quwain', value: 'umm_al_quwain' },
                        { label: 'Ras Al Khaimah', value: 'ras_al_khaimah' },
                        { label: 'Fujairah', value: 'fujairah' },
                    ],
                },
                {
                    name: "country",
                    label: "Country",
                    type: "text",
                    defaultValue: "United Arab Emirates",
                    admin: {
                        readOnly: true,
                    }
                },
                {
                    name: 'phoneNumber',
                    label: "Phone Number",
                    type: "text",
                },
            ],
        }
    ],
    lockDocuments: false,   
}
