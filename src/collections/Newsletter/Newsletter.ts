import { APIError, CollectionConfig } from 'payload'
import { checkSubscriptionHandler } from './endpoints/checkSubscription'
import { randomUUID } from 'crypto'
import { unsubscribeHandler } from './endpoints/unsubscribe'
import { sendEmail } from '@/lib/emailConfig'
import { newsletterSubscriptionTemplate } from '@/lib/emailTemplates/NewsletterSubscription'

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
            data.unsubscribeToken = randomUUID();
          }
        }
        return args
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation !== 'create') return doc
        try {
          await sendEmail({
            to: doc.email,
            subject: "You're subscribed to Surge!",
            html: newsletterSubscriptionTemplate(doc.unsubscribeToken),
          })
        } catch (error) {
          console.error(`[Newsletter] Failed to send confirmation email to ${doc.email}:`, error)
        }
        return doc
      },
    ],
  },
  endpoints: [
    {
      path: '/check-subscription',
      method: 'get',
      handler: checkSubscriptionHandler,
    },
    {
      path: '/unsubscribe',
      method: 'get',
      handler: unsubscribeHandler,
    }
  ],
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'unsubscribeToken',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
        hidden: true,
      },
    }
  ],
}
