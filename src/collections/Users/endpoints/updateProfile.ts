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

        // ── 5. Strip any disallowed fields (non-admins only) ──────────────────
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

        // ── 6. Smart address merge ─────────────────────────────────────────────
        // If the body contains exactly ONE address, merge it with the user's
        // existing addresses instead of replacing them all.
        //   - Address has an `id`  → update that specific address in place
        //   - Address has no `id`  → append as a new address
        //   - Multiple addresses   → replace the whole array (intended bulk update)
        if (Array.isArray(dataToUpdate.addresses) && dataToUpdate.addresses.length === 1) {
            const incomingAddress = dataToUpdate.addresses[0] as Record<string, unknown>

            // Fetch current user to get existing addresses
            const currentUser = await payload.findByID({
                collection: 'users',
                id: targetId,
                overrideAccess: true,
                depth: 0,
            })

            const existingAddresses: any[] = Array.isArray(currentUser.addresses)
                ? [...currentUser.addresses]
                : []

            if (incomingAddress.id) {
                // Update the matching existing address in place
                const matchIndex = existingAddresses.findIndex(
                    (a: any) => String(a.id) === String(incomingAddress.id)
                )

                if (matchIndex === -1) {
                    return Response.json(
                        { success: false, errors: [{ message: `Address with id "${incomingAddress.id}" not found.` }] },
                        { status: 404 }
                    )
                }

                existingAddresses[matchIndex] = {
                    ...existingAddresses[matchIndex],
                    ...incomingAddress,
                }
            } else {
                // Append as a brand-new address
                if (existingAddresses.length >= 5) {
                    return Response.json(
                        { success: false, errors: [{ message: 'Maximum of 5 addresses allowed.' }] },
                        { status: 400 }
                    )
                }
                existingAddresses.push(incomingAddress)
            }

            dataToUpdate.addresses = existingAddresses
        }

        // ── 7. Perform the update via local API ───────────────────────────────
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
