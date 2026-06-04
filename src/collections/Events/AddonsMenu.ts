import type { CollectionConfig } from 'payload'

export const AddonsMenu: CollectionConfig = {
  slug: 'addons-menu',
  orderable: true,
  admin: {
    useAsTitle: 'title',
    group: 'Events',
    description: 'Add-on menu categories displayed on the events page.',
    hidden: ({ user }) => {
      const isAuthorized = user?.role === 'super-admin' || user?.role === 'admin'
      return !isAuthorized
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
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. "Coffee"',
      },
    },
    {
      name: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. "Small Bites / Canapés"',
      },
    },
    {
      name: 'tagline',
      label: 'Tagline',
      type: 'textarea',
      required: true,
      admin: {
        description: 'e.g. "Savoury selections crafted for elevated, memorable catering moments."',
      },
    },
    {
      name: 'items',
      label: 'Menu Items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Item',
        plural: 'Items',
      },
      fields: [
        {
          name: 'name',
          label: 'Item Name',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. "Bruschetta Bites", "Tuna Crostini"',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
