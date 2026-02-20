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
/**
 * Maps raw backend cart items to flat frontend CartItem structure
 * Uses batch fetching for efficiency if items aren't already populated.
 */
async function mapCartItems(payload: any, items: any[]) {
    if (!items || items.length === 0) return [];

    const productIds = Array.from(new Set(items.map(item =>
        typeof item.product === 'object' ? item.product.id : item.product
    )));

    // Fetch essential product details in a single batch
    const productsFetched = await payload.find({
        collection: 'web-products',
        where: { id: { in: productIds } },
        depth: 0,
        limit: 100,
        select: {
            name: true,
            salePrice: true,
            regularPrice: true,
            productImage: true,
            variants: true,
        }
    });

    const productMap = new Map(productsFetched.docs.map(p => [String(p.id), p as any]));

    return items.map((item: any) => {
        const productId = typeof item.product === 'object' ? item.product.id : item.product;
        const product: any = productMap.get(String(productId));

        if (!product) return { product: productId, vId: item.vId, name: 'Unknown Product', price: 0, image: '', quantity: item.quantity };

        const name = product.name;
        let price = product.salePrice || product.regularPrice;
        let image = product.productImage?.url || '';
        let variantName = '';

        if (item.vId && product.variants) {
            const variant = product.variants.find((v: any) => v.id === item.vId);
            if (variant) {
                variantName = variant.variantName;
                price = variant.variantSalePrice || variant.variantRegularPrice;
                image = variant.variantImage?.url || image;
            }
        }

        return {
            product: productId,
            vId: item.vId || '',
            name,
            price,
            image,
            variantName,
            quantity: item.quantity,
        };
    });
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
            depth: 0,
            select: { items: true }
        })

        const items = carts.docs[0]?.items || []
        return NextResponse.json({ items: await mapCartItems(payload, items) })
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

        const carts = await (payload as any).find({
            collection: 'web-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true }
        })

        // console.log(`DEBUG: Cart Find Result: ${carts.docs.length} found`);

        const cart = carts.docs[0]
        const items: any[] = cart?.items || []

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
                depth: 0,
                select: { items: true }
            })
        } else {
            try {
                updatedCart = await payload.create({
                    collection: 'web-cart',
                    data: { user: user.id, items },
                    depth: 0,
                    select: { items: true }
                })
            } catch (err: any) {
                if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
                    const retryCarts = await payload.find({
                        collection: 'web-cart',
                        where: { user: { equals: user.id } },
                        limit: 1,
                        depth: 0,
                        select: { items: true }
                    })
                    if (retryCarts.docs[0]) {
                        updatedCart = await payload.update({
                            collection: 'web-cart',
                            id: retryCarts.docs[0].id,
                            data: { items },
                            depth: 0,
                            select: { items: true }
                        })
                    } else {
                        throw err
                    }
                } else {
                    throw err
                }
            }
        }

        return NextResponse.json({ items: await mapCartItems(payload, updatedCart.items || []) })
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
            depth: 0,
            select: { items: true }
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
                depth: 0,
                select: { items: true }
            })

            return NextResponse.json({ items: await mapCartItems(payload, updatedCart.items || []) })
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
            depth: 0,
            select: { items: true }
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
                depth: 0,
                select: { items: true }
            })

            return NextResponse.json({ items: await mapCartItems(payload, updatedCart.items || []) })
        }

        return NextResponse.json({ items: [] })
    } catch (error: any) {
        console.error('Cart DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
