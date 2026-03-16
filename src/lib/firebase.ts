import admin from 'firebase-admin'

let messaging: admin.messaging.Messaging | undefined

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (projectId && clientEmail && privateKey) {
      // Handle both literal newlines and escaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n')

      // Ensure it's a valid PEM format to avoid library-level sync errors
      if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      } else {
        console.warn('[Firebase] Key present but missing PEM headers. Skipping.')
      }
    } else {
      console.warn(
        '[Firebase] Credentials missing. Skipping initialization (expected during build).',
      )
    }
  }

  if (admin.apps.length) {
    messaging = admin.messaging()
  }
} catch (error) {
  console.error('[Firebase] Error during initialization:', error)
}

export const fcm = messaging as admin.messaging.Messaging
