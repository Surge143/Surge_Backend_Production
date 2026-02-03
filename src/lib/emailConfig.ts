// lib/email.ts (updated for Gmail API OAuth)

import { google } from "googleapis";

type SendEmailParams = {
    to: string;
    subject: string;
    body?: string;
    html?: string;
    name?: string;
};

const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;
const EMAIL_FROM = process.env.EMAIL_FROM!; // your business email

export async function sendEmail({ to, subject, body = "", html, name }: SendEmailParams) {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // If HTML is provided, create a multipart email
    let emailContent: string;

    if (html) {
        const boundary = "----=_Part_" + Date.now();
        emailContent = `From: "White Mantis" <${EMAIL_FROM}>
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset=UTF-8

${body}

--${boundary}
Content-Type: text/html; charset=UTF-8

${html}

--${boundary}--`;
    } else {
        // Plain text only
        emailContent = `From: "White Mantis" <${EMAIL_FROM}>
To: ${to}
Subject: ${subject}

${body}`;
    }

    const encodedMessage = Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
    });

    return true;
}
