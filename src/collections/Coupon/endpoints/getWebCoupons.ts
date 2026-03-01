import { PayloadHandler } from 'payload'

export const getShopCouponsHandler: PayloadHandler = async (req) => {
    const { payload } = req

    try {

        const coupons = await payload.find({
            collection: 'coupon',
            where: {
                and: [
                    {
                        isPubliclyVisible: {
                            equals: true,
                        },
                    },
                    {
                        couponFor: {
                            equals: 'Website',
                        },
                    }
                ],
            },
            limit: 100,
            sort: '-createdAt',
        });

        return Response.json({
            success: true,
            totalDocs: coupons.totalDocs,
            docs: coupons.docs.map(coupon => ({
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