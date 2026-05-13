export function OTPForUpdateEmail(otp) {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;
  
  const PRIMARY_COLOR = '#818686'; 
  const ACCENT_COLOR = '#C4754E'; 
  const BODY_TEXT_COLOR = '#414343';

  return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Change Verification - Surge</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body, table, td, p, span {
            font-family: 'Montserrat', Helvetica, Arial, sans-serif !important;
          
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
          <td align="center" style="padding: 40px 0;">
            <table class="container-table" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 4px;">
              <tr>
                <td class="content-padding" style="padding: 22px 32px 65px;">
                  
                  <!-- Brand Logo -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px;">
                    <tr>
                      <td align="left">
                        <img src="${LOGO_URL}" width="100" alt="Surge" style="display: block; border: 0;">
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; color: ${PRIMARY_COLOR}; margin: 23px 0 16px 0;">Hi there,</p>
                  
                  <p style="font-size: 16px; color: ${PRIMARY_COLOR};font-weight: 400; margin: 0 0 4px 0;">Email Change Request,</p>
                  <p style="font-size: 16px; color: ${PRIMARY_COLOR}; font-weight: 400;margin: 0 0 40px 0; line-height: 1.5;">We received a request to change the email address linked to your Surge account. To confirm this change, please use the verification code below:</p>

                  <!-- Verification Code Section -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 50px;">
                    <tr>
                      <td align="center">
                        <p style="font-size: 16px;  font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 20px 0;">Your verification code</p>
                        <p style="font-size: 22px; font-weight: 600; font-family: 'Montserrat', sans-serif; color: ${BODY_TEXT_COLOR}; margin: 0; letter-spacing: 9px;">
                          ${otp}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 16px; font-weight: 400;color: ${BODY_TEXT_COLOR}; margin: 0 0 20px 0;">
                    This code is valid for the next 5 minutes.
                  </p>

                  <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 20px 0; line-height: 1.6;">
                    If you didn’t request this change, you can safely ignore this email or contact us immediately at<br>
                    <a href="mailto:hello@surgecoffee.ae" style="color: ${ACCENT_COLOR}; text-decoration: underline;">hello@surgecoffee.ae</a>
                  </p>

                  <!-- Signature Section -->
                  <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 5px 0;">
                    Happy brewing,
                  </p>
                  <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0;">
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
