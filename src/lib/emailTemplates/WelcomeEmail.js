export function welcomeEmailTemplate(name) {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;
  
  const PRIMARY_COLOR = '#414343'; 
  const ACCENT_COLOR = '#C4754E';
  const BODY_TEXT_COLOR = '#818686';

  return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Surge</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body, table, td, p, span {
            font-family: 'Montserrat', Helvetica, Arial, sans-serif !important;
            font-weight: 400;
        }

        body {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
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

<body style="margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 32px 0;">
            <table class="container-table" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 4px;">
              <tr>
                <td class="content-padding" style="padding: 16px 32px 42px;">
                  
                  <!-- Brand Logo -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px;">
                    <tr>
                      <td align="left">
                        <img src="${LOGO_URL}" width="100" alt="Surge" style="display: block; border: 0;">
                      </td>
                    </tr>
                  </table>

                  <!-- Header Title -->
                  <h1 style="font-size: 22px; font-weight: 600; color: ${PRIMARY_COLOR}; margin: 0 0 25px 0;">
                    Welcome To Surge
                  </h1>

                  <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 25px 0;">Hi ${name},</p>
                  
                  <p style="font-size: 16px; font-weight: 400;color: ${BODY_TEXT_COLOR}; margin: 0 0 32px 0; line-height: 1.6;">
                    We're glad to have you here. Your Surge account is now active. Enjoy faster checkout and easy access to your orders and subscriptions.
                  </p>

                  <!-- Call to Action -->
                  <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 50px;">
                    <tr>
                      <td align="center" bgcolor="${ACCENT_COLOR}" style="border-radius: 2px;">
                        <a href="${BACKEND_URL}" style="font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; padding: 13px 47px; display: inline-block;">
                          Start Exploring
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Signature Section -->
                  <p style="font-size: 16px; font-weight: 500;color: ${PRIMARY_COLOR};  margin: 0 0 8px 0;">
                    Happy brewing,
                  </p>
                  <p style="font-size: 16px; font-weight: 500; color: ${PRIMARY_COLOR}; margin: 0;">
                    Team Surge
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
}
