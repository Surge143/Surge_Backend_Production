import { BasePayload } from 'payload'
import { fcm } from '@/lib/firebase'

export type NotificationType = 'order' | 'reward' | 'general'
export type NotificationOrigin = 'cafe' | 'store'

interface SendNotificationParams {
  payload: BasePayload
  userId: string | number
  title: string
  body: string
  notificationType: NotificationType
  origin?: NotificationOrigin
  data?: Record<string, string>
}

export const sendNotification = async ({
  payload,
  userId,
  title,
  body,
  notificationType,
  origin = 'cafe',
  data = {},
}: SendNotificationParams): Promise<void> => {
  // Run push + DB save in parallel — neither blocks the other
  await Promise.allSettled([
    _sendPush(payload, userId, title, body, data),
    _saveRecord(payload, userId, title, body, notificationType, origin),
  ])
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function _sendPush(
  payload: BasePayload,
  userId: string | number,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })

    const pushToken = (user as any).pushToken as string | undefined
    if (!pushToken) {
      console.log(`[sendNotification] No pushToken for user ${userId}, skipping FCM.`)
      return
    }

    await fcm.send({
      token: pushToken,
      notification: { title, body },
      data,
      android: {
        notification: { sound: 'default', priority: 'high' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    })

    console.log(`[sendNotification] FCM sent to user ${userId}: "${title}"`)
  } catch (err) {
    console.error(`[sendNotification] FCM failed for user ${userId}:`, err)
  }
}

async function _saveRecord(
  payload: BasePayload,
  userId: string | number,
  title: string,
  body: string,
  notificationType: NotificationType,
  origin: NotificationOrigin,
) {
  try {
    const existing = await payload.find({
      collection: 'notifications',
      where: { user: { equals: userId } },
      depth: 0,
      limit: 1,
    })

    const newEntry = { title, description: body, origin, notificationType }

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      await payload.update({
        collection: 'notifications',
        id: doc.id,
        data: {
          notifications: [...(doc.notifications || []), newEntry],
        },
      })
    } else {
      await payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          notificationEnabled: true,
          notifications: [newEntry],
        } as any,
      })
    }

    console.log(`[sendNotification] DB record saved for user ${userId}: "${title}"`)
  } catch (err) {
    console.error(`[sendNotification] DB save failed for user ${userId}:`, err)
  }
}
