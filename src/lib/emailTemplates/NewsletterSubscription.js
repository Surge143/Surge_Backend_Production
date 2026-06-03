export function newsletterSubscriptionTemplate(unsubscribeToken) {
  const BACKEND_URL = process.env.NEXTAUTH_URL;
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`;
  const UNSUBSCRIBE_URL = `${BACKEND_URL}/api/newsletters/unsubscribe?token=${unsubscribeToken}`;

  const PRIMARY_COLOR = '#414343';
  const ACCENT_COLOR = '#C4754E';
  const BODY_TEXT_COLOR = '#818686';

  return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thanks for Subscribing - Surge</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body, table, td, p, span, a {
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
                <table class="container-table" border="0" cellpadding="0" cellspacing="0" width="600"
                    style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 4px;">
                    <tr>
                        <td class="content-padding" style="padding: 16px 32px 42px;">

                            <!-- Brand Logo -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px;">
                                <tr>
                                    <td align="left">
                                        <img src="${LOGO_URL}" width="50" alt="Surge"
                                            style="display: block; border: 0;">
                                    </td>
                                </tr>
                            </table>

                            <!-- Heading -->
                            <h1
                                style="font-size: 22px; font-weight: 600; color: ${PRIMARY_COLOR}; margin: 0 0 25px 0; line-height: 1.3;">
                                You're Now Subscribed to Surge!
                            </h1>

                            <!-- Body -->
                            <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 16px 0; line-height: 1.6;">
                                Thank you for subscribing. You're all set to receive our latest updates, exclusive offers, and news from Surge — straight to your inbox.
                            </p>

                            <p style="font-size: 16px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0 0 40px 0; line-height: 1.6;">
                                We'll only send you what's worth your time. No spam, ever.
                            </p>

                            <!-- CTA -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 50px;">
                                <tr>
                                    <td align="center" bgcolor="${ACCENT_COLOR}" style="border-radius: 2px;">
                                        <a href="${BACKEND_URL}"
                                            style="font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; padding: 13px 47px; display: inline-block;">
                                            Explore Surge
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Signature -->
                            <p style="font-size: 16px; font-weight: 500; color: ${PRIMARY_COLOR}; margin: 0 0 8px 0;">
                                Happy brewing,
                            </p>
                            <p style="font-size: 16px; font-weight: 500; color: ${PRIMARY_COLOR}; margin: 0 0 40px 0;">
                                Team Surge
                            </p>

                            <!-- Divider -->
                            <hr style="border: 0; border-top: 1px solid #2F362A4D; margin: 0 0 20px 0;" />

                            <!-- Unsubscribe -->
                            <p style="font-size: 13px; font-weight: 400; color: ${BODY_TEXT_COLOR}; margin: 0; line-height: 1.6;">
                                Not interested anymore?
                                <a href="${UNSUBSCRIBE_URL}"
                                    style="color: ${BODY_TEXT_COLOR}; text-decoration: underline;">Unsubscribe</a>
                                from our newsletter at any time.
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
