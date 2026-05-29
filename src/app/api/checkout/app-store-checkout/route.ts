import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';
import { validateCoupon } from '@/collections/Coupon/endpoints/couponUtils';
import { calculateCouponDiscount } from '../_components/calculateCouponDiscount';
import { stripIds } from '@/utilities/stripIds';

export const POST = async (req: NextRequest) => {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please login to place an order.' }, { status: 401 });
        }

        const body = await req.json();
        const {
            shippingAddress,
            billingAddress,
            deliveryOption,
            shippingAddressAsBillingAddress,
            useWTCoins,
            appliedCouponCode,
            pickupShopId,
        } = body

        // --- DATA NORMALIZATION ---
        // Handle legacy 'phone' key from frontend/cache
        if (shippingAddress && !shippingAddress.phoneNumber && (shippingAddress as any).phone) {
            shippingAddress.phoneNumber = (shippingAddress as any).phone
        }
        if (billingAddress && !billingAddress.phoneNumber && (billingAddress as any).phone) {
            billingAddress.phoneNumber = (billingAddress as any).phone
        }

        if (!deliveryOption) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (deliveryOption === 'delivery' && !shippingAddress) {
            return NextResponse.json({ error: 'Missing shipping address' }, { status: 400 })
        }

        if (deliveryOption === 'pickup' && !billingAddress) {
            return NextResponse.json({ error: 'Missing billing address' }, { status: 400 })
        }

        // --- FETCH FROM APP-CART (origin: store) ---
        const carts = await payload.find({
            collection: 'app-cart',
            where: {
                and: [
                    { user: { equals: user.id } },
                    { origin: { equals: 'store' } }
                ]
            },
            limit: 1,
            depth: 1,
        });

        const cart = carts.docs[0];

        if (!cart) {
            return NextResponse.json({ error: 'No active store cart found for this user.' }, { status: 400 });
        }

        if (!cart.items || cart.items.length === 0) {
            return NextResponse.json({ error: 'Your store cart is empty.' }, { status: 400 });
        }

        // Map cart items into the same shape expected by the processing logic below
        const itemsToProcess: any[] = cart.items.map((cartItem: any) => {
            const productId =
                typeof cartItem.product === 'object' && cartItem.product !== null
                    ? (cartItem.product.value && typeof cartItem.product.value === 'object'
                        ? cartItem.product.value.id
                        : cartItem.product.value ?? cartItem.product.id)
                    : cartItem.product;

            return {
                productId,
                variantId: cartItem.vId || null,
                quantity: cartItem.quantity || 1,
                productHighlights: cartItem.productHighlights || [],
            };
        });

        // --- BATCH PRODUCT FETCHING ---
        const productIds = Array.from(new Set(itemsToProcess.map(item => String(item.productId))));
        const productsFetched = await payload.find({
            collection: 'web-products',
            where: {
                id: { in: productIds }
            },
            depth: 0,
            limit: 100,
            select: {
                name: true,
                salePrice: true,
                regularPrice: true,
                variants: true,
                inStock: true,
                stockQuantity: true,
            }
        });

        const productMap = new Map(productsFetched.docs.map(p => [String(p.id), p]));

        // --- TAX AND SHIPPING ---
        let taxRate = 0;
        let shippingCharge = 0;
        try {
            const result = await calculateTaxAndShipping(payload, deliveryOption, shippingAddress);
            taxRate = result.taxRate;
            shippingCharge = result.shippingCharge;
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // --- VALIDATE ITEMS AND CALCULATE SUBTOTAL ---
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of itemsToProcess) {
            const productId = String(item.productId);
            const productDoc: any = productMap.get(productId);

            if (!productDoc) {
                return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
            }

            let itemPrice = 0;

            if (item.variantId) {
                const selectedVariant = productDoc.variants?.find((v: any) => v.id === item.variantId);
                if (!selectedVariant) {
                    return NextResponse.json({ error: `Variant not found for product: ${productDoc.name}` }, { status: 400 });
                }

                // STOCK VALIDATION
                if (!selectedVariant.variantInStock) {
                    return NextResponse.json({ error: `${productDoc.name} variant is out of stock` }, { status: 400 });
                }
                if (typeof selectedVariant.variantStockQuantity === 'number' && selectedVariant.variantStockQuantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${productDoc.name} variant` }, { status: 400 });
                }

                itemPrice = selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice;
            } else {
                // STOCK VALIDATION
                if (!productDoc.inStock) {
                    return NextResponse.json({ error: `${productDoc.name} is out of stock` }, { status: 400 });
                }
                if (typeof productDoc.stockQuantity === 'number' && productDoc.stockQuantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${productDoc.name}` }, { status: 400 });
                }

                itemPrice = productDoc.salePrice || productDoc.regularPrice;
            }

            subtotal += itemPrice * item.quantity;
            orderItems.push({
                product: productDoc.id,
                variantID: item.variantId || null,
                quantity: item.quantity,
                price: itemPrice,
                productHighlights: stripIds(item.productHighlights || []),
            });
        }

        // --- CALCULATE DISCOUNTS ---
        let wtPointsUsed = 0;
        let wtDiscount = 0;

        if (useWTCoins) {
            const result = await calculateWTCoinsDiscount(payload, user.id, subtotal);
            if ('error' in result) {
                return NextResponse.json({ error: result.error }, { status: result.status });
            }
            wtDiscount = result.discount;
            wtPointsUsed = result.pointsUsed;
        }

        // --- COUPON VALIDATION ---
        let couponDiscount = 0;
        let couponId: string | number | null = null;

        if (appliedCouponCode) {
            const result = await validateCoupon(payload, appliedCouponCode, user as any);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: result.status || 400 });
            }

            const discountResult = calculateCouponDiscount(result.coupon, subtotal, orderItems);
            if ('error' in discountResult) {
                return NextResponse.json({ error: discountResult.error }, { status: discountResult.status });
            }

            couponDiscount = discountResult.discount;
            couponId = discountResult.couponId;
        }

        const totalAfterDiscounts = Math.max(0, subtotal - wtDiscount - couponDiscount);
        const totalWithShipping = totalAfterDiscounts + shippingCharge;
        const taxAmount = totalWithShipping * (taxRate / 100);
        const finalTotal = totalWithShipping + taxAmount;

        // Cancel and delete any stale pending order from a previous abandoned checkout
        const existingPending = await payload.find({
            collection: 'web-orders',
            where: {
                and: [
                    { user: { equals: user.id } },
                    { paymentStatus: { equals: 'pending' } },
                    { origin: { equals: 'one-time' } },
                ],
            },
            limit: 1,
            depth: 0,
            select: { id: true, stripeOrderId: true },
        })
        if (existingPending.docs.length > 0) {
            const stale = existingPending.docs[0] as any
            if (stale.stripeOrderId) {
                await stripe.paymentIntents.cancel(stale.stripeOrderId).catch(() => {})
            }
            await payload.delete({ collection: 'web-orders', id: stale.id, overrideAccess: true }).catch(() => {})
        }

        // --- CREATE PAYLOAD ORDER ---
        try {
            const orderDoc = await (payload as any).create({
                collection: 'web-orders',
                data: {
                    customerType: 'user',
                    user: user.id,
                    email: (user as any).contactEmail ?? user.email,
                    deliveryOption,
                    origin: 'one-time',
                    items: orderItems,
                    shippingAddress: deliveryOption === 'delivery' ? { ...shippingAddress, addressCountry: 'United Arab Emirates' } : undefined,
                    billingAddress: shippingAddressAsBillingAddress ? { ...shippingAddress, addressCountry: 'United Arab Emirates' } : { ...billingAddress, addressCountry: 'United Arab Emirates' },
                    pickupShop: deliveryOption === 'pickup' && pickupShopId ? pickupShopId : undefined,
                    paymentStatus: 'pending',
                    couponCode: couponId as any,
                    pointsUsed: wtPointsUsed,
                    financials: {
                        subtotal,
                        couponDiscount,
                        surgeCoinsDiscount: wtDiscount,
                        shippingCharge,
                        taxPercentage: taxRate,
                        taxAmount,
                        total: finalTotal,
                    },
                },
                depth: 0,
                select: { id: true },
            });

            // --- STRIPE CUSTOMER ---
            const savedStripeId = (user as any).stripeCustomerId;
            let stripeCustomerId: string;

            if (savedStripeId) {
                stripeCustomerId = savedStripeId;
            } else {
                const stripeEmail = (user as any).contactEmail ?? user.email;
                const existingCustomers = await stripe.customers.list({ email: stripeEmail, limit: 1 });
                if (existingCustomers.data.length > 0) {
                    stripeCustomerId = existingCustomers.data[0].id;
                } else {
                    const customer = await stripe.customers.create({
                        email: stripeEmail,
                        name: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim(),
                    });
                    stripeCustomerId = customer.id;
                }
            }

            // Save Stripe customer ID to user record
            await payload.update({
                collection: 'users',
                id: user.id,
                data: { stripeCustomerId },
                overrideAccess: true,
                depth: 0,
            });

            // --- CREATE STRIPE PAYMENT INTENT ---
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(finalTotal * 100),
                currency: 'aed',
                customer: stripeCustomerId,
                setup_future_usage: 'off_session',
                automatic_payment_methods: { enabled: true },
                metadata: {
                    db_order_id: orderDoc.id,
                    order_type: 'store',
                },
            });

            // Update order with stripe info
            await payload.update({
                collection: 'web-orders',
                id: orderDoc.id,
                data: {
                    stripeOrderId: paymentIntent.id,
                    stripeData: paymentIntent as any,
                },
                depth: 0,
            });

            return NextResponse.json({
                success: true,
                message: "Order created successfully",
                clientSecret: paymentIntent.client_secret,
                dbOrderId: orderDoc.id,
                stripeCustomerId,
            }, { status: 200 });

        } catch (dbError: any) {
            console.error('Database/Stripe Error:', dbError);
            return NextResponse.json({ error: dbError.message || 'Failed to create order' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('App Store Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
