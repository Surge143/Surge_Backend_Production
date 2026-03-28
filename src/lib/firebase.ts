import admin from 'firebase-admin'

let messaging: admin.messaging.Messaging | undefined

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('ascii')
    : process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && rawKey) {
    // Handle escaped \n, literal newlines, and surrounding quotes (single or double)
    const privateKey = rawKey
      .replace(/\\n/g, '\n')
      .replace(/^['"]|['"]$/g, '')
      .trim()

    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        })
        messaging = admin.messaging()
      } catch (err: any) {
        // Key is present but malformed — push notifications disabled, server continues normally
        console.warn(
          `[Firebase] Push notifications disabled: private key could not be parsed. Error: ${err.message}`,
        )
        console.warn(`[Firebase] Private Key Length: ${privateKey.length}`)
      }
    } else {
      console.warn(
        '[Firebase] Push notifications disabled: FIREBASE_PRIVATE_KEY missing PEM headers.',
      )
    }
  }
  // No credentials = silent skip (expected during build/CI)
}

export const fcm = messaging as admin.messaging.Messaging
