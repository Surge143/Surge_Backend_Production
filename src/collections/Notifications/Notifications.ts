import type { CollectionConfig, CollectionBeforeChangeHook } from "payload";

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
        hidden: ({ user }: any) => user?.role !== 'super-admin',
    },
    access: {
        // Was previously wide open — read: ()=>true let anyone (even logged
        // out) read every user's notification history, and create/update/
        // delete only checked "is someone logged in", letting any user write
        // to, or delete, another user's notifications. Local API calls (e.g.
        // any internal code creating a notification on a user's behalf) use
        // overrideAccess and are unaffected by any of this.
        read: ({ req: { user } }) => {
            if (!user) return false
            if (user.role === 'super-admin' || user.role === 'admin') return true
            return { user: { equals: user.id } } as any
        },
        create: ({ req: { user }, data }) => {
            if (!user) return false
            if (user.role === 'super-admin' || user.role === 'admin') return true
            // Must be creating/appending to your OWN notification record —
            // otherwise a crafted request could inject notifications into
            // someone else's account via the beforeChange merge-on-duplicate
            // hook below.
            return !data || String((data as any).user) === String(user.id)
        },
        update: ({ req: { user } }) => {
            if (!user) return false
            if (user.role === 'super-admin' || user.role === 'admin') return true
            return { user: { equals: user.id } } as any
        },
        delete: ({ req: { user } }) => {
            if (!user) return false
            return user.role === 'super-admin' || user.role === 'admin'
        },
    },
    hooks: {
        beforeChange: [beforeChangeHook],
    },
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
