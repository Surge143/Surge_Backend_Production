export function welcomeEmailTemplate(name) {
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
      Enjoy faster checkout and easy access to your orders.
    </p>

    <a href="https://whitemantis.ae" class="cta-button">
      Start Exploring
    </a>

    <p class="closing">Happy brewing,</p>
    <p class="signature">Team Whitemantis</p>
  </div>
</body>
</html>
  `.trim()
}
