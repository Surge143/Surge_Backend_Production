import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import crypto from 'crypto';
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
            product,
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

        if (!deliveryOption || !paymentMethodId || !product) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (deliveryOption === 'delivery' && !shippingAddress) {
            return NextResponse.json({ error: 'Missing shipping address' }, { status: 400 })
        }

        if (deliveryOption === 'pickup' && !billingAddress) {
            return NextResponse.json({ error: 'Missing billing address' }, { status: 400 })
        }

        if (!shippingAddressAsBillingAddress) {
            if (!billingAddress) {
                return NextResponse.json({ error: 'Missing billing address' }, { status: 400 })
            }
        }

        if (!product.variantId || !product.quantity || !product.productId || !product.subscriptionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // TAX AND SHIPPING FETCHING
        let taxRate = 0;
        let shippingCharge = 0;
        try {
            const result = await calculateTaxAndShipping(payload, deliveryOption, shippingAddress);
            taxRate = result.taxRate;
            shippingCharge = result.shippingCharge;
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // PRODUCT FETCHING AND VALIDATION
        try {
            const productResult = await payload.find({
                collection: 'web-products',
                depth: 3,
                where: { id: { equals: product.productId } },
            });

            if (!productResult.docs.length) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            const productDoc = productResult.docs[0];

            let validatedData: any = null;

            if (product.variantId) {
                const selectedVariant = productDoc.variants?.find((v: any) => v.id === product.variantId);

                if (!selectedVariant) {
                    return NextResponse.json({ error: 'Invalid Variant ID' }, { status: 400 });
                }

                // --- STOCK VALIDATION FOR VARIANTS ---
                if (!selectedVariant.variantInStock) {
                    return NextResponse.json({ error: 'Selected variant is out of stock' }, { status: 400 });
                }

                if (typeof selectedVariant.variantStockQuantity === 'number' && selectedVariant.variantStockQuantity < product.quantity) {
                    return NextResponse.json({
                        error: `Insufficient stock for variant. Only ${selectedVariant.variantStockQuantity} units available.`
                    }, { status: 400 });
                }

                const selectedSub = product.subscriptionId
                    ? selectedVariant.subFreq?.find((s: any) => s.id === product.subscriptionId)
                    : null;

                if (product.subscriptionId && !selectedSub) {
                    return NextResponse.json({ error: 'Subscription plan not found for this variant' }, { status: 400 });
                }

                validatedData = {
                    frequency: selectedSub ? {
                        duration: selectedSub.duration,
                        interval: selectedSub.interval
                    } : null,
                    discount: selectedVariant.subscriptionDiscount,
                    regularPrice: selectedVariant.variantRegularPrice,
                    salePrice: selectedVariant.variantSalePrice
                };

            } else {
                const selectedSub = product.subscriptionId
                    ? productDoc.subFreq?.find((s: any) => s.id === product.subscriptionId)
                    : null;

                if (product.subscriptionId && !selectedSub) {
                    return NextResponse.json({ error: 'Subscription plan not found for this product' }, { status: 400 });
                }

                // --- STOCK VALIDATION FOR NON-VARIANTS ---
                if (!productDoc.inStock) {
                    return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 });
                }

                if (typeof productDoc.stockQuantity === 'number' && productDoc.stockQuantity < product.quantity) {
                    return NextResponse.json({
                        error: `Insufficient stock. Only ${productDoc.stockQuantity} units available.`
                    }, { status: 400 });
                }

                validatedData = {
                    frequency: selectedSub ? {
                        duration: selectedSub.duration,
                        interval: selectedSub.interval
                    } : null,
                    discount: productDoc.subscriptionDiscount,
                    regularPrice: productDoc.regularPrice,
                    salePrice: productDoc.salePrice
                };
            }

            let productPrice = validatedData.salePrice || validatedData.regularPrice
            let totalPrice = productPrice * product.quantity
            let totalDiscount = totalPrice * (validatedData.discount / 100)
            let priceAfterSubDiscount = totalPrice - totalDiscount

            // VALIDATE AND APPLY COUPON
            let couponDiscount = 0;
            let couponId: string | number | null = null;

            if (appliedCouponCode) {
                const result = await validateCoupon(payload, appliedCouponCode, user as any, body.shopId);

                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
                }

                const coupon = result.coupon;

                // Validate Minimum Amount
                if (priceAfterSubDiscount < coupon.minimumAmount) {
                    return NextResponse.json({
                        error: `Minimum order amount of AED ${coupon.minimumAmount} required for this coupon`
                    }, { status: 400 });
                }

                // Calculate Coupon Discount (apply to subscription-discounted price)
                if (coupon.discountType === 'percentage') {
                    couponDiscount = priceAfterSubDiscount * (coupon.discountAmount / 100);
                } else {
                    couponDiscount = Math.min(coupon.discountAmount, priceAfterSubDiscount);
                }

                couponId = coupon.id;
            }

            const priceAfterCoupon = priceAfterSubDiscount - couponDiscount;

            // CALCULATE WHITEMANTIS COINS

            let finalPrice: number = priceAfterCoupon
            let wtPointsUsed = 0;
            let wtDiscount = 0;
            let wtRemainingBalance = 0;

            if (useWTCoins) {
                if (!user) {
                    return NextResponse.json({ error: 'Please Login to use WT Coins' }, { status: 401 });
                }

                const result = await calculateWTCoinsDiscount(payload, user.id, priceAfterCoupon);

                // If the function returned an error object, return it to the client
                if ('error' in result) {
                    return NextResponse.json({ error: result.error }, { status: result.status });
                }

                // Otherwise, use the calculated values
                wtDiscount = result.discount;
                wtPointsUsed = result.pointsUsed;
                wtRemainingBalance = result.remainingBalance;
            }

            const totalAfterDiscount = priceAfterCoupon - wtDiscount;
            const taxAmount = totalAfterDiscount * (taxRate / 100);
            const finalTotal = totalAfterDiscount + shippingCharge + taxAmount;

            // CREATE PAYLOAD SUBSCRIPTION

            let guestAccessToken: string | null = null;
            if (!user) {
                guestAccessToken = crypto.randomBytes(32).toString('hex');
            }

            try {
                const subscriptionDoc = await payload.create({
                    collection: 'web-subscription',
                    data: {
                        customerType: user ? 'user' : 'guest',
                        user: user?.id,
                        deliveryOption: deliveryOption,
                        items: [
                            {
                                product: Number(product.productId),
                                variantID: product.variantId,
                                subFreqID: product.subscriptionId,
                                quantity: product.quantity,
                                price: productPrice,
                            }
                        ],
                        shippingAddress: shippingAddress,
                        billingAddress: billingAddress,
                        paymentStatus: 'pending',
                        pointsUsed: wtPointsUsed,
                        financials: {
                            subtotal: totalPrice,
                            discountAmount: totalDiscount + couponDiscount + wtDiscount,
                            total: finalTotal,
                        }
                    },
                    overrideAccess: true,
                })

                let guestAccessToken: string | null = null;
                if (subscriptionDoc.guestAccessToken) {
                    guestAccessToken = subscriptionDoc.guestAccessToken;
                }

                if (!subscriptionDoc) {
                    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
                }

                // CREATE STRIPE SUBSCRIPTION

                try {

                    const existingCustomers = await stripe.customers.list({
                        email: email,
                        limit: 1,
                    });

                    let stripeCustomerId: any;

                    if (existingCustomers.data.length > 0) {
                        // Customer exists - get their ID
                        stripeCustomerId = existingCustomers.data[0].id;

                        await stripe.paymentMethods.attach(paymentMethodId, {
                            customer: stripeCustomerId,
                        });

                        await stripe.customers.update(stripeCustomerId, {
                            invoice_settings: { default_payment_method: paymentMethodId },
                        });
                    } else {
                        // Create new customer
                        const customer = await stripe.customers.create({
                            email: email,
                            payment_method: paymentMethodId,
                            invoice_settings: { default_payment_method: paymentMethodId },
                        });
                        stripeCustomerId = customer.id;
                    }

                    // CREATE STRIPE SUBSCRIPTION

                    const subscription: any = await stripe.subscriptions.create({
                        customer: stripeCustomerId,
                        items: [
                            {
                                price_data: {
                                    currency: "aed",
                                    product: process.env.STRIPE_MASTER_PRODUCT_ID as string,
                                    unit_amount: Math.round(finalTotal * 100), // Stripe expects amounts in fils
                                    recurring: {
                                        interval: (validatedData.frequency.interval as string).toLowerCase() as 'day' | 'week' | 'month' | 'year',
                                        interval_count: validatedData.frequency.duration,
                                    },
                                },
                            },
                        ],
                        payment_behavior: "default_incomplete", // better alternative
                        payment_settings: { save_default_payment_method: "on_subscription" },
                        metadata: {
                            db_subscription_id: subscriptionDoc.id,
                            guest_access_token: guestAccessToken || "", // Store token in Stripe metadata
                        },
                        expand: [
                            "latest_invoice.confirmation_secret"
                        ]
                    });

                    const clientSecret = subscription.latest_invoice?.confirmation_secret?.client_secret;

                    const responseData: any = {
                        success: true,
                        message: "Subscription created successfully",
                        stripeSubscriptionId: subscription.id,
                        dbSubscriptionId: subscriptionDoc.id,
                        clientSecret,
                    };

                    if (guestAccessToken) {
                        responseData.guestAccessToken = guestAccessToken;
                        console.log("✅ Returning guest access token in subscription response");
                    }

                    return NextResponse.json(responseData, { status: 200 })

                } catch (error) {
                    console.error('Error creating subscription:', error);
                    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
                }
            } catch (error) {
                console.error('Error creating subscription order:', error);
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
            }
        } catch (error) {
            console.error('Error fetching product:', error)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }
    } catch (error) {
        console.error('Error fetching Checkout Page', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}