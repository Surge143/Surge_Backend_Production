import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';

// ---------------- POST (Add to wishlist) ----------------

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { collection, origin } = body;
        let { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { message: 'productId required', success: false },
                { status: 400 }
            );
        }

        // Map origin to collection
        let targetCollection = collection;
        if (origin === 'cafe') targetCollection = 'shop-menu';
        if (origin === 'store') targetCollection = 'web-products';

        // Default to web-products if collection not specified
        if (!targetCollection) targetCollection = 'web-products';

        if (!['web-products', 'shop-menu'].includes(targetCollection)) {
            return NextResponse.json(
                { message: 'Invalid origin or collection specified.', success: false },
                { status: 400 }
            );
        }

        // Convert to number if it's a string (PostgreSQL uses numeric IDs)
        productId = typeof productId === 'string' ? parseInt(productId, 10) : productId;

        if (isNaN(productId)) {
            return NextResponse.json(
                { message: 'Invalid product ID format', success: false },
                { status: 400 }
            );
        }

        const payload = await getPayload({ config });

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Please login to save wishlist', success: false },
                { status: 401 }
            );
        }

        // Validate that the product exists in the specified collection
        let product: any;
        try {
            product = await payload.findByID({
                collection: targetCollection,
                id: productId,
                depth: 1, // Need shop ID which is a relationship
            });

            if (!product) {
                return NextResponse.json(
                    { message: `Product not found in ${targetCollection}`, success: false },
                    { status: 404 }
                );
            }
        } catch (error) {
            console.error('Product validation error:', error);
            return NextResponse.json(
                { message: 'Invalid product ID or collection', success: false },
                { status: 400 }
            );
        }

        // Find wishlist for the user
        const wishlists = await payload.find({
            collection: 'wishlist',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0
        });

        const wishlist = wishlists.docs?.[0];

        // ---------------- If wishlist exists ----------------
        if (wishlist) {
            // Check for duplicate (matching both collection and id)
            const exists = wishlist.items?.some((item: any) => {
                const itemProd = item.product;
                const itemCollection = typeof itemProd === 'object' && itemProd !== null ? itemProd.relationTo : targetCollection; // Fallback if not populated
                const itemId = typeof itemProd === 'object' && itemProd !== null ? (typeof itemProd.value === 'object' ? itemProd.value.id : itemProd.value) : itemProd;

                return itemCollection === targetCollection && itemId === productId;
            });

            if (exists) {
                return NextResponse.json(
                    { message: 'Item already in wishlist', success: false },
                    { status: 200 }
                );
            }

            // Update wishlist
            await payload.update({
                collection: 'wishlist',
                id: wishlist.id,
                data: {
                    items: [
                        ...(wishlist.items || []),
                        {
                            product: {
                                relationTo: targetCollection,
                                value: productId
                            },
                            shop: targetCollection === 'shop-menu' ? (typeof product.shop === 'object' ? product.shop.id : product.shop) : undefined
                        }
                    ],
                },
            });

            return NextResponse.json(
                { message: 'Item added to wishlist', success: true },
                { status: 200 }
            );
        }

        // ---------------- Create new wishlist ----------------
        const createData = {
            user: user.id,
            items: [
                {
                    product: {
                        relationTo: targetCollection,
                        value: productId
                    },
                    shop: targetCollection === 'shop-menu' ? (typeof product.shop === 'object' ? product.shop.id : product.shop) : undefined
                }
            ],
        };

        await payload.create({
            collection: 'wishlist',
            data: createData as any,
        });

        return NextResponse.json(
            { message: 'Item added to wishlist', success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Wishlist POST Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', success: false },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config });

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Please login to view wishlist', success: false },
                { status: 401 }
            );
        }

        const wishlists = await payload.find({
            collection: 'wishlist',
            where: {
                user: { equals: user.id },
            },
            depth: 2, // populate related product data
        });

        const wishlist = wishlists.docs?.[0];

        if (!wishlist) {
            return NextResponse.json({ success: true, wishlist: { items: [] } });
        }

        return NextResponse.json({ success: true, wishlist });
    } catch (error) {
        console.error('Wishlist GET Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// ---------------- DELETE (Remove from wishlist) ----------------

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { collection, origin } = body;
        let { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { message: 'productId required', success: false },
                { status: 400 }
            );
        }

        // Map origin to collection
        let targetCollection = collection;
        if (origin === 'cafe') targetCollection = 'shop-menu';
        if (origin === 'store') targetCollection = 'web-products';

        if (!targetCollection) targetCollection = 'web-products';

        productId = typeof productId === 'string' ? parseInt(productId, 10) : productId;

        if (isNaN(productId)) {
            return NextResponse.json(
                { message: 'Invalid product ID format', success: false },
                { status: 400 }
            );
        }

        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: await getNextHeaders() });

        if (!user) {
            return NextResponse.json(
                { message: 'Unauthorized', success: false },
                { status: 401 }
            );
        }

        const wishlists = await payload.find({
            collection: 'wishlist',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0
        });

        const wishlist: any = wishlists.docs?.[0];

        if (!wishlist) {
            return NextResponse.json(
                { message: 'Wishlist not found', success: false },
                { status: 404 }
            );
        }

        // Check if item exists
        const exists = (wishlist.items || []).some((item: any) => {
            const itemProd = item.product;
            const itemCollection = typeof itemProd === 'object' && itemProd !== null ? itemProd.relationTo : targetCollection;
            const itemId = typeof itemProd === 'object' && itemProd !== null ? (typeof itemProd.value === 'object' ? itemProd.value.id : itemProd.value) : itemProd;

            return itemCollection === targetCollection && itemId === productId;
        });

        if (!exists) {
            return NextResponse.json(
                { message: 'Product not found in wishlist', success: false },
                { status: 404 }
            );
        }

        // Filter out the product
        const updatedItems = (wishlist.items || []).filter((item: any) => {
            const itemProd = item.product;
            const itemCollection = typeof itemProd === 'object' && itemProd !== null ? itemProd.relationTo : targetCollection;
            const itemId = typeof itemProd === 'object' && itemProd !== null ? (typeof itemProd.value === 'object' ? itemProd.value.id : itemProd.value) : itemProd;

            return !(itemCollection === targetCollection && itemId === productId);
        });

        await payload.update({
            collection: 'wishlist',
            id: wishlist.id,
            data: { items: updatedItems },
        });

        return NextResponse.json(
            { message: 'Item removed from wishlist', success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error('Wishlist DELETE Error:', error);
        return NextResponse.json(
            { message: 'Failed to remove item', success: false },
            { status: 500 }
        );
    }
}