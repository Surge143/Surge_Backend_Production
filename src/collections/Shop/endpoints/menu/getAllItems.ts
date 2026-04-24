import { PayloadHandler } from "payload";

export const getAllItemsHandler: PayloadHandler = async (req) => {
    const { payload, query } = req
    const { shopId } = (req.routeParams || {}) as any
    const categorySlug = query.categorySlug as string | undefined
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10

    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    try {
        const shop = await payload.findByID({
            collection: 'shop',
            id: shopId,
        }).catch(() => null)

        if (!shop) {
            return Response.json({ error: 'Shop not found' }, { status: 404 })
        }

        const whereClause: any = { shop: { equals: shopId } }

        if (categorySlug) {
            const categoryResult = await payload.find({
                collection: 'app-categories',
                where: { slug: { equals: categorySlug } },
                limit: 1,
                depth: 0,
            })

            if (categoryResult.totalDocs === 0) {
                return Response.json({ error: 'Category not found' }, { status: 404 })
            }

            whereClause.category = { equals: categoryResult.docs[0].id }
        }

        const menuItems = await payload.find({
            collection: 'shop-menu',
            where: whereClause,
            depth: 1,
            page,
            limit,
        })

        const menuItemsFiltered = menuItems.docs.map(item => {
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
            }
        })

        return Response.json({
            success: true,
            items: menuItemsFiltered,
            pagination: {
                totalDocs: menuItems.totalDocs,
                limit: menuItems.limit,
                totalPages: menuItems.totalPages,
                page: menuItems.page,
                pagingCounter: menuItems.pagingCounter,
                hasPrevPage: menuItems.hasPrevPage,
                hasNextPage: menuItems.hasNextPage,
                prevPage: menuItems.prevPage,
                nextPage: menuItems.nextPage,
            }
        }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching menu items:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
