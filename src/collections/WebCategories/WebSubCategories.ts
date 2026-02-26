import { type CollectionConfig } from 'payload'

const formatSlug = (val: string): string =>
    val
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '')
        .toLowerCase()

export const WebSubCategories: CollectionConfig = {
    slug: 'web-sub-categories',
    labels:{
        singular: 'Store Sub-Category',
        plural: 'Store Sub-Categories'
    },
    admin: {
        group: 'Store',
        defaultColumns: ['slug', 'parentCategory'],
    },
    fields: [
        {
            name: 'parentCategory',
            type: 'relationship',
            relationTo: 'web-categories',
            required: true,
            admin: {
                position: 'sidebar'
            }
        },
        {
            name: 'level1',
            type: 'array',
            fields: [
                { name: 'name', type: 'text', required: true },
                {
                    name: 'slug',
                    type: 'text',
                    unique:true,
                    admin: {
                        description: 'Auto-generated from name'
                    },
                    hooks: {
                        beforeValidate: [
                            ({ value, siblingData }) => {
                                if (value) return value;
                                return siblingData?.name ? formatSlug(siblingData.name) : value;
                            }
                        ]
                    }
                },
                {
                    name: 'level2',
                    type: 'array',
                    admin: { condition: (_, siblingData) => !!siblingData?.name },
                    fields: [
                        { name: 'name', type: 'text', required: true },
                        {
                            name: 'slug',
                            type: 'text',
                            unique:true,
                            admin: {
                                description: 'Auto-generated from name'
                            },
                            hooks: {
                                beforeValidate: [
                                    ({ value, siblingData }) => {
                                        if (value) return value;
                                        return siblingData?.name ? formatSlug(siblingData.name) : value;
                                    }
                                ]
                            }
                        },
                        {
                            name: 'level3',
                            type: 'array',
                            admin: { condition: (_, siblingData) => !!siblingData?.name },
                            fields: [
                                { name: 'name', type: 'text', required: true },
                                {
                                    name: 'slug',
                                    type: 'text',
                                    unique:true,
                                    admin: {
                                        description: 'Auto-generated from name'
                                    },
                                    hooks: {
                                        beforeValidate: [
                                            ({ value, siblingData }) => {
                                                if (value) return value;
                                                return siblingData?.name ? formatSlug(siblingData.name) : value;
                                            }
                                        ]
                                    }
                                },
                            ]
                        }
                    ]
                }
            ]
        },
    ],
}