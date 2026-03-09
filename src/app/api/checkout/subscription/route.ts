import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import crypto from 'crypto';
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';

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
            email,
            product,
            useWTCoins,
        } = body

        // --- DATA NORMALIZATION ---
        // Handle legacy 'phone' key from frontend/cache
        if (shippingAddress && !shippingAddress.phoneNumber && (shippingAddress as any).phone) {
            shippingAddress.phoneNumber = (shippingAddress as any).phone
        }
        if (billingAddress && !billingAddress.phoneNumber && (billingAddress as any).phone) {
            billingAddress.phoneNumber = (billingAddress as any).phone
        }

        if (!deliveryOption || !product) {
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

        if (!product.quantity || !product.productId || !product.subscriptionId) {
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
                depth: 1,
                where: { id: { equals: product.productId } },
                select: {
                    name: true,
                    regularPrice: true,
                    salePrice: true,
                    variants: true,
                    inStock: true,
                    stockQuantity: true,
                    subFreq: true,
                    subscriptionDiscount: true,
                }
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

            const productPrice = validatedData.salePrice || validatedData.regularPrice
            const totalPrice = productPrice * product.quantity
            const totalDiscount = totalPrice * (validatedData.discount / 100)
            const priceAfterSubDiscount = totalPrice - totalDiscount

            // CALCULATE WHITEMANTIS COINS

            const finalPrice: number = priceAfterSubDiscount
            let wtPointsUsed = 0;
            let wtDiscount = 0;
            let wtRemainingBalance = 0;

            if (useWTCoins) {
                if (!user) {
                    return NextResponse.json({ error: 'Please Login to use WT Coins' }, { status: 401 });
                }

                const result = await calculateWTCoinsDiscount(payload, user.id, priceAfterSubDiscount);

                // If the function returned an error object, return it to the client
                if ('error' in result) {
                    return NextResponse.json({ error: result.error }, { status: result.status });
                }

                // Otherwise, use the calculated values
                wtDiscount = result.discount;
                wtPointsUsed = result.pointsUsed;
                wtRemainingBalance = result.remainingBalance;
            }

            const totalAfterDiscount = priceAfterSubDiscount - wtDiscount;
            const totalWithShipping = totalAfterDiscount + shippingCharge;
            const taxAmount = totalWithShipping * (taxRate / 100);
            const finalTotal = totalWithShipping + taxAmount;

            // CREATE PAYLOAD SUBSCRIPTION

            let guestAccessToken: string | null = null;
            if (!user) {
                guestAccessToken = crypto.randomBytes(32).toString('hex');
            }

            try {
                const subscriptionDoc = await (payload as any).create({
                    collection: 'web-subscription',
                    data: {
                        customerType: user ? 'user' : 'guest',
                        user: user?.id,
                        email: (user as any)?.email || email,
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
                        guestAccessToken: guestAccessToken,
                        financials: {
                            subtotal: totalPrice,
                            subscriptionDiscount: totalDiscount,
                            wtCoinsDiscount: wtDiscount,
                            shippingCharge,
                            taxAmount,
                            total: finalTotal,
                        }
                    },
                    depth: 0,
                    select: { id: true, guestAccessToken: true }
                });

                if (subscriptionDoc.guestAccessToken) {
                    guestAccessToken = subscriptionDoc.guestAccessToken;
                }

                if (!subscriptionDoc) {
                    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
                }

                // CREATE STRIPE SUBSCRIPTION

                try {

                    // Get or Create Stripe Customer
                    // Priority: 1) stripeCustomerId saved on user, 2) search by email, 3) create new
                    let stripeCustomerId: any;
                    const savedStripeId = user ? (user as any).stripeCustomerId : null;

                    if (savedStripeId) {
                        stripeCustomerId = savedStripeId;
                    } else {
                        const existingCustomers = await stripe.customers.list({ email, limit: 1 });

                        if (existingCustomers.data.length > 0) {
                            stripeCustomerId = existingCustomers.data[0].id;
                        } else {
                            const customer = await stripe.customers.create({
                                email,
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

                    // CREATE STRIPE SUBSCRIPTION

                    // Calculate the recurring price with tax AFTER WT Coins discount (matching frontend)
                    const baseAmountAfterWTCoins = priceAfterSubDiscount - wtDiscount;
                    const totalWithShippingAfterWT = baseAmountAfterWTCoins + shippingCharge;
                    const taxOnDiscountedAmount = totalWithShippingAfterWT * (taxRate / 100);
                    const recurringTotal = totalWithShippingAfterWT + taxOnDiscountedAmount;

                    // For first payment, we don't need a coupon since tax is already calculated after WT discount
                    // For recurring payments, the full price (without WT discount) will be charged
                    const recurringTotalWithoutWTDiscount = priceAfterSubDiscount + shippingCharge + (priceAfterSubDiscount + shippingCharge) * (taxRate / 100);

                    // Create a one-time coupon for WTCoins discount if applicable
                    let stripeCouponId: string | undefined;
                    if (wtDiscount > 0) {
                        try {
                            // Calculate the discount amount including the tax difference
                            // Frontend shows: tax after WT discount
                            // We need to discount: WT amount + (tax on WT amount)
                            const taxOnWTDiscount = wtDiscount * (taxRate / 100);
                            const totalDiscountWithTax = wtDiscount + taxOnWTDiscount;

                            const coupon = await stripe.coupons.create({
                                amount_off: Math.round(totalDiscountWithTax * 100),
                                currency: 'aed',
                                duration: 'once',
                                name: crypto.randomBytes(20).toString('hex'),
                            });
                            stripeCouponId = coupon.id;
                        } catch (couponError) {
                            console.error('Error creating Stripe coupon:', couponError);
                            return NextResponse.json({ error: 'Failed to apply WT Coins discount' }, { status: 500 });
                        }
                    }

                    const subscription: any = await stripe.subscriptions.create({
                        customer: stripeCustomerId,
                        items: [
                            {
                                price_data: {
                                    currency: "aed",
                                    product: process.env.STRIPE_MASTER_PRODUCT_ID as string,
                                    unit_amount: Math.round(recurringTotalWithoutWTDiscount * 100), // Recurring uses full price
                                    recurring: {
                                        interval: (validatedData.frequency.interval as string).toLowerCase() as 'day' | 'week' | 'month' | 'year',
                                        interval_count: validatedData.frequency.duration,
                                    },
                                },
                            },
                        ],
                        discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
                        payment_behavior: "default_incomplete",
                        payment_settings: {
                            save_default_payment_method: "on_subscription",
                        },
                        metadata: {
                            db_subscription_id: subscriptionDoc.id,
                            guest_access_token: guestAccessToken || "", // Store token in Stripe metadata
                            order_type: 'subscription'
                        },
                        expand: [
                            "latest_invoice.payment_intent"
                        ]
                    });

                    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

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