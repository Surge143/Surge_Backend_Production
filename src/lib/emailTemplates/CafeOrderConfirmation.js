export const CafeOrderConfirmationEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png';
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae';

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
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM10 18.8C12.3339 18.8 14.5722 17.8729 16.2225 16.2225C17.8729 14.5722 18.8 12.3339 18.8 10C18.8 7.66609 17.8729 5.42778 16.2225 3.77746C14.5722 2.12714 12.3339 1.2 10 1.2C7.66609 1.2 5.42778 2.12714 3.77746 3.77746C2.12714 5.42778 1.2 7.66609 1.2 10C1.2 12.3339 2.12714 14.5722 3.77746 16.2225C5.42778 17.8729 7.66609 18.8 10 18.8ZM8.828 12.558L14.637 6.75L15.485 7.599L9.535 13.549C9.34747 13.7365 9.09316 13.8418 8.828 13.8418C8.56284 13.8418 8.30853 13.7365 8.121 13.549L5 10.426L5.849 9.577L8.829 12.557L8.828 12.558Z" fill="#2F362A"/>
                </svg>
                YOUR ORDER IS CONFIRMED!
              </h1>

              <p style="font-size: 16px; color: #6E736A; margin-top: 20px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; margin: 0; line-height: 1.5;">
                Thank you for your order. Your payment has been received and the café is preparing your order. 
                Your order will be ready for pickup soon. You’ll receive another notification once it is ready.
              </p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/orders/${order.id}" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block;">View order</a>
              </div>

              <div style="padding-bottom: 10px;">
                <h2 style="font-size: 22px; color: #2F362A; margin: 0; display: inline-block; vertical-align: middle;">Order Summary</h2>
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

              <h2 style="font-size: 20px; color: #2F362A; margin-bottom: 10px;">Information</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 20px;">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Name</strong>${order.billingAddress.addressFirstName} ${order.billingAddress.addressLastName}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Email</strong>${order.email}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Order Date</strong>${orderDate}</p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Order Type</strong>${order.orderType}</p>
                    <p style="margin: 0 0 15px 0;"><strong style="color: #333; display: block;">Pickup Location</strong>${order.pickupLocation}</p>
                  </td>
                </tr>
              </table>

              <div style="padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="font-size: 14px; color: #6E736A; margin: 0 0 10px 0;">You will receive another notification when your order is ready for pickup.</p>
                <p style="font-size: 14px; color: #2F362A; font-weight: bold; margin: 0;">Please note: Once the café begins preparing your order, it may no longer be cancelled.</p>
              </div>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin-top: 30px;">
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