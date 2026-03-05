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

        if (!req.json) {
            return NextResponse.json({ error: 'No JSON data found' }, { status: 400 })
        }

        const body = await req.json()
        const { base64, filename } = body

        if (!base64) {
            return NextResponse.json({ error: 'Missing base64 image data' }, { status: 400 })
        }

        // --- PARSE BASE64 ---
        // Handle both: "data:image/png;base64,iVBOR..." AND "iVBOR..."
        const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        let mimetype: string
        let buffer: Buffer

        if (matches && matches.length === 3) {
            mimetype = matches[1]
            buffer = Buffer.from(matches[2], 'base64')
        } else {
            // Assume it's raw base64 and try to guess mimetype or require it
            buffer = Buffer.from(base64, 'base64')
            // Default to jpeg if not specified/detectable, or we can check header bytes
            mimetype = body.mimetype || 'image/jpeg'
        }

        // --- VALIDATIONS ---

        // 1. Size check: 100KB max (on raw buffer size, not base64 size)
        const MAX_SIZE = 100 * 1024 // 100KB in bytes
        if (buffer.length > MAX_SIZE) {
            return NextResponse.json({ error: 'Image size exceeds 100KB limit' }, { status: 400 })
        }

        // 2. Type check: JPG, PNG, WebP
        const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!ALLOWED_TYPES.includes(mimetype)) {
            return NextResponse.json({ error: `Invalid file type: ${mimetype}. Only JPG, PNG, and WebP are allowed.` }, { status: 400 })
        }

        // --- PROCESSING ---

        // 1. Create Media record
        const mediaDoc = await payload.create({
            collection: 'media',
            data: {
                alt: `Profile image for user ${userId}`,
            },
            file: {
                data: buffer,
                mimetype: mimetype,
                name: filename || `profile-${userId}-${Date.now()}.${mimetype.split('/')[1]}`,
                size: buffer.length,
            },
        })

        // 2. Update User record
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                profileImage: mediaDoc.id,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Profile image updated successfully',
            media: mediaDoc,
        })

    } catch (error: any) {
        console.error('Error uploading profile image:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
