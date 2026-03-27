import type { CollectionConfig } from 'payload'

export const AppContactForm: CollectionConfig = {
  slug: 'app-contact-form',
  labels: {
    singular: 'App Contact Submission',
    plural: 'Contact Submissions (App)',
  },
  admin: {
    defaultColumns: ['user', 'fullName', 'email', 'phone', 'inquiryType', 'message', 'createdAt'],
    group: 'Marketing',
    description: 'Messages received from the app',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'inquiryType',
      type: 'select',
      label: 'Inquiry Type',
      required: true,
      options: [
        { label: 'Order issue', value: 'order_issue' },
        { label: 'Payment or refund', value: 'payment_refund' },
        { label: 'Rewards & stamps', value: 'rewards_stamps' },
        { label: 'Barista selection', value: 'barista_selection' },
        { label: 'Pickup or timing', value: 'pickup_timing' },
        { label: 'Menu & availability', value: 'menu_availability' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Please select the type of inquiry for this ticket.',
        readOnly: true,
      },
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
