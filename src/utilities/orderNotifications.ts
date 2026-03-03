import { BasePayload } from "payload";

/**
 * Creates or appends a notification for a user when an order is paid.
 */
export const createOrderPaidNotification = async (
    payload: BasePayload,
    userId: string | number,
    orderId: string | number,
    origin: 'cafe' | 'store'
) => {
    try {
        const title = "Order Paid Successfully";
        const description = `Your order #${orderId} has been paid.`;
        const notificationType = "order";

        // Check if a notification record already exists for this user
        const existingNotifications = await payload.find({
            collection: 'notifications',
            where: {
                user: {
                    equals: userId,
                },
            },
            depth: 0,
        });

        if (existingNotifications.docs.length > 0) {
            const doc = existingNotifications.docs[0];
            await payload.update({
                collection: 'notifications',
                id: doc.id,
                data: {
                    notifications: [
                        ...(doc.notifications || []),
                        {
                            title,
                            description,
                            origin,
                            notificationType,
                        },
                    ],
                },
            });
            console.log(`[Notification] Appended paid notification for user ${userId}, order ${orderId}`);
        } else {
            await payload.create({
                collection: 'notifications',
                data: {
                    user: userId,
                    notificationEnabled: true,
                    notifications: [
                        {
                            title,
                            description,
                            origin,
                            notificationType,
                        },
                    ],
                } as any,
            });
            console.log(`[Notification] Created new notification record for user ${userId}, order ${orderId}`);
        }
    } catch (error) {
        console.error(`[Notification Error] Failed to create notification for user ${userId}:`, error);
    }
};
