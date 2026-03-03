import { PayloadHandler } from 'payload'

export const getMyNotifications: PayloadHandler = async (req) => {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        if (!req.user) {
            return Response.json(
                { success: false, errors: [{ message: 'You must be logged in.' }] },
                { status: 401 }
            )
        }

        const userId = req.user.id

        // ── Fetch notifications for this user ─────────────────────────────────
        const result = await req.payload.find({
            collection: 'notifications',
            where: { user: { equals: userId } },
            depth: 0,
            limit: 1,
            overrideAccess: true,
        })

        if (result.docs.length === 0) {
            return Response.json(
                { success: true, doc: null, notifications: [] },
                { status: 200 }
            )
        }

        const doc = result.docs[0]

        return Response.json(
            {
                success: true,
                doc,
                notifications: doc.notifications || [],
                notificationEnabled: doc.notificationEnabled,
            },
            { status: 200 }
        )

    } catch (error: any) {
        console.error('[getMyNotifications] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}
