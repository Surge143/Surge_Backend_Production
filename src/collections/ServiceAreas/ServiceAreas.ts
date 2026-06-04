import type { CollectionConfig } from 'payload'

export const ServiceAreas: CollectionConfig = {
    slug: 'service-areas',
    orderable: true,
    admin: {
        useAsTitle: 'location',
        group: 'Events',
        description: 'Delivery locations and fees displayed on the events page.',
        hidden: ({ user }) => {
            const isAuth = user?.role === 'super-admin' || user?.role === 'admin'
            return !isAuth
        },
    },
    access: {
        read: () => true,
        create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
        delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'location',
            label: 'Location',
            type: 'text',
            required: true,
        },
        {
            name: 'fee',
            label: 'Delivery Fee (AED)',
            type: 'number',
            required: true,
            defaultValue: 0,
            admin: {
                description: 'Enter 0 for free delivery.',
            },
        },
    ],
    timestamps: true
}
