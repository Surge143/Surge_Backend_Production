export const OrderShippedEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png';
  const BACKEND_URL = 'https://wordpressbackend.whitemantis.ae';

  const formatAddress = (addr) =>
    addr ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.emirates}, ${addr.addressCountry}` : 'N/A';

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
                  <td align="right" style="font-size: 14px; color: #2F362A;">
                    Order ID: <strong style="font-weight: 600;">#${order.id}</strong>
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: 700; color: #2F362A; text-transform: uppercase; margin: 0; display: block;">
                <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-top: -2px; margin-right: 8px;">
                  <path d="M18.4425 4.67928L10.1925 0.162408C9.99961 0.0558774 9.78285 0 9.5625 0C9.34215 0 9.12539 0.0558774 8.9325 0.162408L0.6825 4.67928C0.476067 4.79223 0.303797 4.9586 0.183726 5.16098C0.0636543 5.36335 0.000197689 5.59428 0 5.8296V14.7958C0.000197689 15.0312 0.0636543 15.2621 0.183726 15.4645C0.303797 15.6668 0.476067 15.8332 0.6825 15.9462L8.9325 20.463C9.12545 20.5694 9.34218 20.6252 9.5625 20.6252C9.78282 20.6252 9.99955 20.5694 10.1925 20.463L18.4425 15.9462C18.6489 15.8332 18.8212 15.6668 18.9413 15.4645C19.0613 15.2621 19.1248 15.0312 19.125 14.7958V5.8296C19.1248 5.59428 19.0613 5.36335 18.9413 5.16098C18.8212 4.9586 18.6489 4.79223 18.4425 4.67928ZM9.46875 1.14866C9.49634 1.13356 9.52729 1.12565 9.55875 1.12565C9.59021 1.12565 9.62115 1.13356 9.64875 1.14866L17.4853 5.43772L14.3034 7.17866L6.37969 2.84178L9.46875 1.14866ZM9 19.219L1.21875 14.9599C1.19 14.9433 1.16617 14.9194 1.1497 14.8906C1.13323 14.8617 1.1247 14.829 1.125 14.7958V6.4371L9 10.7496V19.219ZM1.63969 5.43772L5.20875 3.48303L13.1316 7.81991L9.5625 9.77272L1.63969 5.43772ZM18 14.7958C18.0003 14.829 17.9918 14.8617 17.9753 14.8906C17.9588 14.9194 17.935 14.9433 17.9062 14.9599L10.125 19.219V10.7477L13.5 8.89991V12.5627C13.5 12.7119 13.5593 12.855 13.6648 12.9605C13.7702 13.066 13.9133 13.1252 14.0625 13.1252C14.2117 13.1252 14.3548 13.066 14.4602 12.9605C14.5657 12.855 14.625 12.7119 14.625 12.5627V8.28491L18 6.4371V14.7958Z" fill="#2F362A"/>
                </svg>
                Your order is shipped!
              </h1>

              <p style="font-size: 16px; color: #6E736A; margin-top: 20px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0;">
                Great news! Your order has left our warehouse and is on its way to you. 
                It's expected to arrive within <strong>1–3 business days</strong>.
              </p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/orders/${order.id}" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block; border-radius: 2px;">Track Your Order</a>
              </div>

              <div style="margin-bottom: 15px;">
                <h2 style="font-size: 18px; color: #2F362A; margin: 0; display: inline-block; vertical-align: middle;">Order Summary</h2>
                <span style="font-size: 14px; color: #999; margin-left: 8px;">(${order.items.length} items)</span>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-bottom: 1px solid #eee;">
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 15px 0; width: 70px; vertical-align: top;">
                      <img src="${BACKEND_URL}${item.product.productImage.sizes.thumbnail.url}" width="60" style="display: block; border-radius: 4px;">
                    </td>
                    <td style="padding: 15px 10px; vertical-align: top;">
                      <p style="font-weight: 700; font-size: 15px; color: #2F362A; margin: 0;">${item.productName}</p>
                      <p style="font-size: 14px; color: #6E736A; margin: 4px 0;">${item.variantName}g | Qty: ${item.quantity}</p>
                    </td>
                    <td align="right" style="padding: 15px 0; vertical-align: top; font-weight: 700; color: #2F362A;">
                      AED ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                `).join('')}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-size: 14px; color: #2F362A;">
                <tr>
                  <td style="padding: 8px 0;">Subtotal</td>
                  <td align="right">AED ${order.financials.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">Shipping</td>
                  <td align="right">AED ${order.financials.shippingCharge.toFixed(2)}</td>
                </tr>
                ${order.financials.couponDiscount > 0 ? `
                  <tr style="color: #6C7A5F;">
                    <td style="padding: 8px 0;">Discount</td>
                    <td align="right">- AED ${order.financials.couponDiscount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">VAT (5%)</td>
                  <td align="right">AED ${order.financials.taxAmount.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 800; font-size: 16px;">
                  <td style="border-top: 1px solid #e5e5e5; padding: 16px 0;">Total Paid</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 16px 0;">AED ${order.financials.total.toFixed(2)}</td>
                </tr>
              </table>

              <h2 style="font-size: 18px; color: #2F362A; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Delivery Details</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 20px;">
                    <strong style="color: #333; display: block;">Recipient</strong>
                    ${order.billingAddress.addressFirstName} ${order.billingAddress.addressLastName}<br>
                    ${order.email}<br>
                    ${order.billingAddress.phoneNumber}
                  </td>
                  <td width="50%" valign="top">
                    <strong style="color: #333; display: block;">Shipping Address</strong>
                    ${formatAddress(order.shippingAddress)}
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
                Need help? <a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline;">Contact Support</a>
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
};