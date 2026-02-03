import { PayloadHandler } from 'payload'

export const validateCouponHandler: PayloadHandler = async (req) => {
    const { payload, user } = req
    const { shopId, couponCode } = (req.routeParams || {}) as any

    if (!user) {
        return Response.json({ error: 'Login to use Coupons' }, { status: 401 })
    }

    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    if (!couponCode) {
        return Response.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    try {
        // 0. Check if the shop exists
        const shop = await payload.findByID({
            collection: 'shop',
            id: shopId,
        }).catch(() => null)

        if (!shop) {
            return Response.json({ error: 'Shop not found' }, { status: 404 })
        }

        // 1. Find the coupon for the specific shop with the given code
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
                        code: {
                            equals: couponCode,
                        },
                    },
                ],
            },
            limit: 1,
        })

        if (!shopCoupons.docs.length) {
            return Response.json({ success: false, error: 'Invalid coupon code for this shop' }, { status: 404 })
        }

        const coupon = shopCoupons.docs[0]

        if (!coupon.couponFor?.app) {
            return Response.json({ success: false, error: 'This coupon is not for app' }, { status: 400 })
        }

        if (coupon.status !== 'active') {
            return Response.json({ success: false, error: 'This coupon is no longer active' }, { status: 400 })
        }
        const now = new Date()
        const expiryDate = new Date(coupon.expiryDate)
        if (expiryDate < now) {
            return Response.json({ success: false, error: 'This coupon has expired' }, { status: 400 })
        }

        // 4. Return the coupon details if success
        return Response.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                minimumAmount: coupon.minimumAmount,
                applicability: coupon.applicability,
                products: coupon.products,
            }
        }, { status: 200 })

    } catch (error: any) {
        console.error('Error successating coupon:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}