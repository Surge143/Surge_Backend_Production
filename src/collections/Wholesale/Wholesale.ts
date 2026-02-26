import type { CollectionConfig } from 'payload'

export const Wholesale: CollectionConfig = {
    slug: 'wholesale',
    admin: {
        useAsTitle: 'company',
        group: 'Marketing',
    },
    access: {
        read: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        update: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        delete: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        create: () => true,
    },
    fields: [
        {
            name: 'email',
            type: 'email',
            required: true,
        },
        {
            name: 'phone',
            type: 'text',
            required: true,
        },
        {
            name: 'company',
            type: 'text',
            required: true,
        },
        {
            name: 'companyAddress',
            type: 'text',
            required: true,
        },
        {
            name: 'branch',
            type: 'text',
        },
        {
            name: 'websiteInstagram',
            type: 'text',
        },
        {
            name: 'business_info_group',
            type: 'group',
            label: 'Which category best describes your business? Select all which apply',
            validate: (value: any) => {
                if (!value) return 'Please select at least one category';
                const hasSelection = value.office || value.bakery || value.coffee_shop || value.restaurant || value.other;
                return hasSelection ? true : 'Please select at least one category';
            },
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'office', type: 'checkbox', label: 'Office', admin: { width: '50%' } },
                        { name: 'bakery', type: 'checkbox', label: 'Bakery', admin: { width: '50%' } },
                    ]
                },
                {
                    type: 'row',
                    fields: [
                        { name: 'coffee_shop', type: 'checkbox', label: 'Coffee Shop', admin: { width: '50%' } },
                        { name: 'restaurant', type: 'checkbox', label: 'Restaurant', admin: { width: '50%' } },
                    ]
                },
                {
                    name: 'other',
                    type: 'checkbox',
                    label: 'Other (Specify below)',
                },
                {
                    name: 'other_specification',
                    type: 'text',
                    label: 'Please specify',
                    admin: {
                        condition: (data) => Boolean(data?.other),
                    },
                },
            ],
        },
        {
            name: 'message',
            type: 'textarea',
            required: true,
        },
    ],
    timestamps: true,
}
