import { CollectionConfig, slugField } from 'payload';

export const ShopMenu: CollectionConfig = {
    slug: 'shop-menu',
    labels: {
        singular: 'Menu',
        plural: 'Menu',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'shop', 'updatedAt'],
        components: {
            beforeListTable: ['@/collections/ShopMenu/components/ShopMenuQuickCreate#ShopMenuQuickCreate'],
        },
        group: 'Cafe',
    },
    access: {
        read: async ({ req: { user, payload } }) => {
            if (!user) return false;
            if (user.role === 'admin' || user.role === 'super-admin') return true;
            if (user.role === 'shop-manager') {
                const managedShop = await payload.find({
                    collection: 'shop',
                    where: { shopManager: { equals: user.id } },
                    limit: 1,
                    depth: 0,
                });
                if (managedShop.docs.length > 0) {
                    return { shop: { equals: managedShop.docs[0].id } };
                }
                return false;
            }
            return false;
        },
        create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
        delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager',
    },
    hooks: {
        beforeChange: [
            async ({ data, req: { user, payload }, operation }) => {
                if (operation === 'create' && user) {
                    data.createdBy = user.id;
                }

                // If shop-manager is creating, force the shop to be their managed shop
                if (user?.role === 'shop-manager' && operation === 'create') {
                    const managedShop = await payload.find({
                        collection: 'shop',
                        where: {
                            shopManager: { equals: user.id }
                        },
                        limit: 1,
                    });

                    if (managedShop.docs.length > 0) {
                        data.shop = managedShop.docs[0].id;
                    } else {
                        throw new Error('You do not have a shop assigned to your account.');
                    }
                }
                return data;
            },
        ],
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'Enter Food Item Name',
            }
        },
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shop',
            required: true,
            admin: {
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
                position: 'sidebar',
                readOnly: true,
            },
        },
        {
            name: 'menuRelation',
            type: 'relationship',
            relationTo: 'menu',
            hasMany: true,
            admin: {
                position: 'sidebar',
                readOnly: true,
                hidden: true,
            },
        },
        {
            name: 'createdBy',
            type: 'relationship',
            relationTo: 'admins',
            admin: {
                condition: (data, siblingData, { user }) => user?.role !== 'shop-manager',
                position: 'sidebar',
                readOnly: true,
                hidden: true,
            },
        },
        {
            name: 'tagline',
            type: 'text',
            required: false,
            admin: {
                placeholder: 'Enter Food Item Tagline',
                description: 'Keep it between 5 and 50 characters.',
            },
            minLength: 5,
            maxLength: 50,
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Upload Food Item Image',
            },
        },
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [
                        {
                            name: 'description',
                            type: 'textarea',
                            required: false,
                            admin: {
                                placeholder: 'Enter Food Item Description'
                            }
                        },
                        {
                            name: 'category',
                            type: 'relationship',
                            relationTo: 'app-categories',
                            required: true,
                        },
                        {
                            name: 'subCategories',
                            type: 'relationship',
                            relationTo: 'app-sub-categories',
                            hasMany: true,
                            required: true,
                            validate: (val) => {
                                if (!val || (Array.isArray(val) && val.length === 0)) {
                                    return 'At least one sub-category is mandatory.';
                                }
                                return true;
                            },
                            admin: {
                                condition: (data) => Boolean(data?.category),
                            },
                            filterOptions: ({ data }) => {
                                if (data?.category) {
                                    return {
                                        parentCategory: { equals: data.category },
                                    };
                                }
                                return false;
                            },
                        },
                        {
                            name: 'regularPrice',
                            type: 'number',
                            required: true,
                            admin: {
                                placeholder: 'Enter Food Item Price'
                            }
                        },
                        {
                            name: 'salePrice',
                            type: 'number',
                            admin: {
                                placeholder: 'Enter Food Item Sale Price'
                            }
                        },
                        {
                            name: 'dietaryType',
                            type: 'select',
                            options: [
                                { label: 'Veg', value: 'veg' },
                                { label: 'Non-Veg', value: 'non-veg' },
                                { label: 'Vegan', value: 'vegan' },
                            ],
                            admin: {
                                placeholder: 'Select Food Item Dietary Type',
                                description: 'Select dietary type of the food item',
                            }
                        }
                    ],
                    label: 'Food Item Details',
                },
                {
                    fields: [
                        {
                            name: 'stockCount',
                            type: 'number',
                            label: 'Stock Quantity',
                            admin: {
                                placeholder: 'Enter Stock Quantity'
                            }
                        },
                        {
                            name: 'inStock',
                            type: 'checkbox',
                            defaultValue: false,
                            admin: {
                                description: 'Check if the item is in stock'
                            }
                        },
                    ],
                    label: 'Stock Management'
                },
                {
                    fields: [
                        {
                            name: 'customizations',
                            type: 'array',
                            label: 'Customization Panels',
                            minRows: 0,
                            maxRows: 1,
                            admin: {
                                components: {
                                    RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                                },
                            },
                            fields: [
                                {
                                    name: 'title',
                                    type: 'text',
                                    admin: {
                                        hidden: true,
                                    },
                                },
                                {
                                    name: 'template',
                                    type: 'relationship',
                                    relationTo: 'customization-template',
                                    admin: {
                                        readOnly: true,
                                    }
                                },
                                {
                                    name: 'sections',
                                    type: 'array',
                                    label: 'Sections',
                                    admin: {
                                        components: {
                                            RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                                        },
                                    },
                                    fields: [
                                        {
                                            name: 'title',
                                            type: 'text',
                                            required: true,
                                            admin: { readOnly: true },
                                        },
                                        {
                                            name: 'selectionType',
                                            type: 'radio',
                                            options: [
                                                { label: 'Single', value: 'single' },
                                                { label: 'Multiple', value: 'multiple' },
                                            ],
                                            admin: { readOnly: true },
                                        },
                                        {
                                            name: 'groups',
                                            type: 'array',
                                            label: 'Option Groups',
                                            admin: {
                                                components: {
                                                    RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                                                },
                                                readOnly: true,
                                            },
                                            fields: [
                                                {
                                                    name: 'groupTitle',
                                                    type: 'text',
                                                    required: true,
                                                    admin: { readOnly: true },
                                                },
                                                {
                                                    name: 'options',
                                                    type: 'array',
                                                    admin: { readOnly: true },
                                                    fields: [
                                                        {
                                                            name: 'label',
                                                            type: 'text',
                                                            required: true,
                                                            admin: { readOnly: true },
                                                        },
                                                        {
                                                            name: 'price',
                                                            type: 'number',
                                                            defaultValue: 0,
                                                            admin: { readOnly: true },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            name: 'options',
                                            type: 'array',
                                            admin: {
                                                condition: (_, siblingData) => !siblingData.groups?.length,
                                                components: {
                                                    RowLabel: '@/collections/AppCategories/components/SectionRowLabel#SectionRowLabel',
                                                },
                                                readOnly: true,
                                            },
                                            fields: [
                                                {
                                                    name: 'label',
                                                    type: 'text',
                                                    required: true,
                                                    admin: { readOnly: true },
                                                },
                                                {
                                                    name: 'price',
                                                    type: 'number',
                                                    defaultValue: 0,
                                                    admin: { readOnly: true },
                                                },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    label: 'Customization Panel'
                }
            ]
        },
        slugField({
            useAsSlug: 'name',
        })
    ],
}
