export const OrderConfirmEmail = (order) => {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;

  const ACCENT_COLOR = '#C4754E'; 
  const TEXT_DARK = '#414343';
  const TEXT_LIGHT = '#818686';

  const formatAddress = (addr) =>
    addr
      ? `${addr.addressLine1}, ${addr.addressLine2 ? addr.addressLine2 + ', ' : ''}${addr.city}, ${addr.emirates}, ${addr.addressCountry}`
      : 'N/A'

  const formatPickupShop = (shop) =>
    shop?.address
      ? [shop.address.street, shop.address.apartment, shop.address.city, shop.address.emirates, shop.address.country].filter(Boolean).join(', ')
      : 'N/A'

  const isPickup = order.deliveryOption === 'pickup'

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
  <title>Order Confirmation - Surge</title>
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
                        <span style="display:inline-block; vertical-align:middle; margin-left:5px; cursor:pointer;">
                         <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_8925_22376" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
<rect width="20" height="20" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_8925_22376)">
<path d="M7.54813 14.5859C7.12715 14.5859 6.77083 14.4401 6.47917 14.1484C6.1875 13.8568 6.04167 13.5005 6.04167 13.0795V3.5924C6.04167 3.17142 6.1875 2.8151 6.47917 2.52344C6.77083 2.23177 7.12715 2.08594 7.54813 2.08594H14.5352C14.9562 2.08594 15.3125 2.23177 15.6042 2.52344C15.8958 2.8151 16.0417 3.17142 16.0417 3.5924V13.0795C16.0417 13.5005 15.8958 13.8568 15.6042 14.1484C15.3125 14.4401 14.9562 14.5859 14.5352 14.5859H7.54813ZM7.54813 13.3359H14.5352C14.5994 13.3359 14.6581 13.3092 14.7115 13.2557C14.7649 13.2024 14.7917 13.1436 14.7917 13.0795V3.5924C14.7917 3.52823 14.7649 3.46948 14.7115 3.41615C14.6581 3.36267 14.5994 3.33594 14.5352 3.33594H7.54813C7.48396 3.33594 7.42521 3.36267 7.37188 3.41615C7.3184 3.46948 7.29167 3.52823 7.29167 3.5924V13.0795C7.29167 13.1436 7.3184 13.2024 7.37188 13.2557C7.42521 13.3092 7.48396 13.3359 7.54813 13.3359ZM4.63146 17.5026C4.21049 17.5026 3.85417 17.3568 3.5625 17.0651C3.27083 16.7734 3.125 16.4171 3.125 15.9961V5.25906H4.375V15.9961C4.375 16.0603 4.40174 16.1191 4.45521 16.1724C4.50854 16.2259 4.56729 16.2526 4.63146 16.2526H12.8685V17.5026H4.63146Z" fill="#414343"/>
</g>
</svg>
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Confirmation Title -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td>
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td valign="middle" style="padding-right:8px;">
                              <img src="${BACKEND_URL}/api/media/file/emailer.png" width="20" height="20" alt="✓" style="display:block;" />
                            </td>
                            <td valign="middle" style="font-size: 22px; font-weight: 600; color: ${TEXT_DARK};">
                              Your Order Is Confirmed!
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; margin: 0 0 15px 0;">Hi ${order.billingAddress?.addressFirstName || order.shippingAddress?.addressFirstName || 'Customer'},</p>
                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; line-height: 1.6; margin: 0 0 32px 0;">
                    Thank you for your purchase from Surge. Your order has been successfully placed and we're already preparing it with care.
                  </p>

                  <div style="margin-bottom: 50px;">
                    <a href="${FRONTEND_URL}/account/orders/${order.id}" style="background-color: ${ACCENT_COLOR}; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 16px; font-weight: 500; display: inline-block;">View order</a>
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
                          <div style="width: 50px; height: 65px; background: #f7f7f7; overflow: hidden; padding: 15px;">
                            <img 
                              src="${BACKEND_URL}${item.product?.productImage?.sizes?.thumbnail?.url || item.product?.productImage?.url || ''}" 
                              alt="${item.productName || item.product?.name || 'Product'}" 
                              width="50" 
                              height="65" 
                              style="display: block; object-fit: contain; border: 0;"
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
                      <td style="padding: 16px 0;">Total</td>
                      <td align="right" style="padding: 20px 0;">AED ${order.financials?.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  </table>

                  <!-- Customer Info Grid -->
                  <h2 style="font-size: 22px; font-weight: 400; color: ${TEXT_DARK}; margin: 0 0 25px 0;">Customer Information</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8; color: ${TEXT_LIGHT};">
                    <tr>
                      <td width="50%" valign="top" style="padding-right: 20px; padding-bottom: 25px;">
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400 ;text-transform: none; margin-bottom: 2px;">Name</strong>
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
                        <strong style="color: ${TEXT_DARK}; display: block; font-size: 16px; font-weight:400; margin-bottom: 2px;">${isPickup ? 'Pickup Location' : 'Shipping Address'}</strong>
                        ${isPickup ? formatPickupShop(order.pickupShop) : formatAddress(order.shippingAddress)}
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
                  <div style="margin-top: 16px; padding-top: 6px; border-top: 1px solid #2F362A4D; font-size: 16px; font-weight:400; color: ${TEXT_LIGHT}; line-height: 1.6;">
                    ${isPickup
                      ? `<p>Your order is being prepared and will be ready for pickup at the selected location. We'll notify you when it's ready.</p>
                    <p style="margin-top: 15px; font-size: 16px; font-weight:400;color: ${TEXT_DARK}; ">Please note: once your order is confirmed, it can no longer be <br>cancelled.
                      <br>For assistance, reach out to our Customer Support team.</p>`
                      : `<p>Your order will be dispatched within 2–3 business days. Once shipped, you'll receive tracking details by email.</p>
                    <p style="margin-top: 15px; font-size: 16px; font-weight:400;color: ${TEXT_DARK}; ">Please note: once your order is dispatched, it can no longer be <br>cancelled.
                      <br>For assistance, reach out to our Customer Support team.</p>`
                    }
                    <p style="margin-top: 40px; font-size: 16px; font-weight:400;color: ${TEXT_DARK};">Need help? Reach us at<br>
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
