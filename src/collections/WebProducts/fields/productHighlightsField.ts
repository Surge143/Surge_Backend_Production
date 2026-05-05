import { type Field } from 'payload'

export const productHighlightsField: Field = {
  name: 'productHighlights',
  label: 'Key Features & Highlights',
  type: 'array',
  admin: {
    description:
      'Group specific product details (e.g., Roast Type, Flavor Notes, Origin) into sections.',
  },
  fields: [
    {
      name: 'sectionTitle',
      label: 'Section Heading',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g. Roast Type, Sustainability, or Region',
      },
    },
    {
      name: 'items',
      label: 'Feature Details',
      type: 'array',
      fields: [
        {
          name: 'point',
          label: 'Detail Point',
          type: 'text',
          required: true,
          admin: {
            placeholder: 'e.g. Medium Dark, 100% Organic, etc.',
          },
        },
      ],
    },
  ],
}
