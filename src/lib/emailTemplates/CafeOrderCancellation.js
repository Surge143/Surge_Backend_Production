export const CafeOrderCancellationEmail = (order) => {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;

  const ACCENT_COLOR = '#C4754E'; 
  const TEXT_DARK = '#414343';
  const TEXT_LIGHT = '#818686';

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
  <title>Cafe Order Cancellation - Surge</title>
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
                      <td align="left"><img src="${LOGO_URL}" width="50" alt="Surge"></td>
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
                         <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM10 1.2C5.14 1.2 1.2 5.14 1.2 10C1.2 14.86 5.14 18.8 10 18.8C14.86 18.8 18.8 14.86 18.8 10C18.8 5.14 14.86 1.2 10 1.2ZM13.53 12.47L11.06 10L13.53 7.53L12.47 6.47L10 8.94L7.53 6.47L6.47 7.53L8.94 10L6.47 12.47L7.53 13.53L10 11.06L12.47 13.53L13.53 12.47Z" fill="#414343"/>
</svg>
                        </span>
                        Your order is CANCELLED!
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; margin: 0 0 15px 0;">Hi ${order.billingAddress?.addressFirstName || order.shippingAddress?.addressFirstName || 'Customer'},</p>
                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; line-height: 1.6; margin: 0 0 32px 0;">
                    Unfortunately, your café order has been cancelled and will not be prepared for pickup. 
                    Since the payment was already completed, a refund has been initiated and will be credited back to your original payment method.
                  </p>

                  <div style="margin-bottom: 50px;">
                    <a href="${FRONTEND_URL}/account/orders/${order.id}" style="background-color: ${ACCENT_COLOR}; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 16px; font-weight: 500; display: inline-block;">View order details</a>
                  </div>

                  <!-- Order Summary -->
                  <h2 style="font-size: 16px; font-weight: 400; color: #2F362A; margin: 0 0 40px 0;">
                    Order Summary <span style="font-size: 16px; font-weight: 400; color: #2F362A;">(${(order.items || []).length} items)</span>
                  </h2>

                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px; border-collapse: collapse;">
                    ${(order.items || []).map(item => `
                      <tr>
                        <!-- Fixed Image Column -->
                        <td width="76" valign="top" bgcolor="#f7f7f7" style="width: 76px; padding: 8px; background-color: #f7f7f7; border-top: 1px solid #f0f0f0;">
                          <img
                            src="${BACKEND_URL}${item.product?.image?.sizes?.thumbnail?.url || item.product?.image?.url || ''}"
                            alt="${item.product?.name || 'Menu Item'}"
                            width="60"
                            style="display: block; width: 60px; height: auto; object-fit: contain; border: 0;"
                          >
                        </td>
                        <td style="padding: 15px 10px; border-top: 1px solid #f0f0f0;">
                          <p style="font-size: 16px; font-weight: 400; color: ${TEXT_DARK}; margin: 0;">${item.product?.name || 'Menu Item'}</p>
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
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; color: ${TEXT_DARK}; margin-bottom: 20px;">
                    <tr><td style="padding: 16px 0; border-top: 1px solid #f0f0f0;">Subtotal</td><td align="right" style="padding: 8px 0; border-top: 1px solid #f0f0f0; color:${TEXT_DARK}">AED ${order.financials?.subtotal?.toFixed(2) || '0.00'}</td></tr>
                    ${order.financials?.couponDiscount > 0 ? `<tr><td style="padding: 16px 0;">Discount</td><td align="right" style="padding: 8px 0; color:${TEXT_DARK}">AED -${order.financials.couponDiscount.toFixed(2)}</td></tr>` : ''}
                    <tr><td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; padding-bottom:15px;">VAT</td><td align="right" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; padding-bottom:15px; color:${TEXT_DARK}">AED ${order.financials?.taxAmount?.toFixed(2) || '0.00'}</td></tr>
                    <tr style="font-weight: 700; color: ${TEXT_DARK};">
                      <td style="padding: 16px 0;">Refund Amount</td>
                      <td align="right" style="padding: 20px 0;">AED ${order.financials?.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  </table>

                  <div style="padding: 20px; background-color: #fcfcfc; border: 1px solid #eee; margin-bottom: 30px;">
                    <p style="font-size: 14px; color: ${TEXT_LIGHT}; margin: 0; line-height: 1.5;">
                      <strong style="color: ${TEXT_DARK};">Refund Status:</strong> Refunds are typically processed within 3–7 business days, depending on your bank or payment provider.
                    </p>
                  </div>

                  <!-- Customer Info Grid -->
                  <h2 style="font-size: 22px; font-weight: 400; color: ${TEXT_DARK}; margin: 0 0 25px 0;">Information</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8; color: ${TEXT_LIGHT};">
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px; padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400 ;text-transform: none; margin-bottom: 2px;">Name</strong>
                        ${order.billingAddress?.addressFirstName || ''} ${order.billingAddress?.addressLastName || ''}
                      </td>
                      <td width="50%" valign="top" style="padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400;">Order Type</strong>
                        ${order.orderType || 'Pickup'}
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px; margin-bottom:0;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Email</strong>
                        ${order.email || ''}
                      </td>
                      <td width="50%" valign="top" style="padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">Pickup Location</strong>
                        ${order.pickupLocation || 'Cafe'}
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
                    If you have questions about this cancellation, please reach us at<br>
                    <a href="mailto:hello@surgecoffee.ae" style="color: ${ACCENT_COLOR}; text-decoration: underline; margin-top:8px; font-size: 16px; font-weight:400;">hello@surgecoffee.ae</a></p>
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
