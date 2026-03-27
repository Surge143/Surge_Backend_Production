export const OrderDeliveredEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png';
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae';

  const formatAddress = (addr) =>
    addr ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.emirates}, ${addr.addressCountry}` : 'N/A';

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : 'N/A';

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
                <svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;">
                  <path d="M13.25 14.25H8.25M0.75 0.75H10.75C12.164 0.75 12.871 0.75 13.31 1.19C13.75 1.628 13.75 2.335 13.75 3.75V12.25M14.25 3.25H16.051C16.881 3.25 17.296 3.25 17.64 3.445C17.984 3.639 18.197 3.995 18.624 4.707L20.323 7.537C20.535 7.891 20.641 8.069 20.696 8.265C20.75 8.462 20.75 8.668 20.75 9.081V11.75C20.75 12.685 20.75 13.152 20.549 13.5C20.4174 13.728 20.228 13.9174 20 14.049C19.652 14.25 19.185 14.25 18.25 14.25M0.75 9.75V11.75C0.75 12.685 0.75 13.152 0.951 13.5C1.08265 13.728 1.27199 13.9174 1.5 14.049C1.848 14.25 2.315 14.25 3.25 14.25M0.75 3.75H6.75M0.75 6.75H4.75" stroke="#2F362A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                YOUR ORDER IS DELIVERED!
              </h1>

              <p style="font-size: 16px; color: #6E736A; margin-top: 20px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; margin: 0;">We’re happy to let you know that your order has been successfully delivered. We hope you enjoy every cup.</p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/orders/${order.id}" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block;">View order</a>
              </div>

              <div style="padding-bottom: 10px;">
                <h2 style="font-size: 22px; font-family: 'Lexend', sans-serif; color: #2F362A; margin: 0; display: inline-block; vertical-align: middle;">Order Summary</h2>
                <span style="font-size: 16px; color: #999; vertical-align: middle;"> (${order.items.length} items)</span>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 15px 0; width: 80px;">
                      <img src="${BACKEND_URL}${item.product.productImage.sizes.thumbnail.url}" width="60" style="display: block;">
                    </td>
                    <td style="padding: 15px 10px; vertical-align: middle;">
                      <p style="font-weight: 700; font-size: 15px; color: #2F362A; margin: 0;">${item.productName}</p>
                      <p style="font-weight: 400; font-size: 15px; color: #6E736A; margin: 0;">${item.variantName}g</p>
                    </td>
                    <td align="center" style="padding: 15px 10px; font-size: 15px; color: #666;">×${item.quantity}</td>
                    <td align="right" style="padding: 15px 0; font-size: 15px; color: #333; font-weight: bold;">AED ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
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

              <h2 style="font-size: 20px; font-family: 'Lexend', sans-serif; color: #2F362A; margin-bottom: 10px;">Customer Information</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 20px;">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Name</strong>${order.billingAddress.addressFirstName} ${order.billingAddress.addressLastName}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Email</strong>${order.email}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Phone</strong>${order.billingAddress.phoneNumber}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Order Date</strong>${orderDate}</p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Payment Method</strong>Stripe</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Shipping Address</strong>${formatAddress(order.shippingAddress)}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Billing Address</strong>${formatAddress(order.billingAddress)}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6E736A; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                If there’s anything you need, or if something isn’t quite right, our support team is here to help.
              </p>
              
              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin-top: 20px;">
                Need help? Reach us at <br><a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline;">support@whitemantis.com</a>
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
  `;
}