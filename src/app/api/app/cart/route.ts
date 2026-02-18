import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers'

/**
 * Helper to get the authenticated user and Payload instance
 */
async function getAuthContext() {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })
        const headers = await getNextHeaders()

        const { user } = await payload.auth({ headers })
        return { user, payload }
    } catch (error) {
        console.error('Auth Context Error:', error)
        return { user: null, payload: null }
    }
}

/**
 * Maps cart items to a frontend-friendly structure
 */
async function mapAppCartItems(items: any[]) {
    return items.map((item: any) => {
        // Handle polymorphic relationship: product { relationTo: '...', value: { ... } }
        const productWrapper = item.product
        if (typeof productWrapper !== 'object') return item

        const product = productWrapper.value
        if (!product || typeof product !== 'object') return item

        const name = product.name
        // Use snapshotted price if available, otherwise fallback to current product price
        const price = typeof item.price === 'number' ? item.price : (product.salePrice || product.regularPrice)
        const image = product.image?.url || product.productImage?.url || ''
        const tagline = product.tagline || ''

        return {
            id: item.id,
            productId: product.id,
            relationTo: productWrapper.relationTo || product.collection || (product.slug === 'shop-menu' ? 'shop-menu' : 'web-products'),
            name,
            tagline,
            price,
            image,
            quantity: item.quantity,
            customizations: item.customizations || [],
        }
    })
}

export async function GET() {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const carts = await payload.find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 2,
        })

        const cart = carts.docs[0]
        const items = cart?.items || []
        const shop = cart?.shop

        return NextResponse.json({
            items: await mapAppCartItems(items),
            shop: shop ? (typeof shop === 'object' ? shop : { id: shop }) : null
        })
    } catch (error: any) {
        console.error('AppCart GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { productId, quantity = 1, customizations, relationTo = 'shop-menu' } = body

        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        const carts = await payload.find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
        })

        const cart = carts.docs[0]
        const items = cart?.items || []

        items.push({
            product: {
                relationTo,
                value: productId,
            },
            quantity: Number(quantity),
            customizations: customizations || null,
        })

        let updatedCart
        if (cart) {
            updatedCart = await (payload as any).update({
                collection: 'app-cart',
                id: cart.id,
                data: {
                    user: user.id,
                    items: items,
                },
                depth: 2,
            })
        } else {
            updatedCart = await (payload as any).create({
                collection: 'app-cart',
                data: {
                    user: user.id,
                    items: items,
                    origin: 'app',
                },
                depth: 2,
            })
        }

        if (!updatedCart) throw new Error('Failed to create or update cart')

        return NextResponse.json({
            items: await mapAppCartItems(updatedCart.items || []),
            shop: updatedCart.shop ? (typeof updatedCart.shop === 'object' ? updatedCart.shop : { id: updatedCart.shop }) : null
        })
    } catch (error: any) {
        console.error('AppCart POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { itemId, quantity, action, customizations } = await request.json()

        const carts = await payload.find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 2, // Consistency with GET
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 })

        const items = [...(cart.items || [])]
        const index = items.findIndex((item: any) => String(item.id) === String(itemId))

        if (index === -1) return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 })

        // Update quantity
        if (action === 'increment') {
            items[index].quantity = (items[index].quantity || 0) + 1
        } else if (action === 'decrement') {
            items[index].quantity = Math.max(1, (items[index].quantity || 1) - 1)
        } else if (typeof quantity === 'number') {
            items[index].quantity = Math.max(1, quantity)
        }

        // Update customizations if provided
        if (customizations !== undefined) {
            items[index].customizations = customizations
        }

        const updatedCart = await (payload as any).update({
            collection: 'app-cart',
            id: cart.id,
            data: { items },
            depth: 2,
        })

        if (!updatedCart) throw new Error('Failed to update cart')

        return NextResponse.json({ items: await mapAppCartItems(updatedCart.items || []) })
    } catch (error: any) {
        console.error('AppCart PATCH Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const url = new URL(request.url)
        const itemId = url.searchParams.get('itemId')

        const carts = await payload.find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ items: [] })

        if (itemId) {
            const items = (cart.items || []).filter((item: any) => item.id !== itemId)
            const updatedCart = await (payload as any).update({
                collection: 'app-cart',
                id: cart.id,
                data: { items },
                depth: 2,
            })
            if (!updatedCart) throw new Error('Failed to update cart')
            return NextResponse.json({ items: await mapAppCartItems(updatedCart.items || []) })
        } else {
            await payload.delete({
                collection: 'app-cart',
                id: cart.id,
            })
            return NextResponse.json({ items: [] })
        }
    } catch (error: any) {
        console.error('AppCart DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
