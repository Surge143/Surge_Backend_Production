import { PayloadHandler } from 'payload'

export const getShopCouponsHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const { shopId } = (req.routeParams || {}) as any

    // 1. Validate Shop ID presence
    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    try {
        // 2. Check if the shop exists
        const shop = await payload.findByID({
            collection: 'shop',
            id: shopId,
        }).catch(() => null)

        if (!shop) {
            return Response.json({ error: 'Shop not found' }, { status: 404 })
        }

        const shopCoupons = await payload.find({
            collection: 'shop-coupon',
            where: {
                and: [
                    {
                        shop: {
                            equals: shopId,
                        },
                    },
                    {
                        isPubliclyVisible: {
                            equals: true,
                        },
                    },
                ],
            },
            limit: 100,
            sort: '-createdAt',
        });



        return Response.json({
            success: true,
            totalDocs: shopCoupons.totalDocs,
            docs: shopCoupons.docs.map(coupon => ({
                id: coupon.id,
                code: coupon.code,
                status: coupon.couponStatus,
                expiryDate: coupon.expiryDate,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                minimumAmount: coupon.minimumAmount,
                applicability: coupon.applicability,
                products: coupon.products,
            }))
        }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching shop coupons:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}