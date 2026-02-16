import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';
import { validateCoupon } from '@/collections/Coupon/endpoints/couponUtils';

export async function POST(req: NextRequest) {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        })

        const body = await req.json();
        const {
            shippingAddress,
            billingAddress,
            deliveryOption,
            shippingAddressAsBillingAddress,
            paymentMethodId,
            email,
            products, // Expect array of { productId, variantId, quantity }
            useWTCoins,
            appliedCouponCode,
        } = body

        // --- DATA NORMALIZATION ---
        // Handle legacy 'phone' key from frontend/cache
        if (shippingAddress && !shippingAddress.phoneNumber && (shippingAddress as any).phone) {
            shippingAddress.phoneNumber = (shippingAddress as any).phone
        }
        if (billingAddress && !billingAddress.phoneNumber && (billingAddress as any).phone) {
            billingAddress.phoneNumber = (billingAddress as any).phone
        }

        if (!deliveryOption || !paymentMethodId) {
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

        if (user) {
            // Fetch from user's cart
            const cartResult = await payload.find({
                collection: 'web-cart',
                where: { user: { equals: user.id } },
                depth: 2,
            });

            if (cartResult.docs.length > 0 && cartResult.docs[0].items && cartResult.docs[0].items.length > 0) {
                itemsToProcess = cartResult.docs[0].items.map((item: any) => ({
                    productId: typeof item.product === 'object' ? item.product.id : item.product,
                    variantId: item.vId,
                    quantity: item.quantity || 1,
                    productDoc: typeof item.product === 'object' ? item.product : null,
                }));
            }
        }

        // If not a user OR user has empty cart, check 'products' body field for guests/overrides
        if (itemsToProcess.length === 0 && products && Array.isArray(products) && products.length > 0) {
            itemsToProcess = products.map((p: any) => ({
                productId: p.productId,
                variantId: p.variantId,
                quantity: p.quantity || 1,
                productDoc: null,
            }));
        }

        if (itemsToProcess.length === 0) {
            return NextResponse.json({ error: 'Your cart/selection is empty' }, { status: 400 });
        }

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
            let productDoc = item.productDoc;

            if (!productDoc) {
                try {
                    productDoc = await payload.findByID({
                        collection: 'web-products',
                        id: item.productId,
                        depth: 1,
                    });
                } catch (e) {
                    return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
                }
            }

            if (!productDoc) {
                return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
            }

            let itemPrice = 0;

            if (item.variantId) {
                const selectedVariant = productDoc.variants?.find((v: any) => v.id === item.variantId);
                if (!selectedVariant) {
                    return NextResponse.json({ error: `Variant not found for product: ${productDoc.title}` }, { status: 400 });
                }

                // STOCK VALIDATION
                if (!selectedVariant.variantInStock) {
                    return NextResponse.json({ error: `${productDoc.title} variant is out of stock` }, { status: 400 });
                }
                if (typeof selectedVariant.variantStockQuantity === 'number' && selectedVariant.variantStockQuantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${productDoc.title} variant` }, { status: 400 });
                }

                itemPrice = selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice;
            } else {
                // STOCK VALIDATION
                if (!productDoc.inStock) {
                    return NextResponse.json({ error: `${productDoc.title} is out of stock` }, { status: 400 });
                }
                if (typeof productDoc.stockQuantity === 'number' && productDoc.stockQuantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${productDoc.title}` }, { status: 400 });
                }

                itemPrice = productDoc.salePrice || productDoc.regularPrice;
            }

            subtotal += itemPrice * item.quantity;
            orderItems.push({
                product: productDoc.id,
                variantID: item.variantId || "",
                quantity: item.quantity,
                price: itemPrice,
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
            const result = await validateCoupon(payload, appliedCouponCode, user as any, body.shopId);

            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: result.status || 400 });
            }

            const coupon = result.coupon;

            // Validate Minimum Amount
            if (subtotal < coupon.minimumAmount) {
                return NextResponse.json({
                    error: `Minimum order amount of AED ${coupon.minimumAmount} required for this coupon`
                }, { status: 400 });
            }

            // Calculate Coupon Discount
            if (coupon.applicability === 'all') {
                if (coupon.discountType === 'percentage') {
                    couponDiscount = subtotal * (coupon.discountAmount / 100);
                } else {
                    couponDiscount = Math.min(coupon.discountAmount, subtotal);
                }
            } else if (coupon.applicability === 'products') {
                // Apply only to eligible products
                const eligibleProducts = (coupon.products as any[])?.map((p: any) => typeof p === 'object' ? p.id : p) || [];
                let eligibleSubtotal = 0;

                orderItems.forEach(item => {
                    if (eligibleProducts.includes(item.product)) {
                        eligibleSubtotal += (item.price * item.quantity);
                    }
                });

                if (eligibleSubtotal === 0) {
                    return NextResponse.json({ error: 'Coupon is not applicable to any products in your cart' }, { status: 400 });
                }

                if (coupon.discountType === 'percentage') {
                    couponDiscount = eligibleSubtotal * (coupon.discountAmount / 100);
                } else {
                    couponDiscount = Math.min(coupon.discountAmount, eligibleSubtotal);
                }
            }

            couponId = coupon.id;
        }

        const totalAfterDiscounts = Math.max(0, subtotal - wtDiscount - couponDiscount);
        const taxAmount = totalAfterDiscounts * (taxRate / 100);
        const finalTotal = totalAfterDiscounts + shippingCharge + taxAmount;

        // --- CREATE PAYLOAD ORDER ---
        try {
            const orderDoc = await payload.create({
                collection: 'web-orders',
                data: {
                    customerType: user ? 'user' : 'guest',
                    user: user?.id,
                    deliveryOption,
                    origin: 'one-time',
                    items: orderItems,
                    shippingAddress: deliveryOption === 'delivery' ? shippingAddress : undefined,
                    billingAddress: shippingAddressAsBillingAddress ? shippingAddress : billingAddress,
                    paymentStatus: 'pending',
                    couponCode: couponId as any,
                    pointsUsed: wtPointsUsed,
                    financials: {
                        subtotal,
                        discountAmount: wtDiscount + couponDiscount,
                        total: finalTotal,
                    },
                },
                overrideAccess: true,
            });

            // --- CREATE STRIPE PAYMENT INTENT ---
            try {
                const customerEmail = (user as any)?.email || email;
                if (!customerEmail) {
                    return NextResponse.json({ error: 'Email is required for checkout' }, { status: 400 });
                }

                // Get or Create Customer
                const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
                let stripeCustomerId: string;

                if (existingCustomers.data.length > 0) {
                    stripeCustomerId = existingCustomers.data[0].id;
                    await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
                    await stripe.customers.update(stripeCustomerId, {
                        invoice_settings: { default_payment_method: paymentMethodId },
                    });
                } else {
                    const customer = await stripe.customers.create({
                        email: customerEmail,
                        payment_method: paymentMethodId,
                        invoice_settings: { default_payment_method: paymentMethodId },
                    });
                    stripeCustomerId = customer.id;
                }

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(finalTotal * 100),
                    currency: 'aed',
                    customer: stripeCustomerId,
                    payment_method: paymentMethodId,
                    off_session: false,
                    confirm: true,
                    metadata: {
                        db_order_id: orderDoc.id,
                        order_type: 'one-time',
                    },
                    return_url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/checkout/success?orderId=${orderDoc.id}`,
                });

                return NextResponse.json({
                    success: true,
                    message: "Order created successfully",
                    clientSecret: paymentIntent.client_secret,
                    dbOrderId: orderDoc.id,
                }, { status: 200 });

            } catch (stripeError: any) {
                console.error('Stripe Error:', stripeError);
                return NextResponse.json({ error: stripeError.message || 'Payment processing failed' }, { status: 500 });
            }
        } catch (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }
    } catch (error) {
        console.error('Global Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
