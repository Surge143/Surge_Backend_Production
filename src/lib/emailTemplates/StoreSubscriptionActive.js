export const SubscriptionActiveEmail = (order) => {
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
                    Invoice ID: <strong style="font-weight: 600;">#${order.id}</strong>
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: 700; color: #2F362A; text-transform: uppercase; margin: 0; display: block;">
                <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-top: -3px; margin-right: 8px;">
                  <path d="M1.80775 19.1152C1.30258 19.1152 0.875 18.9403 0.525 18.5903C0.175 18.2402 0 17.8127 0 17.3075V3.923C0 3.41783 0.175 2.99025 0.525 2.64025C0.875 2.29025 1.30258 2.11525 1.80775 2.11525H3.19225V0H4.73075V2.11525H12.3077V0H13.8077V2.11525H15.1923C15.6974 2.11525 16.125 2.29025 16.475 2.64025C16.825 2.99025 17 3.41783 17 3.923V10.4038L15.5 11.9038V7.923H1.5V17.3075C1.5 17.3845 1.53208 17.455 1.59625 17.519C1.66025 17.5832 1.73075 17.6152 1.80775 17.6152H7.88275L9.39225 19.1152H1.80775ZM1.5 6.423H15.5V3.923C15.5 3.846 15.4679 3.7755 15.4038 3.7115C15.3398 3.64733 15.2692 3.61525 15.1923 3.61525H1.80775C1.73075 3.61525 1.66025 3.64733 1.59625 3.7115C1.53208 3.7755 1.5 3.846 1.5 3.923V6.423ZM13.0115 19.6152L9.8655 16.4788L10.9193 15.425L12.9962 17.5018L17.15 13.348L18.2038 14.4172L13.0115 19.6152Z" fill="#2F362A"/>
                </svg>
                Your Subscription is Active!
              </h1>

              <p style="font-size: 16px; color: #6E736A; margin-top: 20px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0;">
                Your coffee subscription has been successfully set up. We’ll take care of the regular deliveries so you never run out of your favorite beans.
              </p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/subscriptions" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 13px 47px; font-size: 15px; display: inline-block; border-radius: 2px;">Manage Subscription</a>
              </div>

              <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h2 style="font-size: 18px; color: #2F362A; margin: 0 0 5px 0;">Subscription Summary</h2>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 14px; color: #6E736A;">${order.items[0].categoryTitle} Plan</td>
                    <td align="right" style="font-size: 14px; color: #2F362A; font-weight: 700;">${order.items[0].frequency}</td>
                  </tr>
                </table>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 10px 0; width: 70px; vertical-align: top;">
                      <img src="${BACKEND_URL}${item.product.productImage.sizes.thumbnail.url}" width="60" style="display: block; border-radius: 4px;">
                    </td>
                    <td style="padding: 10px 10px; vertical-align: top;">
                      <p style="font-weight: 700; font-size: 15px; color: #2F362A; margin: 0;">${item.productName}</p>
                      <p style="font-size: 14px; color: #6E736A; margin: 4px 0;">
                        ${item.variantName >= 1000 ? (item.variantName/1000) + 'kg' : item.variantName + 'g'} | ${item.quantity}x Bag(s)
                      </p>
                    </td>
                  </tr>
                `).join('')}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-size: 14px; color: #2F362A;">
                <tr>
                  <td style="border-top: 1px solid #e5e5e5; padding: 16px 0 8px 0;">Subtotal</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 16px 0 8px 0;">AED ${order.financials.subtotal.toFixed(2)}</td>
                </tr>
                ${order.financials.subscriptionDiscount > 0 ? `
                  <tr style="color: #6C7A5F;">
                    <td style="padding: 8px 0;">Subscription Discount (20% Off)</td>
                    <td align="right">- AED ${order.financials.subscriptionDiscount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">Shipping</td>
                  <td align="right">AED ${order.financials.shippingCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 16px 0;">VAT (5%)</td>
                  <td align="right">AED ${order.financials.taxAmount.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 800; font-size: 16px;">
                  <td style="border-top: 1px solid #e5e5e5; padding: 16px 0;">Total per delivery</td>
                  <td align="right" style="border-top: 1px solid #e5e5e5; padding: 16px 0;">AED ${order.financials.total.toFixed(2)}</td>
                </tr>
              </table>

              <h2 style="font-size: 18px; color: #2F362A; margin: 0 0 10px 0;">Shipping to:</h2>
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                <strong>${order.shippingAddress.addressFirstName} ${order.shippingAddress.addressLastName}</strong><br>
                ${formatAddress(order.shippingAddress)}<br>
                Phone: ${order.shippingAddress.phoneNumber}
              </p>

              <p style="font-size: 14px; color: #6E736A; padding: 20px 0; border-top: 1px solid #e5e5e5;">
                Your subscription will be processed automatically. You can skip, pause, or cancel anytime via your account dashboard.
              </p>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
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