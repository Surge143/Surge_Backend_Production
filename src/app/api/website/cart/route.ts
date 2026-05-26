import { NextRequest, NextResponse } from 'next/server'
import { headers as getNextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { normalizeHighlights } from '../../../../utilities/cartUtils'

export const dynamic = 'force-dynamic'

async function getAuthContext() {
    try {
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: await getNextHeaders() })
        return { user, payload }
    } catch (error) {
        return { user: null, payload: null }
    }
}

async function mapCartItems(payload: any, items: any[]) {
    if (!items || items.length === 0) return []

    const productIds = Array.from(
        new Set(
            items.map((item) => (typeof item.product === 'object' ? item.product.id : item.product))
        )
    )

    // No `select` — so that depth:1 can fully resolve productImage and variantImage media URLs
    const productsFetched = await payload.find({
        collection: 'web-products',
        where: { id: { in: productIds } },
        depth: 1,
        limit: 100,
    })

    const productMap = new Map(productsFetched.docs.map((p) => [String(p.id), p as any]))

    return items
        .map((item: any) => {
            const productId = typeof item.product === 'object' ? item.product.id : item.product
            const product: any = productMap.get(String(productId))

            if (!product) return null

            let price = product.salePrice || product.regularPrice

            // Resolve product image defensively — depth:1 returns an object with .url
            let image = ''
            if (typeof product.productImage === 'object' && product.productImage !== null) {
                image = product.productImage.url || ''
            }

            let displayName = product.name
            let variantName = ''

            if (item.vId && product.variants) {
                const variant = product.variants.find((v: any) => String(v.id) === String(item.vId))
                if (variant) {
                    price = variant.variantSalePrice || variant.variantRegularPrice
                    // Prefer variant image; fall back to product image if not set
                    if (typeof variant.variantImage === 'object' && variant.variantImage !== null) {
                        image = variant.variantImage.url || image
                    }
                    displayName = `${product.name}`
                    variantName = variant.variantName
                }
            }

            return {
                product: productId,
                vId: item.vId || '',
                name: displayName,
                tagline: product.tagline,
                price: price || 0,
                image,
                quantity: item.quantity,
                variantName: variantName,
                productHighlights: item.productHighlights || [],
            }
        })
        .filter(Boolean)
}

/**
 * Re-fetch the cart from DB and build a fresh, fully-resolved response.
 * Used after every mutation (POST/PATCH/DELETE) to guarantee images are always present.
 */
async function buildCartResponse(payload: any, userId: any) {
    const carts = await payload.find({
        collection: 'web-cart',
        where: { user: { equals: userId } },
        limit: 1,
        depth: 0,
        select: { items: true },
    })
    const rawItems = carts.docs[0]?.items || []
    const items = await mapCartItems(payload, rawItems)
    const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
    const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0)
    return { items, subtotal, totalItems }
}

export async function GET(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        return NextResponse.json(await buildCartResponse(payload, user.id))
    } catch (error: any) {
        console.error('Cart GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const product = Number(body.product)
        const vId = body.vId || ''
        const quantity = Number(body.quantity || 1)
        const highlights = body.productHighlights || []
        const highlightsKey = normalizeHighlights(highlights)

        if (isNaN(product)) return NextResponse.json({ error: 'Valid Product ID is required' }, { status: 400 })

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true },
        })

        const cart = carts.docs[0]
        const items: any[] = cart?.items || []

        const existingIndex = items.findIndex(
            (item: any) =>
                (typeof item.product === 'object' ? item.product.id : item.product) === product &&
                item.vId === vId &&
                normalizeHighlights(item.productHighlights) === highlightsKey
        )

        if (existingIndex >= 0) {
            if (items[existingIndex].quantity + quantity > 10) {
                return NextResponse.json({ error: 'Maximum quantity of 10 units reached for this item' }, { status: 400 })
            }
            items[existingIndex].quantity += quantity
        } else {
            if (quantity > 10) {
                return NextResponse.json({ error: 'Maximum quantity of 10 units reached for this item' }, { status: 400 })
            }
            items.push({ product, vId, quantity, productHighlights: highlights })
        }

        if (cart) {
            await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 0,
            })
        } else {
            try {
                await payload.create({
                    collection: 'web-cart',
                    data: { user: user.id, items },
                    depth: 0,
                })
            } catch (err: any) {
                if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
                    const retryCarts = await payload.find({
                        collection: 'web-cart',
                        where: { user: { equals: user.id } },
                        limit: 1,
                        depth: 0,
                    })
                    if (retryCarts.docs[0]) {
                        await payload.update({
                            collection: 'web-cart',
                            id: retryCarts.docs[0].id,
                            data: { items },
                            depth: 0,
                        })
                    } else {
                        throw err
                    }
                } else {
                    throw err
                }
            }
        }

        // Re-fetch fresh from DB so images, prices, and names are all fully resolved
        return NextResponse.json(await buildCartResponse(payload, user.id))
    } catch (error: any) {
        console.error('Cart POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { product: rawProduct, vId, quantity, action, productHighlights } = await request.json()
        const product = Number(rawProduct)
        const patchHighlightsKey = normalizeHighlights(productHighlights || [])

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true },
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 })

        const items: any[] = cart.items || []
        const index = items.findIndex(
            (item: any) =>
                (typeof item.product === 'object' ? item.product.id : item.product) === product &&
                item.vId === (vId || '') &&
                normalizeHighlights(item.productHighlights) === patchHighlightsKey
        )

        if (index >= 0) {
            if (action === 'increment') {
                if (items[index].quantity >= 10) {
                    return NextResponse.json({ error: 'Maximum quantity of 10 units reached' }, { status: 400 })
                }
                items[index].quantity += 1
            } else if (action === 'decrement') {
                items[index].quantity = Math.max(1, items[index].quantity - 1)
            } else if (typeof quantity === 'number') {
                if (quantity > 10) {
                    return NextResponse.json({ error: 'Maximum quantity of 10 units is allowed' }, { status: 400 })
                }
                items[index].quantity = Math.max(1, quantity)
            }

            await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 0,
            })

            return NextResponse.json(await buildCartResponse(payload, user.id))
        }

        return NextResponse.json({ items: [], subtotal: 0, totalItems: 0 })
    } catch (error: any) {
        console.error('Cart PATCH Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { product: rawProduct, vId, productHighlights: deleteHighlights } = await request.json()
        const product = Number(rawProduct)
        const deleteHighlightsKey = normalizeHighlights(deleteHighlights || [])

        const carts = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true },
        })

        const cart = carts.docs[0]
        if (cart) {
            const items = (cart.items || []).filter(
                (item: any) =>
                    !((typeof item.product === 'object' ? item.product.id : item.product) === product &&
                        item.vId === (vId || '') &&
                        normalizeHighlights(item.productHighlights) === deleteHighlightsKey)
            )

            await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: { items },
                depth: 0,
            })

            return NextResponse.json(await buildCartResponse(payload, user.id))
        }

        return NextResponse.json({ items: [], subtotal: 0, totalItems: 0 })
    } catch (error: any) {
        console.error('Cart DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
