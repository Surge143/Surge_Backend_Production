import { PayloadHandler } from 'payload'

export const checkSubscriptionHandler: PayloadHandler = async (req) => {
  const { payload } = req
  const url = new URL(req.url!)
  const email = url.searchParams.get('email')

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const result = await payload.find({
    collection: 'newsletters',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  return Response.json({ subscribed: result.totalDocs > 0 }, { status: 200 })
}
