import type { CollectionConfig } from 'payload'

export const CustomizationTemplate: CollectionConfig = {
    slug: 'customization-template',
    admin: {
        useAsTitle: 'title',
        group: 'App',
    },
    fields: [
        // Internal name
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Template Name',
        },

        // SECTIONS
        {
            name: 'sections',
            type: 'array',
            label: 'Customization Sections',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                    label: 'Section Title',
                },

                // single or multiple selection
                {
                    name: 'selectionType',
                    type: 'radio',
                    required: true,
                    options: [
                        { label: 'Single (Radio)', value: 'single' },
                        { label: 'Multiple (Checkbox)', value: 'multiple' },
                    ],
                },

                // OPTIONAL GROUPING (Milk / Non-Dairy)
                {
                    name: 'groups',
                    type: 'array',
                    label: 'Option Groups',
                    fields: [
                        {
                            name: 'groupTitle',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'options',
                            type: 'array',
                            fields: [
                                {
                                    name: 'label',
                                    type: 'text',
                                    required: true,
                                },
                                {
                                    name: 'price',
                                    type: 'number',
                                    defaultValue: 0,
                                },
                            ],
                        },
                    ],
                },

                // OPTIONS (used when no groups)
                {
                    name: 'options',
                    type: 'array',
                    label: 'Options',
                    admin: {
                        condition: (_, siblingData) => !siblingData.groups?.length,
                    },
                    fields: [
                        {
                            name: 'label',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'price',
                            type: 'number',
                            defaultValue: 0,
                        },
                    ],
                },
            ],
        },
    ],
}
