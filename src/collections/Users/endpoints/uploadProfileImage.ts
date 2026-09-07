import { PayloadHandler } from 'payload'
import { NextResponse } from 'next/server'

export const uploadProfileImage: PayloadHandler = async (req) => {
    const { payload, user } = req

    // Auth check: User must be logged in
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized. Please login to upload a profile image.' }, { status: 401 })
    }

    const userId = user.id

    try {
        const body = await req.json?.()
        if (!body) {
            return NextResponse.json({ error: 'Missing JSON body' }, { status: 400 })
        }
        const { base64, filename } = body

        if (!base64) {
            return NextResponse.json({ error: 'Missing base64 image data' }, { status: 400 })
        }

        // --- PARSE BASE64 ---
        const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        let mimetype: string
        let buffer: Buffer

        if (matches && matches.length === 3) {
            mimetype = matches[1]
            buffer = Buffer.from(matches[2], 'base64')
        } else {
            buffer = Buffer.from(base64, 'base64')
            mimetype = body.mimetype || 'image/jpeg'
        }

        // --- VALIDATIONS ---
        const MAX_SIZE = 1 * 1024 * 1024
        if (buffer.length > MAX_SIZE) {
            return NextResponse.json({ error: 'Image size exceeds 1MB limit' }, { status: 400 })
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!ALLOWED_TYPES.includes(mimetype)) {
            return NextResponse.json({ error: `Invalid file type: ${mimetype}. Only JPG, PNG, and WebP are allowed.` }, { status: 400 })
        }

        // --- PROCESSING ---

        // 0. Look up the current image so we can delete it after the swap —
        // previously the old file was just left behind in storage forever.
        const existingUser = await payload.findByID({
            collection: 'users',
            id: userId,
            depth: 0,
            overrideAccess: true,
        }).catch(() => null)
        const oldImageId = existingUser
            ? (typeof existingUser.profileImage === 'object' ? existingUser.profileImage?.id : existingUser.profileImage)
            : null

        // 1. Create Media record
        const mediaDoc = await payload.create({
            collection: 'media',
            data: {
                alt: `Profile image for user ${userId}`,
            },
            file: {
                data: buffer,
                mimetype: mimetype,
                name: filename || `profile-${userId}-${Date.now()}.${mimetype.split('/')[1] || 'jpg'}`,
                size: buffer.length,
            },
            overrideAccess: true,
        })

        // 2. Update User record
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                profileImage: mediaDoc.id,
            },
            overrideAccess: true,
        })

        // 3. Delete the old image now that the new one is safely in place
        if (oldImageId && String(oldImageId) !== String(mediaDoc.id)) {
            await payload.delete({
                collection: 'media',
                id: oldImageId,
                overrideAccess: true,
            }).catch((err) => {
                console.error(`Failed to delete old profile image ${oldImageId} for user ${userId}:`, err)
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Profile image updated successfully',
            media: mediaDoc,
        })

    } catch (error: any) {
        console.error('Error in uploadProfileImage endpoint:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 })
    }
}
