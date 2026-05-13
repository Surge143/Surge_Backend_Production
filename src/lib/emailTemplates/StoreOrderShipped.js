export const OrderShippedEmail = (order) => {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;

  const ACCENT_COLOR = '#C4754E'; 
  const TEXT_DARK = '#414343';
  const TEXT_LIGHT = '#818686';

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
  <title>Order Shipped - Surge</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body, table, td, p, span, h1, h2, strong {
      font-family: 'Montserrat', sans-serif !important;
      -webkit-font-smoothing: antialiased;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }

    .container-table {
      background-color: #ffffff;
      border: 1px solid #eeeeee;
    }

    @media only screen and (max-width: 600px) {
      .container-table {
        width: 100% !important;
      }
      .content-padding {
        padding: 30px 20px !important;
      }
    }
  </style>
</head>
<body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table class="container-table" border="0" cellpadding="0" cellspacing="0" width="600">
              <tr>
                <td class="content-padding" style="padding: 29px 26px 37px; ">
                  
                  <!-- Header -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td align="left"><img src="${LOGO_URL}" width="100" alt="Surge"></td>
                      <td align="right" style="font-size: 16px; font-weight: 400; color: ${TEXT_DARK};">
                        Order Id : ${order.id} 
                      </td>
                    </tr>
                  </table>

                  <!-- Confirmation Title -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td style="font-size: 22px; font-weight: 600; color: ${TEXT_DARK};">
                        <span style="display:inline-block; vertical-align:middle; margin-right:8px; color: ${TEXT_LIGHT};">
                         <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.4425 4.67928L10.1925 0.162408C9.99961 0.0558774 9.78285 0 9.5625 0C9.34215 0 9.12539 0.0558774 8.9325 0.162408L0.6825 4.67928C0.476067 4.79223 0.303797 4.9586 0.183726 5.16098C0.0636543 5.36335 0.000197689 5.59428 0 5.8296V14.7958C0.000197689 15.0312 0.0636543 15.2621 0.183726 15.4645C0.303797 15.6668 0.476067 15.8332 0.6825 15.9462L8.9325 20.463C9.12545 20.5694 9.34218 20.6252 9.5625 20.6252C9.78282 20.6252 9.99955 20.5694 10.1925 20.463L18.4425 15.9462C18.6489 15.8332 18.8212 15.6668 18.9413 15.4645C19.0613 15.2621 19.1248 15.0312 19.125 14.7958V5.8296C19.1248 5.59428 19.0613 5.36335 18.9413 5.16098C18.8212 4.9586 18.6489 4.79223 18.4425 4.67928ZM9.46875 1.14866C9.49634 1.13356 9.52729 1.12565 9.55875 1.12565C9.59021 1.12565 9.62115 1.13356 9.64875 1.14866L17.4853 5.43772L14.3034 7.17866L6.37969 2.84178L9.46875 1.14866ZM9 19.219L1.21875 14.9599C1.19 14.9433 1.16617 14.9194 1.1497 14.8906C1.13323 14.8617 1.1247 14.829 1.125 14.7958V6.4371L9 10.7496V19.219ZM1.63969 5.43772L5.20875 3.48303L13.1316 7.81991L9.5625 9.77272L1.63969 5.43772ZM18 14.7958C18.0003 14.829 17.9918 14.8617 17.9753 14.8906C17.9588 14.9194 17.935 14.9433 17.9062 14.9599L10.125 19.219V10.7477L13.5 8.89991V12.5627C13.5 12.7119 13.5593 12.855 13.6648 12.9605C13.7702 13.066 13.9133 13.1252 14.0625 13.1252C14.2117 13.1252 14.3548 13.066 14.4602 12.9605C14.5657 12.855 14.625 12.7119 14.625 12.5627V8.28491L18 6.4371V14.7958Z" fill="#414343"/>
                        </svg>
                        </span>
                        Your Order Is Shipped!
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; margin: 0 0 15px 0;">Hi ${order.billingAddress?.addressFirstName || order.shippingAddress?.addressFirstName || 'Customer'},</p>
                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; line-height: 1.6; margin: 0 0 32px 0;">
                    Great news! Your order has left our warehouse and is on its way to you. 
                    It's expected to arrive within <strong style="color: ${TEXT_DARK}">1–3 business days</strong>.
                  </p>

                  <div style="margin-bottom: 50px;">
                    <a href="${BACKEND_URL}/account/orders/${order.id}" style="background-color: ${ACCENT_COLOR}; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 16px; font-weight: 500; display: inline-block;">Track Your Order</a>
                  </div>

                  <!-- Order Summary -->
                  <h2 style="font-size: 16px; font-weight: 400; color: #2F362A; margin: 0 0 40px 0;">
                    Order Summary <span style="font-size: 16px; font-weight: 400; color: #2F362A;">(${(order.items || []).length} items)</span>
                  </h2>

                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px; border-collapse: collapse;">
                    ${(order.items || []).map(item => `
                      <tr>
                        <!-- Fixed Image Column -->
                        <td style="padding: 16px 0; width: 60px; border-top: 1px solid #f0f0f0;">
                          <div style="width: 50px; height: 65px; background: #f7f7f7; overflow: hidden;">
                            <img 
                              src="${BACKEND_URL}${item.product?.productImage?.sizes?.thumbnail?.url || item.product?.productImage?.url || ''}" 
                              alt="${item.productName || item.product?.name || 'Product'}" 
                              width="50" 
                              height="65" 
                              style="display: block; object-fit: cover; border: 0;"
                            >
                          </div>
                        </td>
                        <td style="padding: 15px 10px; border-top: 1px solid #f0f0f0;">
                          <p style="font-size: 16px; font-weight: 400; color: ${TEXT_DARK}; margin: 0;">${item.productName || item.product?.name || 'Product'}</p>
                          <p style="font-size: 16px;font-weight: 400; color: ${TEXT_DARK}; margin: 0;">${item.variantName || 'Regular'}${item.variantName ? 'g' : ''}</p>
                        </td>
                        <td align="center" style="padding: 15px 10px; font-size: 16px;font-weight: 400; color:#2F362A; border-top: 1px solid #f0f0f0;">
                          ×${item.quantity}
                        </td>
                        <td align="right" style="padding: 15px 0; font-size: 16px; font-weight: 400;color: ${TEXT_DARK}; border-top: 1px solid #f0f0f0;">
                          AED ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    `).join('')}
                  </table>

                  <!-- Totals -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; color: ${TEXT_DARK}; margin-bottom: 60px;">
                    <tr><td style="padding: 16px 0; border-top: 1px solid #f0f0f0;">Subtotal</td><td align="right" style="padding: 8px 0; border-top: 1px solid #f0f0f0; color:${TEXT_DARK}">AED ${order.financials?.subtotal?.toFixed(2) || '0.00'}</td></tr>
                    <tr><td style="padding: 16px 0;">Shipping</td><td align="right" style="padding: 8px 0; color:${TEXT_DARK}">AED ${order.financials?.shippingCharge?.toFixed(2) || '0.00'}</td></tr>
                    ${order.financials?.couponDiscount > 0 ? `<tr><td style="padding: 16px 0;">Coupon Discount</td><td align="right" style="padding: 8px 0; color:${TEXT_DARK}">AED -${order.financials.couponDiscount.toFixed(2)}</td></tr>` : ''}
                    <tr><td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; padding-bottom:15px;">VAT</td><td align="right" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; padding-bottom:15px; color:${TEXT_DARK}">AED ${order.financials?.taxAmount?.toFixed(2) || '0.00'}</td></tr>
                    <tr style="font-weight: 700; color: ${TEXT_DARK};">
                      <td style="padding: 16px 0;">Total Paid</td>
                      <td align="right" style="padding: 20px 0;">AED ${order.financials?.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  </table>

                  <!-- Customer Info Grid -->
                  <h2 style="font-size: 22px; font-weight: 400; color: ${TEXT_DARK}; margin: 0 0 25px 0;">Delivery Details</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8; color: ${TEXT_LIGHT};">
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px; padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400 ;text-transform: none; margin-bottom: 2px;">Recipient</strong>
                        ${order.billingAddress?.addressFirstName || ''} ${order.billingAddress?.addressLastName || ''}
                      </td>
                      <td width="50%" valign="top" style="padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400;">Payment Method</strong>
                        Stripe
                      </td>
                    </tr>
                    <tr>
                      <td width="20%" valign="top" style="padding-right: 20px; margin-bottom:0;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Email</strong>
                        ${order.email || ''}
                      </td>
                      <td width="50%" valign="top" style="padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Shipping Address</strong>
                        ${formatAddress(order.shippingAddress)}
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px; padding-bottom: 0;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Phone</strong>
                        ${order.billingAddress?.phoneNumber || 'N/A'}
                      </td>
                      <td width="50%" valign="top">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Billing Address</strong>
                        ${formatAddress(order.billingAddress)}
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400;">Order Date</strong>
                        ${orderDate}
                      </td>
                    </tr>
                  </table>

                  <!-- Footer Text -->
                  <div style="margin-top: 16px; padding-top: 20px; border-top: 1px solid #2F362A4D; font-size: 16px; font-weight:400; color: ${TEXT_LIGHT}; line-height: 1.6;">
                    <p style="margin-top: 15px; font-size: 16px; font-weight:400;color: ${TEXT_DARK};">
                    Need help? <a href="mailto:support@surge.com" style="color: ${ACCENT_COLOR}; text-decoration: underline; margin-top:8px; font-size: 16px; font-weight:400;">Contact Support</a></p>
                    <p style="margin-top: 20px; color: ${TEXT_DARK}; font-size: 16px; font-weight:400;">Happy brewing,<br><strong style=" color: ${TEXT_DARK}; font-size: 16px; font-weight:400 ">Team Surge</strong></p>
                  </div>

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
