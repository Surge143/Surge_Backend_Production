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
): Promise<CouponValidationResult> => {
    try {
        let coupon: any = null;

        // 1. Try to find in the base 'coupon' collection first (Web/Global)
        const coupons = await payload.find({
            collection: 'surge-coupon',
            where: {
                code: {
                    equals: couponCode,
                },
            },
            limit: 1,
            depth: 0,
            select: {
                id: true,
                code: true,
                couponFor: true,
                couponStatus: true,
                expiryDate: true,
                usageLimit: true,
                usageCount: true,
                usageLimitPerUser: true,
                discountType: true,
                discountAmount: true,
                minimumAmount: true,
                applicability: true,
                products: true,
            }
        });

        if (coupons.docs.length > 0) {
            coupon = coupons.docs[0];
        }

        if (!coupon) {
            return { success: false, error: 'Invalid coupon code', status: 404 };
        }

        const now = new Date();

        // 3. Applicability Checks
        if (!coupon.couponFor?.website) {
            return { success: false, error: 'This coupon is not applicable for website', status: 400 };
        }

        if (coupon.couponStatus !== 'active') {
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
            const userOrdersWithCoupon = await (payload as any).find({
                collection: 'web-orders',
                where: {
                    and: [
                        { user: { equals: user.id } },
                        { couponCode: { equals: String(coupon.id) } },
                        { paymentStatus: { not_equals: 'refunded' } }
                    ],
                },
                limit: 1,
                depth: 0,
                select: { id: true }
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
