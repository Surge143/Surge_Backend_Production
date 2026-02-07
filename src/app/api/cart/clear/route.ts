import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

async function getUserFromCookie() {
    try {
        const cookieStore = await cookies()
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        // Convert cookies to Headers for Payload auth
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

export async function POST(request: NextRequest) {
    try {
        const { user, payload } = await getUserFromCookie()

        if (user && payload) {
            // Clear WebCart collection
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
        }

        // Clear guest cart cookie
        const res = NextResponse.json({ success: true })
        res.cookies.delete('guest_id')
        return res
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
    }
}
