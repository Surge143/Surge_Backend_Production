import { PayloadHandler } from 'payload'

// Allowed fields that a user can update on their own profile
const ALLOWED_FIELDS = [
    'firstName',
    'lastName',
    'phone',
    'gender',
    'addresses',
    'profileImage',
    'pushToken',
    'referralCodeInput',
]

export const updateProfile: PayloadHandler = async (req) => {
    const { payload } = req

    try {
        // ── 1. Auth check ─────────────────────────────────────────────────────
        if (!req.user) {
            return Response.json(
                { success: false, errors: [{ message: 'You must be logged in.' }] },
                { status: 401 }
            )
        }

        // ── 2. Parse route param ──────────────────────────────────────────────
        const targetId = Number(req.routeParams?.id)
        if (!targetId || isNaN(targetId)) {
            return Response.json(
                { success: false, errors: [{ message: 'Invalid user ID.' }] },
                { status: 400 }
            )
        }

        // ── 3. Authorization: user can only update their own profile ──────────
        const requestingUserId = Number(req.user.id)
        const requestingUserRole = (req.user as any).role as string | undefined

        const isAdmin = requestingUserRole === 'super-admin' || requestingUserRole === 'admin'

        if (!isAdmin && requestingUserId !== targetId) {
            return Response.json(
                { success: false, errors: [{ message: 'You are not allowed to update this profile.' }] },
                { status: 403 }
            )
        }

        // ── 4. Parse body ─────────────────────────────────────────────────────
        if (!req.json) {
            return Response.json(
                { success: false, errors: [{ message: 'Invalid request body.' }] },
                { status: 400 }
            )
        }

        const body = await req.json() as Record<string, unknown>

        // ── 5. Strip any disallowed fields (non-admins only) ───────────────────
        let dataToUpdate: Record<string, unknown>
        if (isAdmin) {
            dataToUpdate = body
        } else {
            dataToUpdate = Object.fromEntries(
                Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
            )
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return Response.json(
                { success: false, errors: [{ message: 'No valid fields to update.' }] },
                { status: 400 }
            )
        }

        // ── 6. Perform the update via local API (overrideAccess bypasses the ──
        //       broken built-in PATCH pipeline for the users collection)  ──────
        const updatedUser = await payload.update({
            collection: 'users',
            id: targetId,
            data: dataToUpdate as any,
            overrideAccess: true,
            depth: 1,
        })

        return Response.json(
            { success: true, doc: updatedUser },
            { status: 200 }
        )

    } catch (error: any) {
        console.error('[updateProfile] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}
