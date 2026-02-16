import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config' // :white_check_mark: correct path
import { headers as getNextHeaders } from 'next/headers';

// ---------------- POST (Add to wishlist) ----------------

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { message: 'productId required', success: false },
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

        // :white_check_mark: Find wishlist for the user
        const wishlists = await payload.find({
            collection: 'web-wishlist' as any,
            where: { user: { equals: user.id } },
            limit: 1,
        });

        const wishlist = wishlists.docs?.[0];

        // ---------------- If wishlist exists ----------------
        if (wishlist) {
            // Check for duplicate
            const exists = wishlist.items?.some((item: any) => {
                const id =
                    typeof item.product === 'string'
                        ? item.product
                        : item.product?.id;
                return id === productId;
            });

            if (exists) {
                return NextResponse.json(
                    { message: 'Item already in wishlist', success: false },
                    { status: 200 }
                );
            }

            // Update wishlist
            await payload.update({
                collection: 'web-wishlist' as any,
                id: wishlist.id,
                data: {
                    items: [...(wishlist.items || []), { product: productId }],
                },
            });

            return NextResponse.json(
                { message: 'Item added to wishlist', success: true },
                { status: 200 }
            );
        }

        // ---------------- Create new wishlist ----------------
        await payload.create({
            collection: 'web-wishlist' as any,
            data: {
                user: user.id,
                items: [{ product: productId }],
            },
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

        // Get the logged-in user from auth headers
        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Please login to view wishlist' },
                { status: 401 }
            );
        }

        // Find wishlist for the logged-in user
        const wishlists = await payload.find({
            collection: 'web-wishlist' as any,
            where: {
                user: { equals: user.id },
            },
            limit: 1,
            depth: 2, // populate related product data
        });

        const wishlist = wishlists.docs?.[0];

        if (!wishlist) {
            return NextResponse.json({ items: [] });
        }

        // Return only id, name, and productLine
        const items = wishlist.items?.map((item: any) => {
            const product = typeof item.product === 'string' ? null : item.product;
            return product
                ? {
                    id: product.id,
                    name: product.name,
                    productLine: product.productLine,
                }
                : { productId: item.product }; // fallback if product is not populated
        });

        return NextResponse.json({ items });
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
        const { productId } = body;

        if (!productId) {
            return NextResponse.json(
                { message: 'productId required', success: false },
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
            collection: 'web-wishlist' as any,
            where: { user: { equals: user.id } },
            limit: 1,
        });

        const wishlist = wishlists.docs?.[0];

        if (!wishlist) {
            return NextResponse.json(
                { message: 'Wishlist not found', success: false },
                { status: 404 }
            );
        }

        // ---------------- Check if product exists ----------------
        const exists = (wishlist.items || []).some((item: any) => {
            const product = item.product;
            let id: string | number | undefined;

            if (!product) return false;

            if (typeof product === 'string' || typeof product === 'number') {
                id = product;
            } else if ('id' in product) {
                id = product.id;
            }

            return id === productId;
        });

        if (!exists) {
            return NextResponse.json(
                { message: 'Product not found in wishlist', success: false },
                { status: 404 }
            );
        }

        // ---------------- Filter product ----------------
        const updatedItems = (wishlist.items || []).filter((item: any) => {
            const product = item.product;
            let id: string | number | undefined;

            if (!product) return true;

            if (typeof product === 'string' || typeof product === 'number') {
                id = product;
            } else if ('id' in product) {
                id = product.id;
            }

            return id !== productId;
        });

        await payload.update({
            collection: 'web-wishlist' as any,
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