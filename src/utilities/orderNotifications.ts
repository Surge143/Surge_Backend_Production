import { BasePayload } from 'payload'
import { sendNotification } from './sendNotification'

/** Order paid — called when order.paymentStatus first becomes 'paid' */
export const createOrderPaidNotification = async (
  payload: BasePayload,
  userId: string | number,
  orderId: string | number,
  origin: 'cafe' | 'store',
) => {
  await sendNotification({
    payload,
    userId,
    title: 'Order Paid Successfully',
    body: `Your order #${orderId} has been confirmed and is being prepared.`,
    notificationType: 'order',
    origin,
    data: { type: 'order_paid', orderId: String(orderId) },
  })
}

/** Order completed / ready for pickup */
export const createOrderCompletedNotification = async (
  payload: BasePayload,
  userId: string | number,
  orderId: string | number,
  origin: 'cafe' | 'store',
) => {
  await sendNotification({
    payload,
    userId,
    title: 'Order Ready! 🎉',
    body: `Your order #${orderId} is ready. Enjoy!`,
    notificationType: 'order',
    origin,
    data: { type: 'order_completed', orderId: String(orderId) },
  })
}

/** Stamps earned after order completion */
export const createStampEarnedNotification = async (
  payload: BasePayload,
  userId: string | number,
  stampsEarned: number,
  newTotal: number,
  rewardsAdded: number,
) => {
  const title = `+${stampsEarned} Stamp${stampsEarned > 1 ? 's' : ''} Earned!`
  const body =
    rewardsAdded > 0
      ? `You earned ${stampsEarned} stamp${stampsEarned > 1 ? 's' : ''} and unlocked ${rewardsAdded} free reward${rewardsAdded > 1 ? 's' : ''}! ☕`
      : `You now have ${newTotal} stamp${newTotal !== 1 ? 's' : ''}. Keep going!`

  await sendNotification({
    payload,
    userId,
    title,
    body,
    notificationType: rewardsAdded > 0 ? 'reward' : 'general',
    origin: 'cafe',
    data: {
      type: 'stamp_earned',
      stampsEarned: String(stampsEarned),
      newTotal: String(newTotal),
      rewardsAdded: String(rewardsAdded),
    },
  })
}
