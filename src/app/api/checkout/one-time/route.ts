import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';
import { stripIds } from '@/utilities/stripIds';
import { validateCoupon } from '@/collections/Coupon/endpoints/couponUtils';
import { calculateCouponDiscount } from '../_components/calculateCouponDiscount';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        })

        let body: any;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
        }

        const {
            shippingAddress,
            billingAddress,
            deliveryOption,
            shippingAddressAsBillingAddress,
            email,
            products, // Expect array of { productId, variantId, quantity }
            useWTCoins,
            appliedCouponCode,
            pickupShopId,
        } = body || {};

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

        // --- DETERMINE ITEMS TO PROCESS ---
        let itemsToProcess: any[] = [];

        // 1. Prioritize explicit products from frontend (Buy Now / Direct Selection)
        if (products && Array.isArray(products) && products.length > 0) {
            itemsToProcess = products.map((p: any) => ({
                productId: p.productId,
                variantId: p.variantId,
                quantity: p.quantity || 1,
                productHighlights: p.productHighlights || [],
                productDoc: null,
            }));
        }
        // 2. Fallback to saved cart if user is authenticated and no specific products provided
        else if (user) {
            const cartResult = await payload.find({
                collection: 'web-cart',
                where: { user: { equals: user.id } },
                depth: 0,
                select: { items: true }
            });

            if (cartResult.docs.length > 0 && cartResult.docs[0].items && cartResult.docs[0].items.length > 0) {
                itemsToProcess = cartResult.docs[0].items.map((item: any) => ({
                    productId: typeof item.product === 'object' ? item.product.id : item.product,
                    variantId: item.vId,
                    quantity: item.quantity || 1,
                    productHighlights: item.productHighlights || [],
                    productDoc: null,
                }));
            }
        }

        if (itemsToProcess.length === 0) {
            return NextResponse.json({ error: 'Your cart/selection is empty' }, { status: 400 });
        }

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
                productHighlights: true,
            }
        });

        const productMap = new Map(productsFetched.docs.map(p => [String(p.id), p]));

        // --- TAX AND SHIPPING FETCHING ---
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

                itemPrice = Number(selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice || 0);
            } else {
                // STOCK VALIDATION
                if (!productDoc.inStock) {
                    return NextResponse.json({ error: `${productDoc.name} is out of stock` }, { status: 400 });
                }
                if (typeof productDoc.stockQuantity === 'number' && productDoc.stockQuantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${productDoc.name}` }, { status: 400 });
                }

                itemPrice = Number(productDoc.salePrice || productDoc.regularPrice || 0);
            }

            subtotal += itemPrice * item.quantity;

            orderItems.push({
                product: productDoc.id,
                variantID: item.variantId || "",
                quantity: item.quantity,
                price: itemPrice,
                productHighlights: stripIds(item.productHighlights || []),
            });
        }

        // --- CALCULATE DISCOUNTS AND TOTALS ---
        let wtPointsUsed = 0;
        let wtDiscount = 0;

        if (useWTCoins) {
            if (!user) {
                return NextResponse.json({ error: 'Please Login to use WT Coins' }, { status: 401 });
            }

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

        // --- CREATE PAYLOAD ORDER ---
        let guestAccessToken: string | null = null;
        if (!user) {
            guestAccessToken = crypto.randomBytes(32).toString('hex');
        }

        try {
            const orderDoc = await (payload as any).create({
                collection: 'web-orders',
                overrideAccess: true,
                data: {
                    customerType: user ? 'user' : 'guest',
                    user: user?.id,
                    email: (user as any)?.contactEmail ?? (user as any)?.email ?? email,
                    deliveryOption,
                    origin: 'one-time',
                    items: orderItems,
                    shippingAddress: deliveryOption === 'delivery' ? { ...shippingAddress, addressCountry: 'United Arab Emirates' } : undefined,
                    billingAddress: shippingAddressAsBillingAddress ? { ...shippingAddress, addressCountry: 'United Arab Emirates' } : { ...billingAddress, addressCountry: 'United Arab Emirates' },
                    pickupShop: deliveryOption === 'pickup' && pickupShopId ? pickupShopId : undefined,
                    paymentStatus: 'pending',
                    couponCode: couponId as any,
                    pointsUsed: wtPointsUsed,
                    guestAccessToken: guestAccessToken,
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
                select: { id: true, guestAccessToken: true },
            });

            if (orderDoc.guestAccessToken) {
                guestAccessToken = orderDoc.guestAccessToken;
            }

            // --- CREATE STRIPE PAYMENT INTENT ---
            try {
                const customerEmail = (user as any)?.contactEmail ?? (user as any)?.email ?? email;
                if (!customerEmail) {
                    return NextResponse.json({ error: 'Email is required for checkout' }, { status: 400 });
                }

                // Get or Create Stripe Customer
                // Priority: 1) stripeCustomerId saved on user, 2) search by email, 3) create new
                let stripeCustomerId: string;
                const savedStripeId = user ? (user as any).stripeCustomerId : null;

                if (savedStripeId) {
                    // Use the already-linked Stripe customer — fastest path, no duplicates
                    stripeCustomerId = savedStripeId;
                } else {
                    // Fallback: search by email (guest or first-time user)
                    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });

                    if (existingCustomers.data.length > 0) {
                        stripeCustomerId = existingCustomers.data[0].id;
                    } else {
                        const customer = await stripe.customers.create({
                            email: customerEmail,
                        });
                        stripeCustomerId = customer.id;
                    }
                }

                // Save Stripe customer ID to user record (if authenticated)
                if (user) {
                    await payload.update({
                        collection: 'users',
                        id: user.id,
                        data: { stripeCustomerId },
                        overrideAccess: true,
                        depth: 0,
                    });
                }

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(finalTotal * 100),
                    currency: 'aed',
                    customer: stripeCustomerId,
                    // If user is logged in, enable saving for future use
                    setup_future_usage: user ? 'off_session' : undefined,
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        db_order_id: orderDoc.id,
                        order_type: 'store',
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: "Order created successfully",
                    clientSecret: paymentIntent.client_secret,
                    dbOrderId: String(orderDoc.id),
                    guestAccessToken,
                    stripeCustomerId,
                }, { status: 200 });

            } catch (stripeError: any) {
                console.error('Stripe Error:', stripeError);
                return NextResponse.json({ error: stripeError?.message || 'Payment processing failed' }, { status: 500 });
            }
        } catch (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: (dbError as any)?.message || 'Failed to create order' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Global Error:', error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
