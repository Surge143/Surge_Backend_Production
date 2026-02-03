import { CollectionConfig, slugField } from 'payload';

export const Menu: CollectionConfig = {
    slug: 'menu',
    admin: {
        useAsTitle: 'name',
        group: 'App',
    },
    access: {
        read: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'shop-manager';
        },
        update: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        delete: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
        create: ({ req: { user } }) => {
            return user?.role === 'admin' || user?.role === 'super-admin';
        },
    },
    hooks: {
        afterChange: [
            async ({ doc, req, operation }) => {
                const { payload } = req;
                if (operation === 'update') {
                    // Update all related shop menu items
                    const shopMenuItems = await payload.find({
                        collection: 'shop-menu',
                        where: {
                            menuRelation: {
                                contains: doc.id,
                            },
                        },
                        depth: 0,
                        req,
                        overrideAccess: true,
                    });

                    if (shopMenuItems.docs.length > 0) {
                        // Batch updates to avoid sequential waiting, but with depth: 0 and overrideAccess
                        await Promise.all(
                            shopMenuItems.docs.map((item) =>
                                payload.update({
                                    collection: 'shop-menu',
                                    id: item.id,
                                    data: {
                                        name: doc.name,
                                        tagline: doc.tagline,
                                        image: typeof doc.image === 'object' ? doc.image.id : doc.image,
                                        description: doc.description,
                                        category: typeof doc.category === 'object' ? doc.category.id : doc.category,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        subCategories: doc.subCategories?.map((s: any) => (typeof s === 'object' ? s.id : s)),
                                        slug: doc.slug,
                                        dietaryType: doc.dietaryType,
                                        customizations: doc.customizations,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } as any,
                                    req,
                                    depth: 0,
                                    overrideAccess: true,
                                })
                            )
                        );
                    }
                }
                return doc;
            },
        ],
        beforeChange: [
            async ({ data, req, operation }) => {
                // If it's a new upload and no folder is selected yet
                if (operation === 'create' && !data.folder) {
                    // You can find your folder ID in the Admin URL when viewing the folder
                    // or query for it:
                    const productFolder = await req.payload.find({
                        collection: 'payload-folders',
                        where: { name: { equals: 'products' } },
                    })

                    if (productFolder.docs.length > 0) {
                        data.folder = productFolder.docs[0].id
                    }
                }
                return data
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
            name: 'tagline',
            type: 'text',
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
                            admin: {
                                position: 'sidebar',
                            },
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
                                position: 'sidebar',
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
                            name: 'customizations',
                            type: 'json',
                            label: 'Customizations',
                            admin: {
                                components: {
                                    Field: '@/collections/Menu/components/CustomizationsManager#CustomizationsManager',
                                }
                            }
                        }
                    ],
                    label: 'Customization Panel'
                }
            ]
        },
        slugField({ fieldToUse: 'name' }),
    ],
}
