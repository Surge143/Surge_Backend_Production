import { PayloadHandler } from 'payload'
import { generateInvoiceFilename, generateInvoicePDF } from '@/lib/pdf/utils/pdfGenerator'
import { formatPayloadSubscriptionToInvoice } from '@/lib/pdf/utils/invoiceFormatter'

export const downloadInvoiceHandler: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const id = routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Subscription ID is required' }, { status: 400 })
  }

  try {
    const subscription = await payload.findByID({
      collection: 'web-subscription',
      id,
      depth: 1,
    })

    if (!subscription) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Access control
    const isSuperAdmin =
      user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
    const isOwner =
      user &&
      String(typeof subscription.user === 'object' ? subscription.user?.id : subscription.user) ===
        String(user.id)

    // allow if guest token is passed
    const queryParams = new URLSearchParams((req.url || '').split('?')[1])
    const guestToken = queryParams.get('token') || req.headers.get('x-guest-token')
    const isGuestMatch =
      subscription.customerType === 'guest' &&
      subscription.guestAccessToken &&
      subscription.guestAccessToken === guestToken

    if (!isSuperAdmin && !isOwner && !isGuestMatch) {
      return Response.json({ error: 'Unauthorized to view this invoice' }, { status: 401 })
    }

    const invoiceData = formatPayloadSubscriptionToInvoice(subscription)
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    const filename = generateInvoiceFilename(
      String(subscription.invoiceId || subscription.id),
      'subscription',
    )

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating web subscription invoice:', error)
    return Response.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
