export function unsubscribeFailedPage(): string {
  const BACKEND_URL = process.env.NEXTAUTH_URL || ''
  const LOGO_URL = `${BACKEND_URL}/api/media/file/surge%20logo%20emailer.png`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Failed - Surge</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 16px;
      background-color: #f9f9f9;
      font-family: 'Montserrat', Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .wrapper {
      width: 100%;
      max-width: 600px;
    }
    .card {
      background-color: #ffffff;
      border: 1px solid #eeeeee;
      border-radius: 4px;
      padding: 32px 32px 42px;
    }
    .logo {
      width: 50px;
      display: block;
      margin-bottom: 35px;
      border: 0;
    }
    .heading-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }
    .icon-wrap {
      flex-shrink: 0;
      padding-top: 4px;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #414343;
      margin: 0;
      line-height: 1.3;
    }
    .body-text {
      font-size: 16px;
      font-weight: 400;
      color: #818686;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }
    .divider {
      border: 0;
      border-top: 1px solid rgba(47, 54, 42, 0.3);
      margin: 0 0 20px 0;
    }
    .support-text {
      font-size: 16px;
      font-weight: 400;
      color: #414343;
      line-height: 1.6;
      margin: 0 0 40px 0;
    }
    .support-text a {
      color: #C4754E;
      text-decoration: underline;
    }
    .footer-sign {
      font-size: 16px;
      font-weight: 500;
      color: #414343;
      margin: 0 0 4px 0;
    }
    .footer-team {
      font-size: 16px;
      font-weight: 500;
      color: #414343;
      margin: 0;
    }
    @media only screen and (max-width: 600px) {
      body { padding: 20px 16px; align-items: flex-start; }
      .card { padding: 24px 20px 32px; }
      h1 { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <img src="${LOGO_URL}" alt="Surge" class="logo">

      <div class="heading-row">
        <div class="icon-wrap">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="10" stroke="#414343" stroke-width="1.5"/>
            <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="#414343" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>Invalid Unsubscribe Link</h1>
      </div>

      <p class="body-text">
        This unsubscribe link is invalid or has already been used. Each link can only be used once.
      </p>

      <hr class="divider">

      <p class="support-text">
        If you're still receiving unwanted emails, please contact us at<br>
        <a href="mailto:hello@surgecoffee.ae">hello@surgecoffee.ae</a> and we'll take care of it right away.
      </p>

      <p class="footer-sign">Thankyou,</p>
      <p class="footer-team">Team Surge</p>
    </div>
  </div>
</body>
</html>`
}
