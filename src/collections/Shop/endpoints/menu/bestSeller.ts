import { PayloadHandler } from "payload";

export const getBestSellerHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const { shopId } = (req.routeParams || {}) as any

    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    try {
        const numericShopId = parseInt(shopId, 10)
        if (isNaN(numericShopId)) {
            return Response.json({ error: 'Invalid shopId' }, { status: 400 })
        }

        // 1. Fetch IDs from app-best-seller
        const result = await payload.find({
            collection: 'app-best-seller',
            where: { shop: { equals: numericShopId } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })

        if (result.docs.length === 0) {
            return Response.json({
                success: true,
                items: [],
                pagination: { totalDocs: 0 }
            }, { status: 200 })
        }

        const doc = result.docs[0]
        const productIds = (doc.products || []).map((p: any) => {
            if (typeof p === 'object' && p !== null) {
                return p.value ?? p.id ?? p
            }
            return p
        })

        if (productIds.length === 0) {
            return Response.json({
                success: true,
                items: [],
                pagination: { totalDocs: 0 }
            }, { status: 200 })
        }

        // 2. Fetch full product details from shop-menu
        const productsFetched = await payload.find({
            collection: 'shop-menu',
            where: {
                id: { in: productIds }
            },
            depth: 1,
            limit: 100,
        })

        // Sort items to match the order in productIds
        const productMap = new Map(productsFetched.docs.map(p => [String(p.id), p]));
        const sortedDocs = productIds
            .map((id: any) => productMap.get(String(id)))
            .filter(Boolean);

        const itemsFiltered = sortedDocs.map((item: any) => {
            return {
                id: item.id,
                name: item.name,
                price: item.regularPrice,
                salePrice: item.salePrice,
                tagline: item.tagline,
                image: item.image,
                category: item.category,
                subCategory: item.subCategories,
                customizations: item.customizations,
                stockCount: item.stockCount,
                isAvailable: item.inStock,
                dietaryType: item.dietaryType,
                isStampEligible: item.isStampEligible,
                isStampFreeProduct: item.isStampFreeProduct,
                isLatest: item.isLatest ?? false,
                slug: item.slug,
            }
        })

        return Response.json({
            success: true,
            items: itemsFiltered,
            pagination: {
                totalDocs: productsFetched.totalDocs,
                limit: productsFetched.limit,
                totalPages: productsFetched.totalPages,
                page: productsFetched.page,
            }
        }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching best seller items:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
