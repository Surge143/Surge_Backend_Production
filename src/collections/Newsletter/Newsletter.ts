import { CollectionConfig } from 'payload'

export const Newsletter: CollectionConfig = {
  slug: 'newsletters',
  admin: {
    useAsTitle: 'email',
    group: 'Marketing',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
  ],
}
