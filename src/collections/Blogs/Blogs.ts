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
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { calculateReadTime } from '@/utilities/calculateReadTime'
import { validateFutureDate } from '@/utilities/validateFutureDate'

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
    group: 'Marketing',
    description: 'Publish articles and announcements',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
      },
    },
    maxPerDoc: 50,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.content) {
          data.readTime = calculateReadTime(data.content)
        }
        return data
      },
    ],
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Blog Content',
          fields: [
            {
              name: 'title',
              label: 'Article Title',
              type: 'text',
              required: true,
              admin: {
                placeholder: 'e.g., Behind the Roast: The Art of Sourcing Coffee',
              },
            },
            {
              name: 'shortDescription',
              label: 'Short Description',
              type: 'text',
              required: true,
            },
            {
              name: 'featuredImage',
              label: 'Featured Hero Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description:
                  'This image appears at the top of the blog and in social share previews.',
              },
            },
            {
              name: 'content',
              label: 'Body Content',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures.filter(
                    (feature) => feature.key !== RelationshipFeature({}).key,
                  ),
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
                            label: 'Image Caption',
                            type: 'text',
                            admin: {
                              placeholder: 'Add a brief description of this image...',
                            },
                          },
                        ],
                      },
                    },
                  }),
                ],
              }),
            },
            {
              name: 'relatedBlogs',
              label: 'Related Blogs',
              type: 'relationship',
              relationTo: 'blogs',
              hasMany: true,
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_equals: id,
                  },
                }
              },
              admin: {
                description: 'Select up to 3 other blogs to recommend to readers.',
              },
              validate: (val) => {
                if (Array.isArray(val) && val.length > 3) {
                  return 'You can only select up to 3 related blogs.'
                }
                return true
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO & Social',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: false }),
            MetaImageField({ relationTo: 'media' }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'scheduledFor',
      label: 'Publication Schedule',
      type: 'date',
      validate: validateFutureDate,
      admin: {
        position: 'sidebar',
        description: 'Set a future date to automate when this post goes live on the website.',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy HH:mm',
        },
      },
    },
    {
      name: 'readTime',
      label: 'Reading Time',
      type: 'number',
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Estimated minutes to read. Auto-calculated from content word count.',
        placeholder: 'Calculated on save...',
      },
    },
    {
      name: 'isFeatured',
      label: 'Is Featured',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description: 'Mark this blog as featured.',
      },
    },
    slugField({
      useAsSlug: 'title',
    }),
    {
      name: 'lastUpdatedBy',
      label: 'Last Edited By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who last updated this blog.',
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            if (req.user && req.user.collection === 'admins') {
              return req.user.email
            }
            return value
          },
        ],
      },
    },
    {
      name: 'createdBy',
      label: 'Created By',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The email of the admin who created this blog.',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user && req.user.collection === 'admins') {
              return req.user.email
            }
            return value
          },
        ],
      },
    },
  ],
  timestamps: true,
}
