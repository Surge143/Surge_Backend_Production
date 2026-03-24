import { APIError, CollectionConfig } from 'payload'

export const Newsletter: CollectionConfig = {
  slug: 'newsletters',
  access: {
    create: () => true,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Marketing',
  },
  hooks: {
    beforeOperation: [
      async ({ operation, args }) => {
        if (operation === 'create') {
          const { req, data } = args
          if (data?.email) {
            const existing = await req.payload.find({
              collection: 'newsletters',
              where: { email: { equals: data.email } },
              limit: 1,
            })
            if (existing.totalDocs > 0) {
              throw new APIError("You're already subscribed! We'll keep you in the loop.", 400, undefined, true)
            }
          }
        }
        return args
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
  ],
}
