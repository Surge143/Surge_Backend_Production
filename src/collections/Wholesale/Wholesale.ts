import type { CollectionConfig } from 'payload'

export const Wholesale: CollectionConfig = {
  slug: 'wholesale',
  admin: {
    useAsTitle: 'company',
    group: 'Marketing',
    description: 'Handle B2B and bulk orders',
    defaultColumns: ['company', 'email', 'createdAt'],
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
    },
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
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'phone',
          type: 'text',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'company',
          type: 'text',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'branch',
          type: 'text',
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'companyAddress',
          type: 'text',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'websiteInstagram',
          type: 'text',
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      name: 'business_info_group',
      type: 'group',
      label: 'Business Category',
      admin: {
        readOnly: true,
        description: 'Categories selected by the business during submission.',
      },
      validate: (value: any) => {
        if (!value) return 'Please select at least one category'
        const hasSelection =
          value.office || value.bakery || value.coffee_shop || value.restaurant || value.other
        return hasSelection ? true : 'Please select at least one category'
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'office', type: 'checkbox', label: 'Office', admin: { width: '50%' } },
            { name: 'bakery', type: 'checkbox', label: 'Bakery', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'coffee_shop',
              type: 'checkbox',
              label: 'Coffee Shop',
              admin: { width: '50%' },
            },
            { name: 'restaurant', type: 'checkbox', label: 'Restaurant', admin: { width: '50%' } },
          ],
        },
        {
          name: 'other',
          type: 'checkbox',
          label: 'Other (Specify below)',
        },
        {
          name: 'other_specification',
          type: 'text',
          label: 'Please specify',
          admin: {
            condition: (data) => Boolean(data?.other),
          },
        },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
