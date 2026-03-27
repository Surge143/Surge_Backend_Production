export const SubscriptionRenewedEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png'
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae'

  const formatAddress = (addr) =>
    addr
      ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.emirates}, ${addr.addressCountry}`
      : 'N/A'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.cdnfonts.com/css/lato" rel="stylesheet">
  <style>
    body, table, td, p, span { font-family: 'Lato', Helvetica, Arial, sans-serif !important; }
    h1, h2, strong { font-family: 'Lexend', sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="left"><img src="${LOGO_URL}" width="50" style="display: block;"></td>
                  <td align="right" style="font-size: 13px; color: #6E736A;">
                    Order ID: <strong>#${order.id}</strong>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="35" valign="top">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#6C7A5F"/>
                    </svg>
                  </td>
                  <td align="left">
                    <h1 style="font-size: 20px; color: #2F362A; text-transform: uppercase; margin: 0; line-height: 1.2;">
                      Renewal Successful!
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #6E736A;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.6; margin: 0;">
                Great news! Your payment was processed successfully. We're getting your fresh batch of coffee ready for delivery.
              </p>

              <div style="padding: 24px 0;">
                <a href="https://whitemantis.ae/account/subscriptions" style="background-color: #6C7A5F; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; display: inline-block; font-weight: 600;">Manage Subscription</a>
              </div>

              <h2 style="font-size: 18px; color: #2F362A; margin: 32px 0 16px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Order Summary</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 12px 0; width: 70px;">
                      <img src="${BACKEND_URL}${item.product.productImage.sizes.thumbnail.url}" width="60" style="border-radius: 4px;">
                    </td>
                    <td style="padding: 12px 10px;">
                      <p style="font-size: 15px; font-weight: 700; color: #2F362A; margin: 0;">${item.productName}</p>
                      <p style="font-size: 13px; color: #6E736A; margin: 4px 0 0 0;">
                        ${item.variantName >= 1000 ? item.variantName / 1000 + 'kg' : item.variantName + 'g'} | ${item.quantity} Bag(s)
                      </p>
                    </td>
                    <td align="right" style="font-size: 15px; color: #2F362A; font-weight: 600;">
                      AED ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 1px solid #eeeeee; padding-top: 16px;">
                <tr>
                  <td style="padding: 4px 0; color: #6E736A; font-size: 14px;">Subtotal</td>
                  <td align="right" style="padding: 4px 0; color: #2F362A; font-size: 14px;">AED ${order.financials.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6C7A5F; font-size: 14px;">Subscription Discount (20%)</td>
                  <td align="right" style="padding: 4px 0; color: #6C7A5F; font-size: 14px;">-AED ${order.financials.subscriptionDiscount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6E736A; font-size: 14px;">Shipping</td>
                  <td align="right" style="padding: 4px 0; color: #2F362A; font-size: 14px;">AED ${order.financials.shippingCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; color: #2F362A; font-size: 18px; font-weight: 800;">Total</td>
                  <td align="right" style="padding: 16px 0; color: #2F362A; font-size: 18px; font-weight: 800;">AED ${order.financials.total.toFixed(2)}</td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; padding: 20px; background-color: #F9F9F9; border-radius: 4px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 10px;">
                    <p style="font-size: 13px; font-weight: 800; color: #2F362A; text-transform: uppercase; margin: 0 0 8px 0;">Shipping To</p>
                    <p style="font-size: 13px; color: #6E736A; margin: 0; line-height: 1.4;">
                      ${order.shippingAddress.addressFirstName} ${order.shippingAddress.addressLastName}<br>
                      ${formatAddress(order.shippingAddress)}
                    </p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="font-size: 13px; font-weight: 800; color: #2F362A; text-transform: uppercase; margin: 0 0 8px 0;">Delivery Schedule</p>
                    <p style="font-size: 13px; color: #6E736A; margin: 0; line-height: 1.4;">
                      Frequency: ${order.items?.[0]?.frequencyName || 'Regular'}<br>
                      Next Renewal: ${order.nextPaymentDate ? new Date(order.nextPaymentDate).toLocaleDateString() : 'See Account'}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6E736A; margin: 32px 0 24px 0; line-height: 1.5;">
                Your order will be roasted and dispatched within 2-3 business days. You'll receive a tracking number once it's on the move.
              </p>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
                Questions? Reply to this email or visit our <a href="https://whitemantis.ae/help" style="color: #6C7A5F; text-decoration: underline;">Help Center</a>.
                <br /><br />
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
