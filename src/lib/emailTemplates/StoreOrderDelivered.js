export const OrderDeliveredEmail = (order) => {
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
  <title>Order Delivered - Surge</title>
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
                         <svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.25 14.25H8.25M0.75 0.75H10.75C12.164 0.75 12.871 0.75 13.31 1.19C13.75 1.628 13.75 2.335 13.75 3.75V12.25M14.25 3.25H16.051C16.881 3.25 17.296 3.25 17.64 3.445C17.984 3.639 18.197 3.995 18.624 4.707L20.323 7.537C20.535 7.891 20.641 8.069 20.696 8.265C20.75 8.462 20.75 8.668 20.75 9.081V11.75C20.75 12.685 20.75 13.152 20.549 13.5C20.4174 13.728 20.228 13.9174 20 14.049C19.652 14.25 19.185 14.25 18.25 14.25M0.75 9.75V11.75C0.75 12.685 0.75 13.152 0.951 13.5C1.08265 13.728 1.27199 13.9174 1.5 14.049C1.848 14.25 2.315 14.25 3.25 14.25M0.75 3.75H6.75M0.75 6.75H4.75" stroke="#414343" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        </span>
                        Your Order Is Delivered!
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; margin: 0 0 15px 0;">Hi ${order.billingAddress?.addressFirstName || order.shippingAddress?.addressFirstName || 'Customer'},</p>
                  <p style="font-size: 16px; color: ${TEXT_LIGHT}; line-height: 1.6; margin: 0 0 32px 0;">
                    We’re happy to let you know that your order has been successfully delivered. We hope you enjoy every cup.
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
                        <td width="70" align="center" valign="middle" bgcolor="#f7f7f7" style="width: 70px; padding: 10px; background-color: #f7f7f7; border-top: 1px solid #f0f0f0;">
                          <img
                            src="${BACKEND_URL}${item.product?.productImage?.sizes?.thumbnail?.url || item.product?.productImage?.url || ''}"
                            alt="${item.productName || item.product?.name || 'Product'}"
                            width="50"
                            style="display: block; margin: 0 auto; border: 0;"
                          >
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
                  <div style="margin-top: 16px; padding-top: 20px; border-top: 1px solid #2F362A4D; font-size: 16px; font-weight:400; color: ${TEXT_LIGHT}; line-height: 1.6;">
                    <p style="margin-top: 15px; font-size: 16px; font-weight:400;color: ${TEXT_DARK};">
                    If there’s anything you need, or if something isn’t quite right, our support team is here to help.<br>
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
