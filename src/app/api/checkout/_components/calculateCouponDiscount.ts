import { NextResponse } from 'next/server';

interface OrderItem {
    product: string | number;
    price: number;
    quantity: number;
    [key: string]: any;
}

interface Coupon {
    id: string | number;
    minimumAmount: number;
    applicability: 'all' | 'products';
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    products?: (string | number | any)[];
    [key: string]: any;
}

/**
 * Shared logic for calculating coupon discounts.
 * Works for both Coupon and ShopCoupons as they share the same schema fields.
 */
export const calculateCouponDiscount = (
    coupon: Coupon,
    subtotal: number,
    orderItems: OrderItem[]
) => {
    // 1. Validate Minimum Amount
    if (subtotal < coupon.minimumAmount) {
        return {
            error: `Minimum order amount of AED ${coupon.minimumAmount} required for this coupon`,
            status: 400
        };
    }

    let couponDiscount = 0;

    // 2. Calculate Discount based on Applicability
    if (coupon.applicability === 'all') {
        if (coupon.discountType === 'percentage') {
            couponDiscount = subtotal * (coupon.discountAmount / 100);
        } else {
            couponDiscount = Math.min(coupon.discountAmount, subtotal);
        }
    } else if (coupon.applicability === 'products') {
        // Apply only to eligible products
        const eligibleProducts = (coupon.products as any[])?.map((p: any) =>
            typeof p === 'object' ? p.id : p
        ) || [];

        let eligibleSubtotal = 0;

        orderItems.forEach(item => {
            if (eligibleProducts.includes(item.product)) {
                eligibleSubtotal += (item.price * item.quantity);
            }
        });

        if (eligibleSubtotal === 0) {
            return {
                error: 'Coupon is not applicable to any products in your cart',
                status: 400
            };
        }

        if (coupon.discountType === 'percentage') {
            couponDiscount = eligibleSubtotal * (coupon.discountAmount / 100);
        } else {
            couponDiscount = Math.min(coupon.discountAmount, eligibleSubtotal);
        }
    }

    return {
        success: true,
        discount: couponDiscount,
        couponId: coupon.id
    };
};
