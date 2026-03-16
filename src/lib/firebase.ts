import admin from 'firebase-admin'

let messaging: admin.messaging.Messaging | undefined

// Detect if we are in a build/placeholder environment
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID)

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (projectId && clientEmail && privateKey) {
      // 1. Clean the key: remove surrounding quotes and handle newlines
      privateKey = privateKey.trim()
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1)
      }
      privateKey = privateKey.replace(/\\n/g, '\n')

      // 2. Ensure it's a valid PEM format
      if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      } else {
        if (!isBuildPhase) {
          console.warn('[Firebase] Key is present but missing PEM headers. Skipping.')
        }
      }
    } else {
      if (!isBuildPhase) {
        console.warn('[Firebase] Credentials missing. Skipping initialization.')
      }
    }
  }

  if (admin.apps.length) {
    messaging = admin.messaging()
  }
} catch (error) {
  // Silent during build phase, log as error otherwise
  if (!isBuildPhase) {
    console.error('[Firebase] Error during initialization:', error)
  }
}

// Provide a safe "null-object" for fcm to prevent crashes if code tries to use it during build/uninitialized state
const mockMessaging = {
  send: () => Promise.resolve('mock-message-id'),
  sendEach: () => Promise.resolve({ successCount: 0, failureCount: 0, responses: [] }),
  sendEachForMulticast: () => Promise.resolve({ successCount: 0, failureCount: 0, responses: [] }),
  sendToDevice: () => Promise.resolve({ successCount: 0, failureCount: 0, results: [] }),
  sendToTopic: () => Promise.resolve({ messageId: 0 }),
  sendToCondition: () => Promise.resolve({ messageId: 0 }),
} as unknown as admin.messaging.Messaging

export const fcm = messaging || mockMessaging
