import { slugField, type CollectionConfig } from 'payload'

export const Workshop: CollectionConfig = {
    slug: 'workshop',
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
            admin: {
                date: {
                    pickerAppearance: 'timeOnly',
                    displayFormat: 'h:mm aa',
                },
            },
        },
        slugField({
            useAsSlug: 'title',
        })
    ],
    timestamps: true,
}