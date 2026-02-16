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
 * Maps raw backend cart items (with depth: 2) to flat frontend CartItem structure
 */
function mapCartItems(items: any[]) {
    return items.map((item: any) => {
        const product = item.product
        if (typeof product !== 'object') return item

        let name = product.name
        let price = product.salePrice || product.regularPrice
        let image = product.productImage?.url || ''
        let variantName = ''

        if (item.vId && product.variants) {
            const variant = product.variants.find((v: any) => v.id === item.vId)
            if (variant) {
                name = product.name // Keep product name as base
                variantName = variant.variantName
                price = variant.variantSalePrice || variant.variantRegularPrice
                image = variant.variantImage?.url || image
            }
        }

        return {
            product: product.id,
            vId: item.vId || '',
            name,
            price,
            image,
            variantName,
            quantity: item.quantity,
        }
    })
}

/**
 * GET /api/cart
 * Returns the items in the authenticated user's cart
 */
export async function GET() {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 2,
        })

        const items = carts.docs[0]?.items || []
        return NextResponse.json({ items: mapCartItems(items) })
    } catch (error: any) {
        console.error('Cart GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * POST /api/cart
 * Adds or increments an item in the cart
 */
export async function POST(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const product = Number(body.product)
        const vId = body.vId
        const quantity = Number(body.quantity || 1)

        if (isNaN(product)) return NextResponse.json({ error: 'Valid Product ID is required' }, { status: 400 })

        // console.log(`DEBUG: Cart Lookup for User ID: ${user.id} (${typeof user.id})`);

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
        })

        // console.log(`DEBUG: Cart Find Result: ${carts.docs.length} found`);

        let cart = carts.docs[0]
        let items: any[] = cart?.items || []

        const existingIndex = items.findIndex(
            (item: any) => (typeof item.product === 'object' ? item.product.id : item.product) === product && item.vId === (vId || '')
        )

        if (existingIndex >= 0) {
            if (items[existingIndex].quantity + quantity > 5) {
                return NextResponse.json({ error: 'Maximum quantity of 5 units reached for this item' }, { status: 400 })
            }
            items[existingIndex].quantity += quantity
        } else {
            if (quantity > 5) {
                return NextResponse.json({ error: 'Maximum quantity of 5 units reached for this item' }, { status: 400 })
            }
            items.push({ product, vId: vId || '', quantity })
        }

        let updatedCart
        if (cart) {
            updatedCart = await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 2,
            })
        } else {
            // Second safety check: search by user ID again just in case, but using payload.find with more breadth
            // Or explicitly handle unique constraint error if create fails
            try {
                updatedCart = await payload.create({
                    collection: 'web-cart',
                    data: { user: user.id, items },
                    depth: 2,
                })
            } catch (err: any) {
                // If it's a unique constraint violation, try to find and update instead
                if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
                    const retryCarts = await payload.find({
                        collection: 'web-cart',
                        where: { user: { equals: user.id } },
                        limit: 1,
                    })
                    if (retryCarts.docs[0]) {
                        updatedCart = await payload.update({
                            collection: 'web-cart',
                            id: retryCarts.docs[0].id,
                            data: { items },
                            depth: 2,
                        })
                    } else {
                        throw err // Re-throw if retry also fails to find it
                    }
                } else {
                    throw err
                }
            }
        }

        return NextResponse.json({ items: mapCartItems(updatedCart.items || []) })
    } catch (error: any) {
        console.error('Cart POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * PATCH /api/cart
 * Updates quantity (can be absolute or relative increment/decrement)
 */
export async function PATCH(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { product: rawProduct, vId, quantity, action } = await request.json()
        const product = Number(rawProduct)

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 })

        const items: any[] = cart.items || []
        const index = items.findIndex(
            (item: any) => (typeof item.product === 'object' ? item.product.id : item.product) === product && item.vId === (vId || '')
        )

        if (index >= 0) {
            if (action === 'increment') {
                if (items[index].quantity >= 5) {
                    return NextResponse.json({ error: 'Maximum quantity of 5 units reached' }, { status: 400 })
                }
                items[index].quantity += 1
            } else if (action === 'decrement') {
                items[index].quantity = Math.max(1, items[index].quantity - 1)
            } else if (typeof quantity === 'number') {
                if (quantity > 5) {
                    return NextResponse.json({ error: 'Maximum quantity of 5 units is allowed' }, { status: 400 })
                }
                items[index].quantity = Math.max(1, quantity)
            }

            const updatedCart = await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 2,
            })

            return NextResponse.json({ items: mapCartItems(updatedCart.items || []) })
        }

        return NextResponse.json({ items: [] })
    } catch (error: any) {
        console.error('Cart PATCH Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * DELETE /api/cart
 * Removes a specific item from the cart
 */
export async function DELETE(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { product: rawProduct, vId } = await request.json()
        const product = Number(rawProduct)

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
        })

        const cart = carts.docs[0]
        if (cart) {
            const items = (cart.items || []).filter(
                (item: any) => !((typeof item.product === 'object' ? item.product.id : item.product) === product && item.vId === (vId || ''))
            )

            const updatedCart = await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 2,
            })

            return NextResponse.json({ items: mapCartItems(updatedCart.items || []) })
        }

        return NextResponse.json({ items: [] })
    } catch (error: any) {
        console.error('Cart DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
