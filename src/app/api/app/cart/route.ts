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
/**
 * Maps cart items to a frontend-friendly structure
 * Uses batch fetching for both shop-menu and web-products collections.
 */
/** Extract a stable string ID from a polymorphic product reference */
function getProductId(productWrapper: any): string | null {
    if (!productWrapper) return null;
    if (typeof productWrapper === 'string' || typeof productWrapper === 'number') {
        return String(productWrapper);
    }
    if (typeof productWrapper === 'object') {
        // Polymorphic: { relationTo, value }
        const val = productWrapper.value;
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') return String(val.id);
        return String(val);
    }
    return null;
}

/** Get the relationTo from a polymorphic wrapper, or null */
function getRelationTo(productWrapper: any): string | null {
    if (typeof productWrapper === 'object' && productWrapper?.relationTo) {
        return productWrapper.relationTo;
    }
    return null;
}

function getCartItemId(item: any, fallbackIndex: number): string {
    if (item?.id !== null && item?.id !== undefined) {
        return String(item.id);
    }

    const productId = getProductId(item?.product) ?? 'unknown';
    const relationTo = getRelationTo(item?.product) ?? 'shop-menu';
    const vId = item?.vId ?? '';
    return `${relationTo}:${productId}:${vId}:${fallbackIndex}`;
}

function getCustomizationPrice(customizations: any): number {
    if (!Array.isArray(customizations)) return 0;

    return customizations.reduce((sum: number, selection: any) => {
        const price = Number(selection?.price ?? 0);
        return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
}

async function mapAppCartItems(payload: any, items: any[]) {
    if (!items || items.length === 0) return [];

    const shopMenuIds: string[] = [];
    const webProductIds: string[] = [];

    items.forEach(item => {
        const id = getProductId(item.product);
        const rel = getRelationTo(item.product);
        if (!id) return;

        if (rel === 'web-products') {
            webProductIds.push(id);
        } else {
            // Default to shop-menu if unknown
            shopMenuIds.push(id);
        }
    });

    // depth:1 so that image / productImage are populated with url, etc.
    const [shopMenuFetched, webProductsFetched] = await Promise.all([
        shopMenuIds.length > 0 ? payload.find({
            collection: 'shop-menu',
            where: { id: { in: shopMenuIds } },
            depth: 1,
            limit: shopMenuIds.length + 10,
        }) : { docs: [] },
        webProductIds.length > 0 ? payload.find({
            collection: 'web-products',
            where: { id: { in: webProductIds } },
            depth: 1,
            limit: webProductIds.length + 10,
        }) : { docs: [] }
    ]);

    // Key the maps by String(id) for reliable lookup
    const shopMenuMap = new Map<string, any>((shopMenuFetched.docs as any[]).map(p => [String(p.id), p]));
    const webProductsMap = new Map<string, any>((webProductsFetched.docs as any[]).map(p => [String(p.id), p]));

    return items.map((item: any, index: number) => {
        const productId = getProductId(item.product);
        const relationTo = getRelationTo(item.product) ?? (shopMenuMap.has(String(productId)) ? 'shop-menu' : 'web-products');
        const itemId = getCartItemId(item, index);

        if (!productId) {
            return { id: itemId, productId: null, vId: null, relationTo, name: 'Unknown', price: 0, quantity: item.quantity || 1, image: null, tagline: '', customizations: [] };
        }

        const product: any = relationTo === 'shop-menu' ? shopMenuMap.get(productId) : webProductsMap.get(productId);

        if (!product) {
            console.warn(`[Cart] Product not found: ${relationTo}:${productId}`);
            return { id: itemId, productId, vId: item.vId, relationTo, name: 'Unknown', price: 0, quantity: item.quantity || 1, image: null, tagline: '', customizations: [] };
        }

        // Both shop-menu and web-products use 'name'
        const name: string = product.name || 'Unknown';
        const tagline: string = product.tagline || '';

        // Resolve image URL (depth:1 returns the full media object)
        let image: string | null = null;
        if (product.image?.url) image = product.image.url;
        else if (product.productImage?.url) image = product.productImage.url;

        let price = 0;
        let variantName: string | undefined;

        if (relationTo === 'shop-menu') {
            // Cafe item — include customization pricing in the unit total
            price = Number(product.salePrice ?? product.regularPrice ?? 0) + getCustomizationPrice(item.customizations);
        } else {
            // Store item — check for variant
            if (product.hasVariantOptions && Array.isArray(product.variants) && product.variants.length > 0) {
                const variant = item.vId
                    ? product.variants.find((v: any) => String(v.id) === String(item.vId))
                    : product.variants[0]; // Fallback to first variant

                if (variant) {
                    price = Number(variant.variantSalePrice ?? variant.variantRegularPrice ?? 0);
                    variantName = variant.variantName;
                    // If no image on product root, try the variant image
                    if (!image && variant.variantImage?.url) image = variant.variantImage.url;
                }
            } else {
                price = Number(product.salePrice ?? product.regularPrice ?? 0);
            }
        }

        return {
            id: itemId,
            productId,
            vId: item.vId || null,
            relationTo,
            name,
            variantName,
            tagline,
            price,
            image,
            quantity: item.quantity || 1,
            customizations: item.customizations || [],
        };
    });
}

async function buildAppCartResponse(payload: any, userId: string | number) {
    const carts = await payload.find({
        collection: 'app-cart',
        where: { user: { equals: userId } },
        limit: 1,
        depth: 0,
        select: { items: true, shop: true, origin: true },
    })

    const cart = carts.docs[0]

    return {
        items: await mapAppCartItems(payload, cart?.items || []),
        shop: cart?.shop ? (typeof cart.shop === 'object' ? cart.shop : { id: cart.shop }) : null,
        origin: cart?.origin || 'cafe',
    }
}

export async function GET() {
    try {
        const { user, payload } = await getAuthContext()
        if (!user || !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        return NextResponse.json(await buildAppCartResponse(payload, user.id))
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
        const { productId, quantity = 1, customizations, vId, shopId } = body

        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        // 1. Discover relationTo for the new product
        let incomingRelation: 'shop-menu' | 'web-products' = 'shop-menu';
        let resolvedShopId: any = shopId || null;
        try {
            const inShop = await payload.findByID({ collection: 'shop-menu', id: productId, depth: 0, disableErrors: true }).catch(() => null) as any;
            if (!inShop) {
                const inWeb = await payload.findByID({ collection: 'web-products', id: productId, depth: 0, disableErrors: true }).catch(() => null);
                if (inWeb) incomingRelation = 'web-products';
            } else if (inShop?.shop && !resolvedShopId) {
                // Derive shopId from the product's own shop field if caller didn't send it
                resolvedShopId = typeof inShop.shop === 'object' ? inShop.shop.id : inShop.shop;
            }
        } catch {
            // default remains 'shop-menu'
        }

        const newOrigin = incomingRelation === 'shop-menu' ? 'cafe' : 'store';
        console.log(`[Cart POST] productId=${productId} -> relation=${incomingRelation} origin=${newOrigin} shop=${resolvedShopId}`);

        // 2. Prevent mixing against the separate website cart
        if (newOrigin === 'cafe') {
            const webCarts = await (payload as any).find({
                collection: 'web-cart',
                where: { user: { equals: user.id } },
                limit: 1,
                depth: 0,
                select: { items: true },
            })

            if ((webCarts.docs[0]?.items || []).length > 0) {
                return NextResponse.json({
                    error: 'MIXED_CART',
                    message: 'Your store cart already contains items. Clear it before adding cafe items.',
                    currentOrigin: 'store',
                }, { status: 400 })
            }
        }

        // 3. Fetch existing cart
        const carts = await (payload as any).find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true, shop: true, origin: true }
        })

        const cart = carts.docs[0]
        const items = [...(cart?.items || [])]

        // 4. Mixed Cart Validation (only when cart has items)
        if (items.length > 0) {
            const currentOrigin = cart?.origin;
            if (currentOrigin && currentOrigin !== newOrigin) {
                return NextResponse.json({
                    error: 'MIXED_CART',
                    message: `Your cart already contains ${currentOrigin === 'cafe' ? 'Cafe' : 'Store'} items. Please clear your cart before adding ${newOrigin === 'cafe' ? 'Cafe' : 'Store'} items.`,
                    currentOrigin
                }, { status: 400 });
            }
        }

        items.push({
            product: {
                relationTo: incomingRelation,
                value: productId
            },
            vId: vId || null,
            quantity: Number(quantity),
            customizations: customizations || null,
        })

        // Build cart data — always include origin (required field) and shop for cafe items
        const cartData: Record<string, any> = {
            user: user.id,
            origin: newOrigin,
            items,
        }
        if (newOrigin === 'cafe' && resolvedShopId) {
            cartData.shop = resolvedShopId;
        }

        if (cart) {
            await (payload as any).update({
                collection: 'app-cart',
                id: cart.id,
                data: cartData,
                depth: 0,
                select: { user: true, items: true, shop: true, origin: true }
            })
        } else {
            await (payload as any).create({
                collection: 'app-cart',
                data: cartData,
                depth: 0,
                select: { items: true, shop: true, origin: true }
            })
        }

        return NextResponse.json({
            success: true,
            ...(await buildAppCartResponse(payload, user.id)),
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

        const carts = await (payload as any).find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true }
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 })

        const items = [...(cart.items || [])]
        const index = items.findIndex((item: any, idx: number) => getCartItemId(item, idx) === String(itemId))

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

        await (payload as any).update({
            collection: 'app-cart',
            id: cart.id,
            data: { items },
            depth: 0,
            select: { user: true, items: true, origin: true, shop: true }
        })

        return NextResponse.json(await buildAppCartResponse(payload, user.id))
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

        const carts = await (payload as any).find({
            collection: 'app-cart',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            select: { id: true, items: true }
        })

        const cart = carts.docs[0]
        if (!cart) return NextResponse.json({ items: [] })

        if (itemId) {
            const items = (cart.items || []).filter((item: any, idx: number) => getCartItemId(item, idx) !== String(itemId))
            await (payload as any).update({
                collection: 'app-cart',
                id: cart.id,
                data: { items },
                depth: 0,
                select: { user: true, items: true, origin: true, shop: true }
            })
            return NextResponse.json(await buildAppCartResponse(payload, user.id))
        } else {
            // Clear all items instead of deleting the document (safer).
            // We keep the old origin/shop values to satisfy "required" constraints,
            // but the next POST will succeed because items.length will be 0.
            await (payload as any).update({
                collection: 'app-cart',
                id: cart.id,
                data: { items: [] },
                overrideAccess: true,
            })
            return NextResponse.json({
                items: [],
                origin: cart.origin,
                shop: cart.shop ? (typeof cart.shop === 'object' ? cart.shop : { id: cart.shop }) : null,
            })
        }
    } catch (error: any) {
        console.error('AppCart DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
