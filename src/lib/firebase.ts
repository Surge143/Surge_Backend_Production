import admin from 'firebase-admin'

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('BEGIN PRIVATE KEY')) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } else {
      console.warn(
        '[Firebase] FIREBASE_PRIVATE_KEY is present but does not appear to be a valid PEM key. Skipping initialization.',
      )
    }
  } else {
    console.warn(
      '[Firebase] Firebase credentials missing. Skipping initialization (expected during build).',
    )
  }
}
export const fcm = admin.messaging()
