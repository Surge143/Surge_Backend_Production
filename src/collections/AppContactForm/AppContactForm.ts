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
    // read was previously open to anyone (even unauthenticated) — these rows
    // carry customer name/email/phone from the app's "Need Help" form, so
    // read is now staff-only. create stays open — this is the actual
    // public-facing submission channel the app posts to. delete was
    // hardcoded false (no role could ever delete a row, including
    // super-admin) — now admin/super-admin can, matching how the Events
    // collection already lets super-admin delete submissions.
    read: ({ req: { user } }) =>
      !!user && (user.role === 'super-admin' || user.role === 'admin' || user.role === 'shop-manager'),
    create: () => true,
    update: () => false,
    delete: ({ req: { user } }) => !!user && (user.role === 'super-admin' || user.role === 'admin'),
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
