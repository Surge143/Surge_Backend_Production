import { PayloadHandler } from "payload";

export const individualItemHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const { shopId, itemId } = (req.routeParams || {}) as any

    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    if (!itemId) {
        return Response.json({ error: 'Item ID is required' }, { status: 400 })
    }

    try {
        // 0. Fetch the item
        const item = await payload.findByID({
            collection: 'shop-menu',
            id: itemId,
            depth: 1,
        }).catch(() => null)

        if (!item) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        // 1. Verify if the item belongs to the specified shop
        if (!item.shop) {
            return Response.json({ error: 'Item has no shop assigned' }, { status: 400 })
        }

        const itemShopId = typeof item.shop === 'object' ? item.shop.id : item.shop
        if (String(itemShopId) !== String(shopId)) {
            return Response.json({ error: 'Item does not belong to this shop' }, { status: 400 })
        }

        return Response.json({ success: true, item, }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching item:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}