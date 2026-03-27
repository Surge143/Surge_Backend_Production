export const CafeOrderCancellationEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png'
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae'

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'December 31, 2025'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.cdnfonts.com/css/lato" rel="stylesheet">
  <style>
    body, table, td, p, span { font-family: 'Lato', Helvetica, Arial, sans-serif !important; font-weight: 400; }
    h1, h2, strong { font-family: 'Lexend', sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px;">
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="left"><img src="${LOGO_URL}" width="50" style="display: block;"></td>
                  <td align="right" style="font-size: 14px; color: #2F362A; font-family: 'Lexend', sans-serif;">
                    Order Id: <span style="font-weight: 400;">#${order.id}</span>
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: 700; color: #2F362A; text-transform: uppercase; margin: 0; display: block;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-top: -2px; margin-right: 8px;">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM10 1.2C5.14 1.2 1.2 5.14 1.2 10C1.2 14.86 5.14 18.8 10 18.8C14.86 18.8 18.8 14.86 18.8 10C18.8 5.14 14.86 1.2 10 1.2ZM13.53 12.47L11.06 10L13.53 7.53L12.47 6.47L10 8.94L7.53 6.47L6.47 7.53L8.94 10L6.47 12.47L7.53 13.53L10 11.06L12.47 13.53L13.53 12.47Z" fill="#2F362A"/>
                </svg>
                Your order is CANCELLED!
              </h1>

              <p style="font-size: 16px; color: #6E736A; margin-top: 20px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; margin: 0; line-height: 1.5;">
                Unfortunately, your café order has been cancelled and will not be prepared for pickup. 
                Since the payment was already completed, a refund has been initiated and will be credited back to your original payment method.
              </p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/orders/${order.id}" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block;">View order details</a>
              </div>

              <div style="padding-bottom: 10px;">
                <h2 style="font-size: 20px; color: #2F362A; margin: 0; display: inline-block; vertical-align: middle;">Order Summary</h2>
                <span style="font-size: 15px; color: #999; vertical-align: middle;"> (${order.items.length} items)</span>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                ${(order.items || [])
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 15px 0; width: 60px;">
                      <img src="${BACKEND_URL}${item.product?.image?.sizes?.thumbnail?.url || item.product?.image?.url || ''}" width="60" style="display: block;">
                    </td>
                    <td style="padding: 15px 10px; vertical-align: middle;">
                      <p style="font-weight: 700; font-size: 15px; color: #2F362A; margin: 0;">${item.product?.name || 'Menu Item'}</p>
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
                ${order.financials.couponDiscount > 0 ? `<tr><td style="padding: 8px 0;">Discount</td><td align="right">AED -${order.financials.couponDiscount.toFixed(2)}</td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 0 16px 0;">VAT</td>
                  <td align="right" style="padding: 8px 0 16px 0;">AED ${order.financials.taxAmount.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 800; font-size: 16px;">
                  <td style="border-top: 1px solid #e5e5e5; padding: 16px 0;">Refund Amount</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 16px 0;">AED ${order.financials.total.toFixed(2)}</td>
                </tr>
              </table>

              <div style="padding: 20px; background-color: #fcfcfc; border: 1px solid #eee; margin-bottom: 30px;">
                <p style="font-size: 14px; color: #6E736A; margin: 0; line-height: 1.5;">
                  <strong>Refund Status:</strong> Refunds are typically processed within 3–7 business days, depending on your bank or payment provider.
                </p>
              </div>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
                If you have questions about this cancellation, please reach us at<br>
                <a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline;">support@whitemantis.com</a>
                <br /><br />
                Team White Mantis
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
