import { PayloadHandler } from 'payload'

// ─── Address validation ──────────────────────────────────────────────────────

const VALID_EMIRATES = [
    'abu_dhabi', 'dubai', 'sharjah', 'ajman',
    'umm_al_quwain', 'ras_al_khaimah', 'fujairah',
] as const

type AddressFields = {
    label?: unknown
    addressFirstName?: unknown
    addressLastName?: unknown
    street?: unknown
    apartment?: unknown
    city?: unknown
    emirates?: unknown
    phoneNumber?: unknown
    isDefaultAddress?: unknown
}

/**
 * Validates address fields.
 * @param data        - The incoming body (or partial body for PATCH).
 * @param fullCheck   - When true, all required fields must be present.
 * @returns           - An error message string, or null if valid.
 */
function validateAddressFields(data: Record<string, unknown>, fullCheck: boolean): string | null {
    const requiredStrings: Array<keyof AddressFields> = [
        'addressFirstName', 'addressLastName', 'street', 'city', 'emirates', 'phoneNumber',
    ]

    for (const field of requiredStrings) {
        const val = data[field]

        // On full check (POST) the field must exist
        if (fullCheck && (val === undefined || val === null)) {
            return `"${field}" is required.`
        }

        // If the field is present, it must be a non-empty string
        if (val !== undefined && val !== null) {
            if (typeof val !== 'string' || val.trim() === '') {
                return `"${field}" must be a non-empty string.`
            }
        }
    }

    // Validate emirates value if provided
    if (data.emirates !== undefined && data.emirates !== null) {
        if (!VALID_EMIRATES.includes(data.emirates as any)) {
            return `"emirates" must be one of: ${VALID_EMIRATES.join(', ')}.`
        }
    }

    // isDefaultAddress must be boolean if present
    if (data.isDefaultAddress !== undefined && data.isDefaultAddress !== null) {
        if (typeof data.isDefaultAddress !== 'boolean') {
            return '"isDefaultAddress" must be true or false.'
        }
    }

    return null
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

async function getAuth(req: Parameters<PayloadHandler>[0]) {
    if (!req.user) return null
    const role = (req.user as any).role as string | undefined
    return {
        userId: Number(req.user.id),
        isAdmin: role === 'super-admin' || role === 'admin',
    }
}

function unauthorized() {
    return Response.json(
        { success: false, errors: [{ message: 'You must be logged in.' }] },
        { status: 401 }
    )
}

function forbidden() {
    return Response.json(
        { success: false, errors: [{ message: 'You are not allowed to modify this profile.' }] },
        { status: 403 }
    )
}

function invalidUserId() {
    return Response.json(
        { success: false, errors: [{ message: 'Invalid user ID.' }] },
        { status: 400 }
    )
}

// ─── GET /:id/addresses ──────────────────────────────────────────────────────
// Returns the address list of the target user.
export const getAddresses: PayloadHandler = async (req) => {
    const { payload } = req

    const auth = await getAuth(req)
    if (!auth) return unauthorized()

    const targetId = Number(req.routeParams?.id)
    if (!targetId || isNaN(targetId)) return invalidUserId()

    if (!auth.isAdmin && auth.userId !== targetId) return forbidden()

    try {
        const user = await payload.findByID({
            collection: 'users',
            id: targetId,
            overrideAccess: true,
            depth: 0,
        })

        return Response.json(
            { success: true, addresses: user.addresses ?? [] },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('[getAddresses] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}

// ─── POST /:id/addresses ─────────────────────────────────────────────────────
// Appends a new address to the user's address list (max 5).
export const addAddress: PayloadHandler = async (req) => {
    const { payload } = req

    const auth = await getAuth(req)
    if (!auth) return unauthorized()

    const targetId = Number(req.routeParams?.id)
    if (!targetId || isNaN(targetId)) return invalidUserId()

    if (!auth.isAdmin && auth.userId !== targetId) return forbidden()

    try {
        if (!req.json) {
            return Response.json(
                { success: false, errors: [{ message: 'Request body is required.' }] },
                { status: 400 }
            )
        }

        const newAddress = await req.json() as Record<string, unknown>

        const currentUser = await payload.findByID({
            collection: 'users',
            id: targetId,
            overrideAccess: true,
            depth: 0,
        })

        const existingAddresses: any[] = Array.isArray(currentUser.addresses)
            ? [...currentUser.addresses]
            : []

        if (existingAddresses.length >= 5) {
            return Response.json(
                { success: false, errors: [{ message: 'Maximum of 5 addresses allowed.' }] },
                { status: 400 }
            )
        }

        const validationError = validateAddressFields(newAddress, true)
        if (validationError) {
            return Response.json(
                { success: false, errors: [{ message: validationError }] },
                { status: 400 }
            )
        }

        existingAddresses.push(newAddress)

        const updatedUser = await payload.update({
            collection: 'users',
            id: targetId,
            data: { addresses: existingAddresses },
            overrideAccess: true,
            depth: 1,
        })

        return Response.json(
            { success: true, message: 'Address added.', doc: updatedUser },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('[addAddress] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}

// ─── PATCH /:id/addresses ────────────────────────────────────────────────────
// Updates a specific address by its `addressId` in the body.
export const updateAddress: PayloadHandler = async (req) => {
    const { payload } = req

    const auth = await getAuth(req)
    if (!auth) return unauthorized()

    const targetId = Number(req.routeParams?.id)
    if (!targetId || isNaN(targetId)) return invalidUserId()

    if (!auth.isAdmin && auth.userId !== targetId) return forbidden()

    try {
        if (!req.json) {
            return Response.json(
                { success: false, errors: [{ message: 'Request body is required.' }] },
                { status: 400 }
            )
        }

        const body = await req.json() as Record<string, unknown>

        if (!body.addressId) {
            return Response.json(
                { success: false, errors: [{ message: 'addressId is required to update an address.' }] },
                { status: 400 }
            )
        }

        const currentUser = await payload.findByID({
            collection: 'users',
            id: targetId,
            overrideAccess: true,
            depth: 0,
        })

        const existingAddresses: any[] = Array.isArray(currentUser.addresses)
            ? [...currentUser.addresses]
            : []

        const matchIndex = existingAddresses.findIndex(
            (a: any) => String(a.id) === String(body.addressId)
        )

        if (matchIndex === -1) {
            return Response.json(
                { success: false, errors: [{ message: `Address with id "${body.addressId}" not found.` }] },
                { status: 404 }
            )
        }

        // Merge patch fields into the existing address (exclude the helper addressId key)
        const { addressId, ...fields } = body

        const validationError = validateAddressFields(fields, false)
        if (validationError) {
            return Response.json(
                { success: false, errors: [{ message: validationError }] },
                { status: 400 }
            )
        }

        existingAddresses[matchIndex] = {
            ...existingAddresses[matchIndex],
            ...fields,
        }

        const updatedUser = await payload.update({
            collection: 'users',
            id: targetId,
            data: { addresses: existingAddresses },
            overrideAccess: true,
            depth: 1,
        })

        return Response.json(
            { success: true, message: 'Address updated.', doc: updatedUser },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('[updateAddress] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}

// ─── DELETE /:id/addresses ───────────────────────────────────────────────────
// Removes a specific address by its `addressId` in the body.
// addressId is REQUIRED — will never silently delete the whole account.
export const deleteAddress: PayloadHandler = async (req) => {
    const { payload } = req

    const auth = await getAuth(req)
    if (!auth) return unauthorized()

    const targetId = Number(req.routeParams?.id)
    if (!targetId || isNaN(targetId)) return invalidUserId()

    if (!auth.isAdmin && auth.userId !== targetId) return forbidden()

    try {
        let body: { addressId?: string } = {}
        try {
            if (req.json) body = await req.json() as { addressId?: string }
        } catch { /* ignore parse errors */ }

        if (!body?.addressId) {
            return Response.json(
                { success: false, errors: [{ message: 'addressId is required to delete an address.' }] },
                { status: 400 }
            )
        }

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
    } catch (error: any) {
        console.error('[deleteAddress] Error:', error)
        return Response.json(
            { success: false, errors: [{ message: error?.message || 'Something went wrong.' }] },
            { status: 500 }
        )
    }
}
