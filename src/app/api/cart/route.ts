import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Guest cart storage (in-memory for demo - in production use Redis or database)
const guestCarts = new Map<string, any[]>()

async function getGuestId(request: NextRequest): Promise<string> {
    const cookieStore = await cookies()
    let guestId = cookieStore.get('guest_id')?.value

    if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    return guestId
}

async function getUserFromCookie() {
    try {
        const cookieStore = await cookies()
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        // Get user from Payload auth - convert cookies to Headers
        const headers = new Headers()
        cookieStore.getAll().forEach(cookie => {
            headers.append('cookie', `${cookie.name}=${cookie.value}`)
        })

        const { user } = await payload.auth({ headers })
        return user
    } catch (error) {
        return null
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromCookie()

        if (user) {
            // Fetch cart from WebCart collection for logged-in user
            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })

            const carts = await payload.find({
                collection: 'web-cart',
                where: {
                    user: { equals: user.id },
                },
                limit: 1,
            })

            return NextResponse.json({ items: carts.docs[0]?.items || [] })
        }

        // Guest user - get cart from memory
        const guestId = await getGuestId(request)
        const items = guestCarts.get(guestId) || []

        const res = NextResponse.json({ items })
        res.cookies.set('guest_id', guestId, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        })
        return res
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json({ items: [] }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { product, vId, quantity, name, price, image, variantName } = body

        const user = await getUserFromCookie()

        if (user) {
            // Add to WebCart collection for logged-in user
            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })

            const carts = await payload.find({
                collection: 'web-cart',
                where: {
                    user: { equals: user.id },
                },
                limit: 1,
            })

            const cart = carts.docs[0]
            const items = cart?.items || []

            // Check if item already exists
            const existingIndex = items.findIndex(
                (item: any) => item.product === product && item.vId === vId
            )

            if (existingIndex >= 0) {
                items[existingIndex].quantity += quantity
            } else {
                items.push({ product, vId, quantity })
            }

            if (cart) {
                await payload.update({
                    collection: 'web-cart',
                    id: cart.id,
                    data: { items },
                })
            } else {
                await payload.create({
                    collection: 'web-cart',
                    data: {
                        user: user.id,
                        items,
                    },
                })
            }

            return NextResponse.json({ items })
        }

        // Guest user - add to memory cart
        const guestId = await getGuestId(request)
        const items = guestCarts.get(guestId) || []

        const existingIndex = items.findIndex(
            (item: any) => item.product === product && item.vId === vId
        )

        if (existingIndex >= 0) {
            items[existingIndex].quantity += quantity
        } else {
            items.push({ product, vId, quantity, name, price, image, variantName })
        }

        guestCarts.set(guestId, items)

        const res = NextResponse.json({ items })
        res.cookies.set('guest_id', guestId, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60,
        })
        return res
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { product, vId, quantity } = body

        const user = await getUserFromCookie()

        if (user) {
            // Update WebCart collection
            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })

            const carts = await payload.find({
                collection: 'web-cart',
                where: {
                    user: { equals: user.id },
                },
                limit: 1,
            })

            const cart = carts.docs[0]
            if (cart) {
                const items = cart.items || []
                const index = items.findIndex(
                    (item: any) => item.product === product && item.vId === vId
                )

                if (index >= 0) {
                    items[index].quantity = quantity
                    await payload.update({
                        collection: 'web-cart',
                        id: cart.id,
                        data: { items },
                    })
                }

                return NextResponse.json({ items })
            }
        }

        // Guest user - update memory cart
        const guestId = await getGuestId(request)
        const items = guestCarts.get(guestId) || []

        const index = items.findIndex(
            (item: any) => item.product === product && item.vId === vId
        )

        if (index >= 0) {
            items[index].quantity = quantity
            guestCarts.set(guestId, items)
        }

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Error updating cart:', error)
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { product, vId } = body

        const user = await getUserFromCookie()

        if (user) {
            // Remove from WebCart collection
            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })

            const carts = await payload.find({
                collection: 'web-cart',
                where: {
                    user: { equals: user.id },
                },
                limit: 1,
            })

            const cart = carts.docs[0]
            if (cart) {
                const items = (cart.items || []).filter(
                    (item: any) => !(item.product === product && item.vId === vId)
                )

                await payload.update({
                    collection: 'web-cart',
                    id: cart.id,
                    data: { items },
                })

                return NextResponse.json({ items })
            }
        }

        // Guest user - remove from memory cart
        const guestId = await getGuestId(request)
        let items = guestCarts.get(guestId) || []

        items = items.filter(
            (item: any) => !(item.product === product && item.vId === vId)
        )

        guestCarts.set(guestId, items)

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Error removing from cart:', error)
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }
}
