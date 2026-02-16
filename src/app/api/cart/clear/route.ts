import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Helper to get the authenticated user and Payload instance
 */
async function getAuthContext() {
    try {
        const cookieStore = await cookies()
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const headers = new Headers()
        cookieStore.getAll().forEach(cookie => {
            headers.append('cookie', `${cookie.name}=${cookie.value}`)
        })

        const { user } = await payload.auth({ headers })
        return { user, payload }
    } catch (error) {
        return { user: null, payload: null }
    }
}

/**
 * POST /api/cart/clear
 * Clears all items in the authenticated user's cart
 */
export async function POST(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()

        if (!user || !payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const carts = await payload.find({
            collection: 'web-cart',
            where: {
                user: { equals: user.id },
            },
            limit: 1,
        })

        if (carts.docs[0]) {
            await payload.update({
                collection: 'web-cart',
                id: carts.docs[0].id,
                data: { items: [] },
            })
        }

        return NextResponse.json({ success: true, items: [] })
    } catch (error: any) {
        console.error('Clear Cart Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to clear cart' }, { status: 500 })
    }
}
