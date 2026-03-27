export const SubscriptionCancelledEmail = (order) => {
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
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td width="35" valign="top">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.4 15L10 11.4L13.6 15L15 13.6L11.4 10L15 6.4L13.6 5L10 8.6L6.4 5L5 6.4L8.6 10L5 13.6L6.4 15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#2F362A"/>
                    </svg>
                  </td>
                  <td align="left" valign="middle">
                    <h1 style="font-size: 20px; color: #2F362A; text-transform: uppercase; margin: 0; line-height: 1.2;">
                      Subscription Cancelled
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #6E736A; margin-top: 24px;">Hi ${order.billingAddress.addressFirstName},</p>
              <p style="font-size: 16px; color: #6E736A; line-height: 1.6; margin-bottom: 32px;">
                As requested, your coffee beans subscription has been cancelled. You will not be charged for any future recurring deliveries. 
                <br><br>
                <em>Note: If you have an order that was already processed or is currently in transit, it will still be delivered to you.</em>
              </p>

              <div style="padding: 24px 0; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; margin-bottom: 32px;">
                <p style="font-size: 15px; color: #2F362A; margin: 0 0 16px 0;">Changed your mind? You can reactivate your plan with a single click.</p>
                <a href="https://whitemantis.ae/account/subscriptions" style="background-color: #6c7a5f; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; display: inline-block; font-weight: 600;">Reactivate Subscription</a>
              </div>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 0;">
                We're sorry to see you go! If you have a moment, we'd love to hear why you cancelled so we can improve.
                <br><br>
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
};