export const AccountDeletedEmail = (userData) => {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;
  const PRIMARY_COLOR = '#414343'; 
  const BODY_TEXT_COLOR = '#818686';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Deleted - Surge</title>
    <!-- Lato and Lexend Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Lexend:wght@700&display=swap" rel="stylesheet">
    <style>
        /* 1. Global Font Overrides (Lato for body) */
        body,
        table,
        td,
        p,
        span {
            font-family: 'montserrat', sans-serif !important;
            font-weight: 500;
        }

        /* 2. Heading Font Overrides (Lexend for titles) */
        h1,
        h2,
        strong,
        .lexend-font {
            font-family: 'montserrat', sans-serif !important;
        }

        /* Essential for email clients: prevents text resizing */
        body {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 32px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 4px;">
              <tr>
                <td style="padding: 16px 32px 39px;">
                  
                  <!-- Logo Section: Surge Logo -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                      <td align="left">
                        <img src="${LOGO_URL}" width="50" alt="Surge Logo" style="display: block;">
                      </td>
                    </tr>
                  </table>

                  <!-- Heading with Icon -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                    <tr>
                      <td width="32" valign="top" style="padding-top: 16px;">
                        <!-- Updated Trash/Delete Icon -->
                        <svg width="18" height="20" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="float: left; margin-top: 3px; margin-bottom: 5px;">
                          <path d="M6.075 15L9 12.1111L11.925 15L13.5 13.4444L10.575 10.5556L13.5 7.66667L11.925 6.11111L9 9L6.075 6.11111L4.5 7.66667L7.425 10.5556L4.5 13.4444L6.075 15ZM3.375 20C2.75625 20 2.22656 19.7824 1.78594 19.3472C1.34531 18.912 1.125 18.3889 1.125 17.7778V3.33333H0V1.11111H5.625V0H12.375V1.11111H18V3.33333H16.875V17.7778C16.875 18.3889 16.6547 18.912 16.2141 19.3472C15.7734 19.7824 15.2437 20 14.625 20H3.375ZM14.625 3.33333H3.375V17.7778H14.625V3.33333Z" fill="${PRIMARY_COLOR}"/>
                        </svg>
                      </td>
                      <td align="left" valign="top">
                        <!-- Headling Text Verbatim -->
                        <h1 style="font-size: 22px; font-family: 'montserrat', sans-serif; font-weight: 600; color: ${PRIMARY_COLOR}; margin: 0 0 20px 0; line-height: 1.3;">
                          Your Account Has Been Permanently <br> Deleted !
                        </h1>
                      </td>
                    </tr>
                  </table>

                  <!-- Greeting and First Paragraph with Surge references -->
                  <p style="font-size: 16px; color:#818686; margin: 0 0 16px 0; font-weight: 400; line-height: 1.5;">Hi ${userData?.firstName || ''} ${userData?.lastName || ''},</p>
                  
                  <p style="font-size: 16px; color: ${BODY_TEXT_COLOR};font-family: 'montserrat';  font-weight: 400;margin: 0 0 40px 0; line-height: 1.5;">
                    Your Surge account has been permanently deleted. Any order that was already shipped will still be delivered to you. All your personal data and account history have been permanently removed from our system.
                  </p>

                  <!-- Horizontal Line matching image_0.png -->
                  <hr style="border: 0; border-top: 1px solid #2F362A4D; margin: 0 0 20px 0;" />

                  <!-- Re-shopping paragraph -->
                  <p style="font-size: 16px; color: ${BODY_TEXT_COLOR}; font-weight: 400; font-family: 'montserrat'; margin: 0 0 40px 0; line-height: 1.5;">
                    If you wish to shop with us again, you'll need to create a new <br>account.
                  </p>

                  <!-- Mistake/Support paragraph -->
                  <p style="font-size: 16px; color: ${PRIMARY_COLOR}; font-weight: 400; font-family: 'montserrat'; margin: 0 0 20px 0; line-height: 1.5;">
                    If you believe this was a mistake or need help, contact us at<br>
                    <a href="mailto:hello@surgecoffee.ae" style="color: #C4754E;font-weight: 400; font-family: 'montserrat'; text-decoration: underline;">hello@surgecoffee.ae</a>
                  </p>

                  <!-- Final Footer Verbatim from image_0.png -->
                  <div style="font-size: 16px; color: ${PRIMARY_COLOR}; font-weight: 400; font-family: 'montserrat'; margin: 0 0 8px 0;">
                    Thankyou, <br />
                    <p style="font-size: 16px; color: ${PRIMARY_COLOR}; font-weight: 400; font-family:'montserrat'; margin:0;">Team Surge</p>
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
};
