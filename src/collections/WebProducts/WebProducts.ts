import {
    MetaDescriptionField,
    MetaImageField,
    MetaTitleField,
    OverviewField,
    PreviewField,
} from '@payloadcms/plugin-seo/fields';
import { type CollectionConfig } from "payload";

export const WebProducts: CollectionConfig = {
    slug: 'web-products',
    admin: {
        useAsTitle: 'name',
        group: 'Store',
        defaultColumns: ['name', 'regularPrice', 'salePrice', 'inStock', 'stock', 'slug']
    },
    versions: {
        drafts: {
            autosave: {
                interval: 1000,
            },
        },
        maxPerDoc: 50,
    },
    access: {
        read: () => true,
        update: () => true,
        create: () => true,
        delete: () => true,
    },

    fields: [
        {
            name: 'name',
            label: 'Product Name',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'Enter Product Name',
            }
        },
        {
            name: 'tagline',
            label: 'Tagline',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'Enter Tagline',
            }
        },
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Pricing and Stock',
                    fields: [
                        {
                            name: 'hasVariantOptions',
                            label: 'Has Variant Options',
                            type: 'checkbox',
                            defaultValue: false,
                        },
                        {
                            name: 'variants',
                            label: 'Variant Options',
                            type: 'array',
                            required: true,
                            admin: {
                                // Uses top-level data to hide/show the entire array
                                condition: (data) => Boolean(data?.hasVariantOptions),
                            },
                            fields: [
                                {
                                    name: 'variantName',
                                    label: 'Variant Name',
                                    type: 'text',
                                    required: true,
                                },
                                {
                                    name: 'variantImage',
                                    label: 'Variant Image',
                                    type: 'upload',
                                    relationTo: 'media',
                                    required: true,
                                    filterOptions: { mimeType: { contains: 'image' } },
                                },
                                {
                                    name: 'hasVariantSub',
                                    label: 'Has Subscription',
                                    type: 'checkbox',
                                    defaultValue: false,
                                },
                                { name: 'subscriptionDiscount', label: 'Subscription Discount', type: 'number', required: true, admin: { condition: (_, siblingData) => Boolean(siblingData?.hasVariantSub) } },
                                {
                                    name: 'subFreq',
                                    label: 'Repeat Every',
                                    type: 'array',
                                    admin: {
                                        // Uses siblingData to check checkbox in the same array row
                                        condition: (_, siblingData) => Boolean(siblingData?.hasVariantSub),
                                    },
                                    fields: [
                                        {
                                            type: 'row',
                                            fields: [
                                                { name: 'duration', label: 'Every', type: 'number', required: true, admin: { width: '50%' } },
                                                {
                                                    name: 'interval',
                                                    label: 'Interval',
                                                    type: 'select',
                                                    defaultValue: 'month',
                                                    options: [
                                                        { label: 'Year', value: 'year' },
                                                        { label: 'Month', value: 'month' },
                                                        { label: 'Week', value: 'week' },
                                                        { label: 'Day', value: 'day' },
                                                    ],
                                                    admin: { width: '50%' }
                                                },
                                            ]
                                        },
                                    ],
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'variantRegularPrice', label: 'Regular Price', type: 'number', required: true, admin: { width: '50%' } },
                                        { name: 'variantSalePrice', label: 'Sale Price', type: 'number', admin: { width: '50%' } },
                                    ]
                                },
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'variantInStock', label: 'In Stock', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
                                        {
                                            name: 'variantStockQuantity',
                                            label: 'Stock Quantity',
                                            type: 'number',
                                            required: true,
                                            admin: {
                                                width: '50%',
                                                // Check siblingData for the checkbox right above it
                                                condition: (_, siblingData) => Boolean(siblingData?.variantInStock)
                                            }
                                        },
                                    ]
                                }
                            ],
                        },
                        // --- Global Pricing (If NOT Variants) ---
                        {
                            type: 'row',
                            admin: { condition: (data) => !data?.hasVariantOptions },
                            fields: [
                                { name: 'regularPrice', label: 'Regular Price', type: 'number', required: true, admin: { width: '50%' } },
                                { name: 'salePrice', label: 'Sale Price', type: 'number', admin: { width: '50%' } },
                            ]
                        },
                        {
                            type: 'row',
                            admin: { condition: (data) => !data?.hasVariantOptions },
                            fields: [
                                { name: 'inStock', label: 'In Stock', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
                                {
                                    name: 'stockQuantity',
                                    label: 'Stock Quantity',
                                    type: 'number',
                                    required: true,
                                    admin: {
                                        width: '50%',
                                        condition: (data) => Boolean(data?.inStock)
                                    }
                                },
                            ]
                        },
                        {
                            name: 'hasSimpleSub',
                            label: 'Has Subscription',
                            type: 'checkbox',
                            defaultValue: false,
                            admin: {
                                condition: (data) => !data?.hasVariantOptions,
                            }
                        },
                        { name: 'subscriptionDiscount', label: 'Subscription Discount', type: 'number', required: true, admin: { condition: (_, siblingData) => Boolean(siblingData?.hasSimpleSub) } },
                        {
                            name: 'subFreq',
                            label: 'Repeat Every',
                            type: 'array',
                            admin: {
                                condition: (data) => Boolean(data?.hasSimpleSub) && !data?.hasVariantOptions,
                                description: "Add subscription frequency",
                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'duration', label: 'Every', type: 'number', required: true, admin: { width: '50%' } },
                                        {
                                            name: 'interval',
                                            label: 'Interval',
                                            type: 'select',
                                            defaultValue: 'month',
                                            options: [
                                                { label: 'Year', value: 'year' },
                                                { label: 'Month', value: 'month' },
                                                { label: 'Week', value: 'week' },
                                                { label: 'Day', value: 'day' },
                                            ],
                                            admin: { width: '50%' }
                                        },
                                    ]
                                },
                            ],
                        },
                    ],
                },
                {
                    label: 'Product Details',
                    fields: [
                        {
                            name: 'productImage',
                            label: 'Product Image',
                            type: 'upload',
                            relationTo: 'media',
                            required: true,
                            admin: {
                                description: 'Upload product image that will be visible on Product Listing'
                            },
                            filterOptions: { mimeType: { contains: 'image' } },
                        },
                        { name: 'description', label: 'Description', type: 'richText', required: true },
                        {
                            type: 'row',
                            fields: [
                                { name: 'categories', label: 'Categories', type: 'relationship', relationTo: 'web-categories', hasMany: true, required: true, admin: { width: '50%' } },
                                {
                                    name: 'subCategories',
                                    label: 'Sub Categories',
                                    type: 'relationship',
                                    relationTo: 'web-sub-categories',
                                    hasMany: true,
                                    required: true,
                                    admin: {
                                        width: '50%',
                                        condition: (data) => Array.isArray(data?.categories) && data.categories.length > 0
                                    }
                                },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                { name: 'farm', label: 'Farm', type: 'text', required: true, admin: { width: '50%' } },
                                { name: 'tastingNotes', label: 'Tasting Notes', type: 'text', required: true, admin: { width: '50%' } },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                { name: 'variety', label: 'Variety', type: 'text', required: true, admin: { width: '33.33%' } },
                                { name: 'process', label: 'Process', type: 'text', required: true, admin: { width: '33.33%' } },
                                { name: 'altitude', label: 'Altitude', type: 'text', required: true, admin: { width: '33.33%' } },
                            ]
                        },
                        {
                            type: 'row',
                            fields: [
                                { name: 'body', label: 'Body', type: 'text', required: true, admin: { width: '33.33%' } },
                                { name: 'aroma', label: 'Aroma', type: 'text', required: true, admin: { width: '33.33%' } },
                                { name: 'roast', label: 'Roast', type: 'text', required: true, admin: { width: '33.33%' } },
                            ]
                        },
                        { name: 'finish', label: 'Finish', type: 'text', required: true },
                        { name: 'farmDescription', label: 'Farm Description', type: 'richText', required: true },
                        {
                            name: 'videoBanner',
                            label: 'Video Banner',
                            type: 'upload',
                            relationTo: 'media',
                            required: true,
                            filterOptions: { mimeType: { contains: 'video' } },
                        },
                        {
                            name: 'brewGuide',
                            label: 'Brew Guide',
                            type: 'group',
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        { name: 'filter', label: 'Filter', type: 'checkbox', admin: { width: '33.33%' } },
                                        { name: 'espresso', label: 'Espresso', type: 'checkbox', admin: { width: '33.33%' } },
                                        { name: 'milk', label: 'Milk', type: 'checkbox', admin: { width: '33.33%' } },
                                    ]
                                },
                            ],
                        }
                    ],
                },
                {
                    name: 'meta',
                    label: 'SEO',
                    fields: [
                        OverviewField({ titlePath: 'meta.title', descriptionPath: 'meta.description', imagePath: 'meta.image' }),
                        MetaTitleField({ hasGenerateFn: false }),
                        MetaImageField({ relationTo: 'media' }),
                        MetaDescriptionField({}),
                        PreviewField({ hasGenerateFn: true, titlePath: 'meta.title', descriptionPath: 'meta.description' }),
                    ],
                },
            ],
        },
        {
            name: 'slug',
            type: 'text',
            index: true,
            unique: true,
            admin: {
                position: 'sidebar',
                description: 'Auto-generated from product name. You can edit it manually.',
            },
            hooks: {
                beforeValidate: [({ value, data }) => {
                    if (value) return value; // Keep manual input
                    const name = data?.name || '';
                    if (!name) return undefined; // Let Payload handle empty case
                    const tagline = data?.tagline || '';
                    const source = tagline ? `${name} ${tagline}` : name;
                    const slug = source
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    // Add timestamp if slug is empty after sanitization
                    return slug || `product-${Date.now()}`;
                }],
            },
        }
    ]
}