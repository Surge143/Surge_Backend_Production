import { PayloadHandler } from 'payload'

export const deleteAddress: PayloadHandler = async (req) => {
    const { payload } = req

    try {
        // ── 1. Auth check ──────────────────────────────────────────────────────
        if (!req.user) {
            return Response.json(
                { success: false, errors: [{ message: 'You must be logged in.' }] },
                { status: 401 }
            )
        }

        // ── 2. Parse route param ───────────────────────────────────────────────
        const targetId = Number(req.routeParams?.id)
        if (!targetId || isNaN(targetId)) {
            return Response.json(
                { success: false, errors: [{ message: 'Invalid user ID.' }] },
                { status: 400 }
            )
        }

        // ── 3. Authorization ───────────────────────────────────────────────────
        const requestingUserId = Number(req.user.id)
        const requestingUserRole = (req.user as any).role as string | undefined
        const isAdmin = requestingUserRole === 'super-admin' || requestingUserRole === 'admin'

        if (!isAdmin && requestingUserId !== targetId) {
            return Response.json(
                { success: false, errors: [{ message: 'You are not allowed to modify this profile.' }] },
                { status: 403 }
            )
        }

        // ── 4. Parse body ──────────────────────────────────────────────────────
        let body: { addressId?: string } = {}
        try {
            if (req.json) {
                body = await req.json() as { addressId?: string }
            }
        } catch {
            // Empty body is fine — means full account deletion
        }

        // ── 5a. DELETE ADDRESS — if addressId is provided ─────────────────────
        if (body?.addressId) {
            const currentUser = await payload.findByID({
                collection: 'users',
                id: targetId,
                overrideAccess: true,
                depth: 0,
            })

            const existingAddresses: any[] = Array.isArray(currentUser.addresses)
                ? currentUser.addresses
                : []

            const filteredAddresses = existingAddresses.filter(
                (a: any) => String(a.id) !== String(body.addressId)
            )

            if (filteredAddresses.length === existingAddresses.length) {
                return Response.json(
                    { success: false, errors: [{ message: `Address with id "${body.addressId}" not found.` }] },
                    { status: 404 }
                )
            }

            const updatedUser = await payload.update({
                collection: 'users',
                id: targetId,
                data: { addresses: filteredAddresses },
                overrideAccess: true,
                depth: 1,
            })

            return Response.json(
                { success: true, message: 'Address deleted.', doc: updatedUser },
                { status: 200 }
            )
        }

        // ── 5b. DELETE ACCOUNT — no addressId, delete the whole user ──────────
        await payload.delete({
            collection: 'users',
            id: targetId,
            overrideAccess: true,
        })

        return Response.json(
            { success: true, message: 'Account deleted successfully.' },
            { status: 200 }
        )

    } catch (error: any) {
        console.error('[deleteAddress] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}
