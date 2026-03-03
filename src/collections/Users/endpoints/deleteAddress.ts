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
        if (!req.json) {
            return Response.json(
                { success: false, errors: [{ message: 'Invalid request body.' }] },
                { status: 400 }
            )
        }

        const body = await req.json() as { addressId?: string }
        const { addressId } = body

        if (!addressId) {
            return Response.json(
                { success: false, errors: [{ message: 'addressId is required.' }] },
                { status: 400 }
            )
        }

        // ── 5. Fetch current user ──────────────────────────────────────────────
        const currentUser = await payload.findByID({
            collection: 'users',
            id: targetId,
            overrideAccess: true,
            depth: 0,
        })

        const existingAddresses: any[] = Array.isArray(currentUser.addresses)
            ? currentUser.addresses
            : []

        // ── 6. Filter out the address to delete ────────────────────────────────
        const filteredAddresses = existingAddresses.filter(
            (a: any) => String(a.id) !== String(addressId)
        )

        if (filteredAddresses.length === existingAddresses.length) {
            return Response.json(
                { success: false, errors: [{ message: `Address with id "${addressId}" not found.` }] },
                { status: 404 }
            )
        }

        // ── 7. Save the updated addresses ─────────────────────────────────────
        const updatedUser = await payload.update({
            collection: 'users',
            id: targetId,
            data: { addresses: filteredAddresses },
            overrideAccess: true,
            depth: 1,
        })

        return Response.json(
            { success: true, doc: updatedUser },
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
