export const SubscriptionPaymentFailedEmail = (order) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.cdnfonts.com/css/lato" rel="stylesheet">
  <style>
    body, table, td, p, span { font-family: 'Lato', Helvetica, Arial, sans-serif !important; }
    h1, strong { font-family: 'Lexend', sans-serif !important; }
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
                    Subscription ID: <strong>#${order.id}</strong>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td width="35" valign="top">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#D93025"/>
                    </svg>
                  </td>
                  <td align="left" valign="middle">
                    <h1 style="font-size: 20px; color: #2F362A; text-transform: uppercase; margin: 0; line-height: 1.2;">
                      Payment Action Required
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #6E736A; margin-top: 24px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.6; margin: 0;">
                We tried to process the recurring payment for your coffee subscription, but unfortunately, it couldn't be completed. 
                <br><br>
                To avoid a gap in your coffee deliveries, your subscription has been <strong>temporarily paused</strong>. 
              </p>

              <div style="padding: 32px 0;">
                <a href="https://whitemantis.ae/account/subscriptions" style="background-color: #2F362A; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 15px; display: inline-block; font-weight: 600; border-radius: 2px;">Update Payment & Retry</a>
              </div>

              <div style="background-color: #F9F9F9; padding: 20px; border-left: 4px solid #6C7A5F; margin-bottom: 32px;">
                <p style="font-size: 14px; color: #2F362A; margin: 0; line-height: 1.5;">
                  <strong>Why did this happen?</strong><br>
                  Common reasons include expired cards, insufficient funds, or bank security blocks. Once updated, we'll automatically attempt the delivery again.
                </p>
              </div>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
                Need help with your billing? Reach us at <br><a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline;">support@whitemantis.com</a>
                <br /><br />
                Thanks for being part of the community,<br />
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