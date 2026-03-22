import admin from 'firebase-admin'

let messaging: admin.messaging.Messaging | undefined

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && rawKey) {
    // Handle escaped \n from .env files (with or without surrounding quotes)
    const privateKey = rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '')

    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        })
        messaging = admin.messaging()
      } catch {
        // Key is present but malformed — push notifications disabled, server continues normally
        console.warn('[Firebase] Push notifications disabled: private key could not be parsed. Check FIREBASE_PRIVATE_KEY in .env.')
      }
    } else {
      console.warn('[Firebase] Push notifications disabled: FIREBASE_PRIVATE_KEY missing PEM headers.')
    }
  }
  // No credentials = silent skip (expected during build/CI)
}

export const fcm = messaging as admin.messaging.Messaging
