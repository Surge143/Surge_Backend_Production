// lib/email-templates.ts
const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png';

export function getOTPEmailTemplate(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      font-family: Helvetica, Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .greeting {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 12px;
      line-height: 1;
      font-family: Helvetica, Arial, sans-serif;
    }
    .welcome-text {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 8px;
      line-height: 0.5;
      padding-bottom: 10px;
      font-family: Helvetica, Arial, sans-serif;
    }
    .instruction-text {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 24px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .code-label {
      font-size: 16px;
      color: #4B3827;
      font-weight: 500;
      margin-bottom: 16px;
      text-decoration: none;
      font-family: Helvetica, Arial, sans-serif;
    }
    .otp-container {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
      justify-content: center;
      font-family: Helvetica, Arial, sans-serif;
    }
    .otp-digit {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
      color: #4B3827;
      text-align: center;
      line-height: 48px;
      font-family: Helvetica, Arial, sans-serif;
    }
    .validity-text {
      font-size: 14px;
      color: #8C8C8C;
      font-style: italic;
      margin-bottom: 32px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .help-text {
      font-size: 16px;
      color: #6C7A5F;
      margin-bottom: 4px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .support-email {
      font-size: 16px;
      color: #6C7A5F !important;
      text-decoration: underline;
      margin-bottom: 32px;
      display: inline-block;
    }
    .closing {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 0px;
      line-height: 0.5;
    }
    .signature {
      font-size: 16px;
      color: #4B3827;
      font-weight: 500;
      line-height: 0.5;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px;
        padding: 24px;
      }
      .otp-digit {
        width: 40px;
        height: 40px;
        font-size: 20px;
        line-height: 40px;
        font-weight: 1000;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <p class="greeting">Hi there,</p>
    
    <p class="welcome-text">Welcome to Whitemantis</p>
    <p class="instruction-text">To complete your sign-in, please use the verification code below:</p>
    
    <p class="code-label">Your verification code</p>
    
    <div class="otp-container">
      ${otp.split('').map(digit => `<div class="otp-digit">${digit}</div>`).join('')}
    </div>
    
    <p class="validity-text">This code is valid for the next 5 minutes.</p>
    
    <p class="help-text">Need help? Reach us at</p>
    <a href="mailto:support@whitemantis.com" class="support-email">support@whitemantis.com</a>
    
    <p class="closing">Happy brewing,</p>
    <p class="signature">Team Whitemantis</p>
  </div>
</body>
</html>
  `.trim();
}

export function OTPForUpdateEmail(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Whitemantis</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      font-family: Helvetica, Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .greeting {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 12px;
      line-height: 1;
      font-family: Helvetica, Arial, sans-serif;
    }
    .welcome-text {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 8px;
      line-height: 0.5;
      padding-bottom: 10px;
      font-family: Helvetica, Arial, sans-serif;
    }
    .instruction-text {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 24px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .code-label {
      font-size: 16px;
      color: #4B3827;
      font-weight: 500;
      margin-bottom: 16px;
      text-decoration: none;
      font-family: Helvetica, Arial, sans-serif;
    }
    .otp-container {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
      justify-content: center;
      font-family: Helvetica, Arial, sans-serif;
    }
    .otp-digit {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
      color: #4B3827;
      text-align: center;
      line-height: 48px;
      font-family: Helvetica, Arial, sans-serif;
    }
    .validity-text {
      font-size: 14px;
      color: #8C8C8C;
      font-style: italic;
      margin-bottom: 32px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .help-text {
      font-size: 16px;
      color: #6C7A5F;
      margin-bottom: 4px;
      line-height: 1.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .support-email {
      font-size: 16px;
      color: #6C7A5F !important;
      text-decoration: underline;
      margin-bottom: 32px;
      display: inline-block;
      font-family: Helvetica, Arial, sans-serif;
    }
    .closing {
      font-size: 16px;
      color: #4B3827;
      margin-bottom: 0px;
      line-height: 0.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    .signature {
      font-size: 16px;
      color: #4B3827;
      font-weight: 500;
      line-height: 0.5;
      font-family: Helvetica, Arial, sans-serif;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px;
        padding: 24px;
        font-family: Helvetica, Arial, sans-serif;
      }
      .otp-digit {
        width: 40px;
        height: 40px;
        font-size: 20px;
        line-height: 40px;
        font-weight: 1000;
        font-family: Helvetica, Arial, sans-serif;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <p class="greeting">Hi there,</p>
    
    <p class="welcome-text">Email Change Request</p>
    <p class="instruction-text">We received a request to change the email address linked to your Whitemantis account.
      To confirm this change, please use the verification code below:</p>
    
    <p class="code-label">Your verification code</p>
    
    <div class="otp-container">
      ${otp.split('').map(digit => `<div class="otp-digit">${digit}</div>`).join('')}
    </div>
    
    <p class="validity-text">This code is valid for the next 5 minutes.</p>
    
    <p class="help-text">Need help?If you didn’t request this change, you can safely ignore this email or contact us immediately at</p>
    <a href="mailto:support@whitemantis.com" class="support-email">support@whitemantis.com</a>
    
    <p class="closing">Happy brewing,</p>
    <p class="signature">Team Whitemantis</p>
  </div>
</body>
</html>
  `.trim();
}

export function welcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Whitemantis</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Helvetica, Arial, sans-serif;
      background-color: #4a4a4a;
    }

    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 48px 40px;
      border-radius: 4px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .logo {
      margin-bottom: 32px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .logo img {
      width: 45px;
      height: 45px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .title {
      font-size: 26px;
      font-weight: 700;
      color: #2F362A;
      letter-spacing: 1px;
      margin-bottom: 24px;
      text-transform: uppercase;
      font-family: Helvetica, Arial, sans-serif;
    }

    .greeting {
      font-size: 16px;
      color: #6E736A;
      margin-bottom: 16px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .message {
      font-size: 16px;
      color: #6E736A;
      margin-bottom: 32px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .cta-button {
      display: inline-block;
      background-color: #6C7A5F;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 2px;
      margin-bottom: 40px;
      font-family: Helvetica, Arial, sans-serif;
    }

    .closing {
      font-size: 16px;
      color: #2F362A;
      font-weight: 500;
      font-family: Helvetica, Arial, sans-serif;
    }

    .signature {
      font-size: 16px;
      font-weight: 500;
      color: #2F362A;
      font-family: Helvetica, Arial, sans-serif;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px;
        padding: 32px 24px;
        font-family: Helvetica, Arial, sans-serif;
      }

      .title {
        font-size: 22px;
        font-family: Helvetica, Arial, sans-serif;
      }
    }
  </style>
</head>

<body>
  <div class="email-container">
    <div class="logo">
      <img src="https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png" alt="WhiteMantis Logo" />
    </div>

    <h1 class="title">Welcome to WhiteMantis!</h1>

    <p class="greeting">Hi ${name},</p>

    <p class="message">
      We’re glad to have you here. Your Whitemantis account is now active.
      Enjoy faster checkout and easy access to your orders and subscriptions.
    </p>

    <a href="https://whitemantis.ae" class="cta-button">
      Start Exploring
    </a>

    <p class="closing">Happy brewing,</p>
    <p class="signature">Team Whitemantis</p>
  </div>
</body>
</html>
  `.trim();
}

export function orderConfirmationEmailTemplate({ order }: { order: any }) {
  // Helper function to format address
  const formatAddress = (addr: any) => {
    if (!addr) return 'N/A';
    return `${addr.addressFirstName || ''} ${addr.addressLastName || ''}<br/>${addr.addressLine1 || ''}${addr.addressLine2 ? `<br/>${addr.addressLine2}` : ''}<br/>${addr.city || ''}, ${addr.emirates || ''}`.trim();
  };

  // Helper function to get product image
  const getProductImage = (product: any) => {
    if (typeof product === 'object' && product?.images?.length > 0) {
      const img = product.images[0];
      return typeof img === 'object' ? img.url : img;
    }
    return '';
  };

  // Helper function to get product name
  const getProductName = (product: any) => {
    if (typeof product === 'object') return product.name || 'Product';
    return 'Product';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0; font-family: Helvetica, Arial, sans-serif;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); font-family: Helvetica, Arial, sans-serif;">
          <tr>
            <td style="padding: 40px; font-family: Helvetica, Arial, sans-serif;">

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td align="left" valign="middle" style="font-family: Helvetica, Arial, sans-serif;">
                    <img src="${LOGO_URL}" alt="Whitemantis" width="50" height="auto" style="display: block; width: 50px; font-family: Helvetica, Arial, sans-serif;" />
                  </td>
                  <td align="right" valign="middle" style="font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">
                    Order Id : <span style="font-weight: 700; font-family: Helvetica, Arial, sans-serif;">#${order.id || 'N/A'}</span>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td valign="middle" style="font-family: Helvetica, Arial, sans-serif;">
                    <span style="font-size: 20px; font-weight: 700; color: #2F362A; text-transform: uppercase; vertical-align: middle; letter-spacing: 0.5px; font-family: Helvetica, Arial, sans-serif;">
                      YOUR ORDER IS CONFIRMED!
                    </span>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0 0 16px 0; font-family: Helvetica, Arial, sans-serif;">Hello,</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0 0 24px 0; font-family: Helvetica, Arial, sans-serif;">
                Thank you for your purchase from Whitemantis.<br/> 
                Your order has been successfully placed and we're already preparing it with care.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td align="left" style="padding-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                    <a href="${process.env.NEXTAUTH_URL || 'https://whitemantis.ae'}/account/orders/${order.id}" style="display: inline-block; background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; border-radius: 4px; font-weight: bold; font-family: Helvetica, Arial, sans-serif;">View order</a>
                  </td>
                </tr>
              </table>

              <h2 style="font-size: 18px; font-weight: 700; color: #2F362A; margin: 0 0 16px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; font-family: Helvetica, Arial, sans-serif;">
                Order Summary (${order.items?.length || 0} items)
              </h2>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                ${(order.items || []).map((item: any) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; width: 60px; font-family: Helvetica, Arial, sans-serif;">
                      ${getProductImage(item.product) ? `<img src="${getProductImage(item.product)}" alt="${getProductName(item.product)}" width="48" height="48" style="display: block; border-radius: 4px; object-fit: contain; font-family: Helvetica, Arial, sans-serif;" />` : ""}
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; font-family: Helvetica, Arial, sans-serif;">
                      <div style="font-size: 14px; color: #2F362A; font-weight: 600; font-family: Helvetica, Arial, sans-serif;">${getProductName(item.product)}</div>
                      <div style="font-size: 13px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Qty: ${item.quantity || 1}</div>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: middle; text-align: right; white-space: nowrap; font-family: Helvetica, Arial, sans-serif;">
                      <span style="font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">AED ${(item.price || 0).toFixed(2)}</span>
                    </td>
                  </tr>
                `).join("")}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">AED ${(order.financials?.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Shipping</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">AED ${(order.financials?.shipping || 0).toFixed(2)}</td>
                </tr>
                ${order.financials?.couponDiscount > 0 ? `<tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Coupon Discount</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">-AED ${(order.financials.couponDiscount).toFixed(2)}</td>
                </tr>` : ''}
                ${order.pointsUsed > 0 ? `<tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">WTCoins Discount</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">-AED ${(order.financials?.wtCoinsDiscount || 0).toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">VAT (5%)</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">AED ${(order.financials?.tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #2F362A; border-top: 1px solid #e5e5e5; margin-top: 8px; font-family: Helvetica, Arial, sans-serif;">Total</td>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #2F362A; border-top: 1px solid #e5e5e5; margin-top: 8px; text-align: right; font-family: Helvetica, Arial, sans-serif;">AED ${(order.financials?.total || 0).toFixed(2)}</td>
                </tr>
              </table>

              <h2 style="font-size: 18px; font-weight: 700; color: #2F362A; margin: 0 0 16px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; font-family: Helvetica, Arial, sans-serif;">
                Customer Information
              </h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; width: 40%; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Name:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.billingAddress?.addressFirstName || ''} ${order.billingAddress?.addressLastName || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Email:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.billingAddress?.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Phone:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.billingAddress?.phoneNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Order Date:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Payment Method:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">Card Payment</td>
                </tr>
                <tr><td colspan="2" style="height: 12px; font-family: Helvetica, Arial, sans-serif;"></td></tr>
                    <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Shipping Address:</strong></td>
                    <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${formatAddress(order.shippingAddress)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Billing Address:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${formatAddress(order.billingAddress)}</td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #2F362A; line-height: 1.5; margin: 24px 0; font-family: Helvetica, Arial, sans-serif;">
                Your order will be dispatched within 2–3 business days. Once shipped, you'll receive tracking details by email.<br />
                Please note: once your order is dispatched, it can no longer be cancelled. For assistance, reach out to our Customer Support team.
              </p>

              <p style="font-size: 13px; color: #2F362A; line-height: 1.5; margin: 0; font-family: Helvetica, Arial, sans-serif;">
                Need help? Reach us at <a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline; font-family: Helvetica, Arial, sans-serif;">support@whitemantis.com</a>
                <br /><br />
                Happy brewing,<br />
                Team Whitemantis
              </p>

            </td>
          </tr>
        </table>
        </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function subscriptionConfirmationEmailTemplate({ order }: { order: any }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0; font-family: Helvetica, Arial, sans-serif;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); font-family: Helvetica, Arial, sans-serif;">
          <tr>
            <td style="padding: 40px; font-family: Helvetica, Arial, sans-serif;">

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td align="left" valign="middle" style="font-family: Helvetica, Arial, sans-serif;">
                    <img src="${LOGO_URL}" alt="Whitemantis" width="50" height="auto" style="display: block; width: 50px; font-family: Helvetica, Arial, sans-serif;" />
                  </td>
                  <td align="right" valign="middle" style="font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">
                    Subscription Id : <span style="font-weight: 700; font-family: Helvetica, Arial, sans-serif;">${order.id || 'N/A'}</span>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td valign="middle" style="font-family: Helvetica, Arial, sans-serif;">
                    <span style="font-size: 20px; font-weight: 700; color: #2F362A; text-transform: uppercase; vertical-align: middle; letter-spacing: 0.5px; font-family: Helvetica, Arial, sans-serif;">
                      Your Subscription is Active!
                    </span>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0 0 16px 0; font-family: Helvetica, Arial, sans-serif;">Hello,</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.5; margin: 0 0 24px 0; font-family: Helvetica, Arial, sans-serif;">
                Your coffee subscription has been successfully set up. <br/>
                You’re all set, we’ll take care of the regular deliveries so you never run out.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td align="left" style="padding-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                    <a href="${order.orderUrl}" style="display: inline-block; background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; border-radius: 4px; font-weight: bold; font-family: Helvetica, Arial, sans-serif;">View Active Subscription</a>
                  </td>
                </tr>
              </table>

              <h2 style="font-size: 18px; font-weight: 700; color: #2F362A; margin: 0 0 16px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; font-family: Helvetica, Arial, sans-serif;">
                Subscription details (${order.items.length} items)
              </h2>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                ${order.items.map((item: any) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; width: 60px; font-family: Helvetica, Arial, sans-serif;">
                      ${item.image ? `<img src="${item.image}" alt="${(item.name)}" width="48" height="48" style="display: block; border-radius: 4px; object-fit: contain; font-family: Helvetica, Arial, sans-serif;" />` : ""}
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; font-family: Helvetica, Arial, sans-serif;">
                      <div style="font-size: 14px; color: #2F362A; font-weight: 600; font-family: Helvetica, Arial, sans-serif;">${item.name}</div>
                      <div style="font-size: 13px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Qty: ${item.quantity}</div>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: middle; text-align: right; white-space: nowrap; font-family: Helvetica, Arial, sans-serif;">
                      <span style="font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">${item.price}</span>
                    </td>
                  </tr>
                `).join("")}
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">${order.subtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Shipping</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">${order.shipping}</td>
                </tr>
                 <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">Coupon Discount</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">${order.discount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; font-family: Helvetica, Arial, sans-serif;">VAT</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; text-align: right; font-family: Helvetica, Arial, sans-serif;">${order.vat}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #2F362A; border-top: 1px solid #e5e5e5; margin-top: 8px; font-family: Helvetica, Arial, sans-serif;">Total</td>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #2F362A; border-top: 1px solid #e5e5e5; margin-top: 8px; text-align: right; font-family: Helvetica, Arial, sans-serif;">${order.total}</td>
                </tr>
              </table>

              <h2 style="font-size: 18px; font-weight: 700; color: #2F362A; margin: 0 0 16px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; font-family: Helvetica, Arial, sans-serif;">
                Customer Information
              </h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; font-family: Helvetica, Arial, sans-serif;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; width: 40%; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Name:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Email:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.email}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Phone:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Next delivery date</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.nextDeliveryDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Order Date:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Payment Method:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.paymentMethod}</td>
                </tr>
                <tr><td colspan="2" style="height: 12px; font-family: Helvetica, Arial, sans-serif;"></td></tr>
                    <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Shipping Address:</strong></td>
                    <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.shippingAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;"><strong style="font-family: Helvetica, Arial, sans-serif;">Billing Address:</strong></td>
                  <td style="padding: 4px 0; font-size: 14px; color: #2F362A; vertical-align: top; font-family: Helvetica, Arial, sans-serif;">${order.billingAddress}</td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #2F362A; line-height: 1.5; margin: 24px 0; font-family: Helvetica, Arial, sans-serif;">
                Your subscription will be processed automatically before each delivery. You can cancel anytime before the next order is prepared.
              </p>

              <p style="font-size: 13px; color: #2F362A; line-height: 1.5; margin: 0; font-family: Helvetica, Arial, sans-serif;">
                Need help? Reach us at <a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline; font-family: Helvetica, Arial, sans-serif;">support@whitemantis.com</a>
                <br /><br />
                Happy brewing,<br />
                Team Whitemantis
              </p>

            </td>
          </tr>
        </table>
        </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}