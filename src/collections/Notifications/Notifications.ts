import type { CollectionConfig, CollectionBeforeChangeHook } from "payload";
import { getMyNotifications } from './endpoints/getMyNotifications';

const beforeChangeHook: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    if (operation === 'create') {
        const existing = await req.payload.find({
            collection: 'notifications',
            where: {
                user: {
                    equals: data.user,
                },
            },
        });

        if (existing.docs.length > 0) {
            const doc: any = existing.docs[0];
            await req.payload.update({
                collection: 'notifications',
                id: doc.id,
                data: {
                    notifications: [
                        ...(doc.notifications || []),
                        ...(data.notifications || []),
                    ],
                },
            });
            throw new Error('Notification added to existing user record.');
        }
    }
    return data;
};

export const Notifications: CollectionConfig = {
    slug: "notifications",
    labels: {
        singular: 'Notification',
        plural: 'Notifications',
    },
    admin: {
    },
    access: {
        read: () => true,
        create: ({ req: { user } }) => !!user,
        update: ({ req: { user } }) => !!user,
        delete: ({ req: { user } }) => !!user,
    },
    hooks: {
        beforeChange: [beforeChangeHook],
    },
    endpoints: [
        {
            path: '/',
            method: 'get',
            handler: getMyNotifications,
        },
    ],
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true,
            admin: {
                // readOnly: true,
            },
        },
        {
            name: 'notificationEnabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                // readOnly: true,
            },
        },
        {
            name: 'notifications',
            type: 'array',
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: true,
                },
                {
                    name: "description",
                    type: "text",
                    required: true,
                },
                {
                    name: 'origin',
                    type: 'select',
                    required: true,
                    options: [
                        {
                            label: 'Cafe',
                            value: 'cafe',
                        },
                        {
                            label: 'Store',
                            value: 'store',
                        },
                    ],
                },
                {
                    name: 'notificationType',
                    type: 'select',
                    required: true,
                    options: [
                        {
                            label: 'General',
                            value: 'general',
                        },
                        {
                            label: 'Order',
                            value: 'order',
                        },
                        {
                            label: 'Reward',
                            value: 'reward',
                        }
                    ],
                }
            ],
        },
    ],
    timestamps: true
}
