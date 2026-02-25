import type { CollectionConfig } from 'payload'
import { syncTemplates } from './hooks/syncTemplates'

export const CustomizationTemplate: CollectionConfig = {
    slug: 'customization-template',
    admin: {
        useAsTitle: 'title',
        group: 'Cafe',
    },
    hooks: {
        afterChange: [syncTemplates],
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
            admin: {
                components: {
                    RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                },
                description: 'Add sections for customization',
            },
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
                    admin: {
                        components: {
                            RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                        },
                    },
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
                        components: {
                            RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                        },
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
