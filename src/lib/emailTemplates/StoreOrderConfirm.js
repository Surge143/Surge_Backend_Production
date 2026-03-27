export const OrderConfirmEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png'
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae'

  const formatAddress = (addr) =>
    addr
      ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.emirates}, ${addr.addressCountry}`
      : 'N/A'

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.cdnfonts.com/css/lato" rel="stylesheet">
  <style>
    body, table, td, p, span { font-family: 'Lato', Helvetica, Arial, sans-serif !important; font-weight: 400; }
    h1, h2, strong, .lexend-font { font-family: 'Lexend', sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="left"><img src="${LOGO_URL}" width="50" style="display: block;"></td>
                  <td align="right" style="font-size: 14px; color: #2F362A; font-family: 'Lexend', sans-serif;">
                    Order Id: #<span id="order-id-text">${order.id}</span>
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: 700; color: #2F362A; text-transform: uppercase; margin: 0;">
                YOUR ORDER IS CONFIRMED!
              </h1>
              <p style="font-size: 16px; color: #6E736A;">Hello ${order.billingAddress?.addressFirstName || 'Customer'},</p>
              <p style="font-size: 16px; color: #6E736A; margin:0">Thank you for your purchase from White Mantis. Your order has been successfully placed.</p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/orders/${order.id}" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block;">View order</a>
              </div>

              <div style="padding-bottom: 10px;">
                <h2 style="font-size: 22px; font-family: 'Lexend', sans-serif; color: #2F362A; margin: 0; display: inline-block; vertical-align: middle;">Order Summary</h2>
                <span style="font-size: 16px; color: #999; vertical-align: middle;"> (${order.items?.length || 0} items)</span>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                ${(order.items || [])
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 15px 0; width: 80px;">
                      <img src="${BACKEND_URL}${item.product?.productImage?.sizes?.thumbnail?.url || item.product?.productImage?.url || ''}" width="60" style="display: block;">
                    </td>
                    <td style="padding: 15px 10px; vertical-align: middle;">
                      <p style="font-weight: 700; font-size: 15px; color: #2F362A; margin: 0;">${item.productName || item.product?.name || 'Product'}</p>
                      <p style="font-weight: 400; font-size: 15px; color: #6E736A; margin: 0;">${item.variantName || 'Regular'}${item.variantName ? 'g' : ''}</p>
                    </td>
                    <td align="center" style="padding: 15px 10px; font-size: 15px; color: #666;">×${item.quantity}</td>
                    <td align="right" style="padding: 15px 0; font-size: 15px; color: #333; font-weight: bold;">AED ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-size: 14px; color: #2F362A;">
                <tr>
                  <td style="border-top: 1px solid #e5e5e5; padding: 20px 0 8px 0;">Subtotal</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 20px 0 8px 0;">AED ${order.financials.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">Shipping</td>
                  <td align="right" style="padding: 8px 0;">AED ${order.financials.shippingCharge.toFixed(2)}</td>
                </tr>
                ${order.financials.couponDiscount > 0 ? `<tr><td style="padding: 8px 0;">Coupon Discount</td><td align="right">AED -${order.financials.couponDiscount.toFixed(2)}</td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 0 16px 0;">VAT</td>
                  <td align="right" style="padding: 8px 0 16px 0;">AED ${order.financials.taxAmount.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 800; font-size: 16px;">
                  <td style="border-top: 1px solid #e5e5e5; padding: 16px 0;">Total</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 16px 0;">AED ${order.financials.total.toFixed(2)}</td>
                </tr>
              </table>

              <h2 style="font-size: 20px; font-family: 'Lexend', sans-serif; color: #2F362A;">Customer Information</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #666; line-height: 1.6;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 20px;">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Name</strong>${order.billingAddress?.addressFirstName || ''} ${order.billingAddress?.addressLastName || ''}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Email</strong>${order.email || ''}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Phone</strong>${order.billingAddress?.phoneNumber || 'N/A'}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Order Date</strong>${orderDate}</p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Payment Method</strong>Stripe</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Shipping Address</strong>${formatAddress(order.shippingAddress)}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block; margin-bottom: 4px;">Billing Address</strong>${formatAddress(order.billingAddress)}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6E736A; padding-top:20px; border-top: 1px solid #e5e5e5;">
                Your order will be dispatched within 2–3 business days. Once shipped, you'll receive tracking details by email.
              </p>
              <p style="font-size: 14px; color: #2F362A;">
                Happy brewing,<br />
                <strong>Team White Mantis</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
