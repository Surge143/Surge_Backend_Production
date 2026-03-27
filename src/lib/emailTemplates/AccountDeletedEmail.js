export const AccountDeletedEmail = (userData) => {
  const LOGO_URL = 'https://wordpressbackend.whitemantis.ae/wp-content/uploads/2026/01/image.png'

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
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                <tr>
                  <td width="32" valign="top" style="padding-top: 2px;">
                    <svg width="24" height="24" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin-top: 2px;">
                      <path d="M6.075 15L9 12.1111L11.925 15L13.5 13.4444L10.575 10.5556L13.5 7.66667L11.925 6.11111L9 9L6.075 6.11111L4.5 7.66667L7.425 10.5556L4.5 13.4444L6.075 15ZM3.375 20C2.75625 20 2.22656 19.7824 1.78594 19.3472C1.34531 18.912 1.125 18.3889 1.125 17.7778V3.33333H0V1.11111H5.625V0H12.375V1.11111H18V3.33333H16.875V17.7778C16.875 18.3889 16.6547 18.912 16.2141 19.3472C15.7734 19.7824 15.2437 20 14.625 20H3.375ZM14.625 3.33333H3.375V17.7778H14.625V3.33333Z" fill="#2F362A"/>
                    </svg>
                  </td>
                  <td align="left" valign="top">
                    <h1 style="font-size: 20px; color: #2F362A; text-transform: uppercase; margin: 0; line-height: 1.3;">
                      Your Account has been permanently deleted!
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #6E736A;">Hi ${userData.firstName || ''} ${userData.lastName || ''},</p>
              <p style="font-size: 16px; color: #6E736A; margin: 0; line-height: 1.5;">
                Your White Mantis account has been permanently deleted. Your subscriptions have been cancelled. 
                Any order that was already shipped will still be delivered to you. 
                All your personal data and account history have been permanently removed from our system.
              </p>

              <p style="font-size: 15px; color: #6E736A; padding-top: 20px; border-top: 1px solid #e5e5e5; margin-top: 30px; line-height: 1.5;">
                If you wish to shop with us again, you’ll need to create a new account.
              </p>

              <p style="font-size: 15px; color: #2F362A; line-height: 1.5; margin: 20px 0 0 0;">
                If you believe this was a mistake or need help, contact us at:<br>
                <a href="mailto:support@whitemantis.com" style="color: #6C7A5F; text-decoration: underline;">support@whitemantis.com</a>
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
  `
}
