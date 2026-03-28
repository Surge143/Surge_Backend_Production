import { PayloadHandler } from 'payload'
import { generateInvoiceFilename, generateInvoicePDF } from '@/lib/pdf/utils/pdfGenerator'
import { formatAppOrderToInvoice } from '@/lib/pdf/utils/invoiceFormatter'

export const downloadInvoiceHandler: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const id = routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  try {
    const order = await payload.findByID({
      collection: 'app-orders',
      id,
      depth: 1,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Access control
    const isSuperAdmin =
      user?.role === 'super-admin' || user?.role === 'admin' || user?.role === 'shop-manager'
    const isOwner =
      user &&
      String(typeof order.user === 'object' ? order.user?.id : order.user) === String(user.id)

    if (!isSuperAdmin && !isOwner) {
      return Response.json({ error: 'Unauthorized to view this invoice' }, { status: 401 })
    }

    const invoiceData = formatAppOrderToInvoice(order)
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    const filename = generateInvoiceFilename(String(order.invoiceId || order.id), 'order')

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating app order invoice:', error)
    return Response.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
