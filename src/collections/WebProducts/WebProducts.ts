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
                                                { name: 'duration', label: 'Every', type: 'number', min: 0, required: true, admin: { width: '50%' } },
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
                                        { name: 'variantRegularPrice', label: 'Regular Price', min: 0, type: 'number', required: true, admin: { width: '50%' } },
                                        {
                                            name: 'variantSalePrice',
                                            label: 'Sale Price',
                                            type: 'number',
                                            min: 0,
                                            admin: { width: '50%' },
                                            validate: (val, { siblingData }) => {
                                                // 1. If no sale price is entered, it's valid (assuming it's not required)
                                                if (!val) return true;

                                                // 2. Compare against Regular Price
                                                const regularPrice = siblingData?.variantRegularPrice;

                                                if (regularPrice && Number(val) >= Number(regularPrice)) {
                                                    return 'The Sale Price must be less than the Regular Price.';
                                                }

                                                return true;
                                            },
                                        },
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
                        { name: 'description', label: 'Description', type: 'textarea', required: true },

                        { name: 'categories', label: 'Categories', type: 'relationship', relationTo: 'web-categories', hasMany: false, required: true, admin: { description: 'Select category', position: 'sidebar' } },
                        {
                            name: 'subCategories',
                            label: 'Sub Categories',
                            type: 'json',
                            required: true,
                            admin: {
                                condition: (data) => !!data?.categories,
                                components: {
                                    Field: '@/collections/WebProducts/components/NestedSubCategorySelection#NestedSubCategorySelection'
                                },
                                position: 'sidebar',
                            }
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
            name: "slug",
            type: "text",
            required: true,
            unique: true,
            index: true,
            admin: {
                components: {
                    Field: "@/collections/components/slugField/customSlugField#SlugField",
                },
                position: 'sidebar',
            },
            hooks: {
                beforeValidate: [
                    ({ data, value }) => {
                        if (data?.name) {
                            return data.name
                                .toLowerCase()
                                .trim()
                                .replace(/\s+/g, "-")
                                .replace(/[^\w-]+/g, "");
                        }
                        return value;
                    },
                ],
            },
        },
    ]
}