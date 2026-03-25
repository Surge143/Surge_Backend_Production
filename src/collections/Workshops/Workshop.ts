import { slugField, type CollectionConfig } from 'payload'
import { validateFutureDate } from '@/utilities/validateFutureDate'

export const Workshop: CollectionConfig = {
  slug: 'workshop',
  labels: {
    singular: 'Academy',
    plural: 'Academy',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Marketing',
    description: 'Manage events and classes',
    hidden: ({ user }: any) => user?.role === 'shop-manager' || user?.role === 'barista',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Event Title',
      type: 'text',
      required: true,
    },
    {
      name: 'workshopImage',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: true,
      validate: validateFutureDate,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMMM do, yyyy',
        },
      },
    },
    {
      name: 'calendyLink',
      label: 'Calendy Link',
      type: 'text',
      required: true,
    },
    {
      name: 'eventTime',
      label: 'Event Time (7:00 PM GST)',
      type: 'date',
      required: true,
      validate: validateFutureDate,
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
          displayFormat: 'h:mm aa',
        },
      },
    },
    {
      name: 'workshopDescription',
      label: 'Workshop Description',
      type: 'text',
      required: true,
    },
    slugField({
      useAsSlug: 'title',
    }),
  ],
  timestamps: true,
}
