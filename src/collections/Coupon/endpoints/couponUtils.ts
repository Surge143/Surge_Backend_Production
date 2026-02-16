import { Payload, User } from 'payload';

export interface CouponValidationResult {
    success: boolean;
    error?: string;
    status?: number;
    coupon?: any;
}

export const validateCoupon = async (
    payload: Payload,
    couponCode: string,
    user: User | null,
    shopId?: string | number
): Promise<CouponValidationResult> => {
    try {
        let coupon: any = null;

        // 1. Try to find in the base 'coupon' collection first (Web/Global)
        const coupons = await payload.find({
            collection: 'coupon',
            where: {
                code: {
                    equals: couponCode,
                },
            },
            limit: 1,
        });

        if (coupons.docs.length > 0) {
            coupon = coupons.docs[0];
        } else if (shopId) {
            // 2. If not found in base, and shopId is provided, check shop-specific coupons
            const shopCoupons = await payload.find({
                collection: 'shop-coupon',
                where: {
                    and: [
                        { shop: { equals: shopId } },
                        { code: { equals: couponCode } },
                    ],
                },
                limit: 1,
            });

            if (shopCoupons.docs.length > 0) {
                coupon = shopCoupons.docs[0];
            }
        }

        if (!coupon) {
            return { success: false, error: 'Invalid coupon code', status: 404 };
        }

        const now = new Date();

        // 3. Applicability Checks
        if (!coupon.couponFor?.website) {
            return { success: false, error: 'This coupon is not applicable for website', status: 400 };
        }

        if (coupon.status !== 'active') {
            return { success: false, error: 'This coupon is no longer active', status: 400 };
        }

        const expiryDate = new Date(coupon.expiryDate);
        if (expiryDate < now) {
            return { success: false, error: 'This coupon has expired', status: 400 };
        }

        // 4. Usage Limit Checks
        if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
            return { success: false, error: 'This coupon has reached its total usage limit', status: 400 };
        }

        // Usage limit per user (only for logged in users)
        if (user && coupon.usageLimitPerUser) {
            const userOrdersWithCoupon = await payload.find({
                collection: 'web-orders',
                where: {
                    and: [
                        { user: { equals: user.id } },
                        { couponCode: { equals: coupon.id } },
                        { paymentStatus: { not_equals: 'refunded' } }
                    ],
                },
                limit: 0,
            });

            if (userOrdersWithCoupon.totalDocs >= coupon.usageLimitPerUser) {
                return { success: false, error: 'You have reached your limit for this coupon', status: 400 };
            }
        }

        return {
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
        };

    } catch (error: any) {
        console.error('Error validating coupon:', error);
        return { success: false, error: 'Internal server error', status: 500 };
    }
};
