import { PayloadHandler } from 'payload'
import { validateAppCoupon } from './components/shopCouponUtils'

export const validateAppCouponHandler: PayloadHandler = async (req) => {
    const { payload, user } = req
    const { shopId, couponCode } = (req.routeParams || {}) as any

    if (!user) {
        return Response.json({ error: 'Login to use Coupons' }, { status: 401 })
    }

    if (!couponCode) {
        return Response.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const result = await validateAppCoupon(payload, couponCode, user as any, shopId)

    if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: result.status || 400 })
    }

    return Response.json({
        success: true,
        coupon: result.coupon
    }, { status: 200 })
}