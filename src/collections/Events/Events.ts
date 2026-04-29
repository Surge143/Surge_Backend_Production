import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'firstName',
    group: 'Marketing',
    description: 'Bookings received for Surge events',
    defaultColumns: ['firstName', 'lastName', 'email', 'eventDate', 'eventType', 'createdAt'],
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
          name: 'firstName',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'lastName',
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
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'phoneNumber',
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
        {
          name: 'timeWindow',
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
          name: 'expectedGuests',
          type: 'number',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'eventType',
          type: 'select',
          required: true,
          options: [
            { label: 'Private Event', value: 'private' },
            { label: 'Corporate Event', value: 'corporate' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'package',
          type: 'select',
          required: true,
          options: [
            { label: '30 Cups', value: '30-cups' },
            { label: '50 Cups', value: '50-cups' },
            { label: '100 Cups', value: '100-cups' },
            { label: 'Additional Cups', value: 'additional-cups' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'addons',
          type: 'text',
          label: 'Add-ons',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'emirate',
          type: 'select',
          required: true,
          options: [
            { label: 'Dubai', value: 'dubai' },
            { label: 'Sharjah', value: 'sharjah' },
            { label: 'Ras Al Khaimah', value: 'ras-al-khaimah' },
            { label: 'Ajman', value: 'ajman' },
            { label: 'Abu Dhabi', value: 'abu-dhabi' },
          ],
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
