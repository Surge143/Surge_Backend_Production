import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'fullName',
    group: 'Marketing',
    description: 'Bookings received for Surge events',
    defaultColumns: ['fullName', 'email', 'eventDate', 'eventType', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'super-admin'
    },
    create: () => true, // Publicly accessible via frontend form
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phoneNumber',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'eventDate',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'd MMM yyyy',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'timeWindow',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'expectedGuests',
          type: 'number',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eventType',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'package',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'addons',
          type: 'text',
          label: 'Add-ons',
          admin: { width: '50%' },
        },
        {
          name: 'location',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'message',
      label: 'Tell us about your event',
      type: 'textarea',
      required: true,
    },
  ],
  timestamps: true,
}
