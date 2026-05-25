import { APIError, CollectionConfig } from 'payload'
import { checkSubscriptionHandler } from './endpoints/checkSubscription'

export const Newsletter: CollectionConfig = {
  slug: 'newsletters',
  access: {
    create: () => true,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Marketing',
    description: 'Send email updates to customers',
    hidden: ({ user }) => {
      const isAuthorized =
        user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
      return !isAuthorized
    },
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
              throw new APIError(
                "You're already subscribed! We'll keep you in the loop.",
                400,
                undefined,
                true,
              )
            }
          }
        }
        return args
      },
    ],
  },
  endpoints: [
    {
      path: '/check-subscription',
      method: 'get',
      handler: checkSubscriptionHandler,
    },
  ],
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
  ],
}
