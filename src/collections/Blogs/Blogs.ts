import { CollectionConfig, slugField } from 'payload'
import {
    lexicalEditor,
    HTMLConverterFeature,
    UploadFeature,
    FixedToolbarFeature,
    InlineToolbarFeature,
    AlignFeature,
    RelationshipFeature,
} from '@payloadcms/richtext-lexical'

export const Blogs: CollectionConfig = {
    slug: 'blogs',
    admin: {
        useAsTitle: 'title',
        group: 'Marketing',
    },
    access: {
        read: () => true,
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
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'featuredImage',
            label: 'Main Featured Image',
            type: 'upload',
            relationTo: 'media',
            required: true,
        },
        {
            name: 'readTime',
            label: 'Read Time (minutes)',
            min:0,
            type: 'number',
        },
        {
            name: 'content',
            type: 'richText',
            editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                    ...defaultFeatures.filter((feature) => feature.key !== RelationshipFeature({}).key),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    AlignFeature(),
                    HTMLConverterFeature({}),
                    UploadFeature({
                        collections: {
                            media: {
                                fields: [
                                    {
                                        name: 'caption',
                                        type: 'text',
                                    },
                                ],
                            },
                        },
                    }),
                ],
            }),
        },
        slugField({
            useAsSlug: 'title',
        })
    ],
    timestamps: true,
}