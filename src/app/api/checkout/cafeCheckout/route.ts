import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';
import { validateCoupon } from '@/collections/Coupon/endpoints/couponUtils';

export const POST = async (req: NextRequest) => {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const { user } = await payload.auth({
            headers: await getNextHeaders(),
        })

        const body = await req.json();
        const {
            paymentMethodId,
            email,
            menuItems, // Array of { product, quantity, customizations }
            useWTCoins,
            specialInstructions,
            stampRewardIds,
            orderType,
            appliedCouponCode,
            shopId,
            timeSelection,
            slot,
        } = body

        if (!paymentMethodId || !email || !menuItems || !orderType || !shopId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // --- VALIDATE ITEMS AND CALCULATE SUBTOTAL ---
        let subtotal = 0;
        const processedItems: any[] = [];

        for (const item of menuItems) {
            const productId = typeof item.product === 'object' ? item.product.id : item.product;

            let productDoc;
            try {
                productDoc = await payload.findByID({
                    collection: 'shop-menu',
                    id: productId,
                    depth: 0,
                });
            } catch (e) {
                return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
            }

            if (!productDoc) {
                return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
            }

            // Verify shop ownership
            if (productDoc.shop !== shopId && (typeof productDoc.shop === 'object' && productDoc.shop.id !== shopId)) {
                return NextResponse.json({ error: `Item ${productDoc.name} does not belong to the selected shop.` }, { status: 400 });
            }

            // Calculate item base price
            let itemPrice = productDoc.salePrice || productDoc.regularPrice || 0;

            // Add customization prices
            if (item.customizations && Array.isArray(item.customizations)) {
                for (const panel of item.customizations) {
                    if (panel.sections && Array.isArray(panel.sections)) {
                        for (const section of panel.sections) {
                            if (section.options && Array.isArray(section.options)) {
                                for (const option of section.options) {
                                    if (option.enabled) {
                                        itemPrice += (option.price || 0);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            subtotal += itemPrice * (item.quantity || 1);
            processedItems.push({
                product: productId,
                quantity: item.quantity || 1,
                customizations: item.customizations || null,
            });
        }

        if (processedItems.length === 0) {
            return NextResponse.json({ error: 'No items to process' }, { status: 400 });
        }

        // --- TAX AND DISCOUNTS ---
        const { taxRate } = await calculateTaxAndShipping(payload, 'pickup'); // Defaults to pickup for tax

        let wtDiscount = 0;
        let wtPointsUsed = 0;
        if (useWTCoins && user) {
            const result = await calculateWTCoinsDiscount(payload, user.id, subtotal);
            if ('error' in result) {
                return NextResponse.json({ error: result.error }, { status: result.status });
            }
            wtDiscount = result.discount;
            wtPointsUsed = result.pointsUsed;
        }

        let couponDiscount = 0;
        let couponId = null;
        if (appliedCouponCode) {
            const result = await validateCoupon(payload, appliedCouponCode, user as any, shopId);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: result.status || 400 });
            }
            const coupon = result.coupon;
            if (subtotal < coupon.minimumAmount) {
                return NextResponse.json({ error: `Minimum order amount of AED ${coupon.minimumAmount} required.` }, { status: 400 });
            }

            if (coupon.discountType === 'percentage') {
                couponDiscount = subtotal * (coupon.discountAmount / 100);
            } else {
                couponDiscount = Math.min(coupon.discountAmount, subtotal);
            }
            couponId = coupon.id;
        }

        const totalAfterDiscounts = Math.max(0, subtotal - wtDiscount - couponDiscount);
        const taxAmount = totalAfterDiscounts * (taxRate / 100);
        const finalTotal = totalAfterDiscounts + taxAmount;

        // --- STRIPE ---
        const customerEmail = user?.email || email;
        const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
        let stripeCustomerId;

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

        // --- CREATE ORDER ---
        const orderDoc = await payload.create({
            collection: 'app-orders',
            data: {
                user: user?.id,
                shop: shopId,
                items: processedItems,
                orderType,
                timeSelection,
                slot,
                specialInstructions,
                appOrderStatus: 'pending' as any, // Replaces orderAppStatus
                orderAcceptance: 'pending',
                financials: {
                    subtotal,
                    discountAmount: wtDiscount + couponDiscount,
                    total: finalTotal,
                },
                isCouponUsed: !!couponId,
                coupon: couponId as any,
                coinsUsed: wtPointsUsed,
            } as any,
            overrideAccess: true,
        });

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalTotal * 100),
            currency: 'aed',
            customer: stripeCustomerId,
            payment_method: paymentMethodId,
            off_session: false,
            confirm: true,
            metadata: {
                db_order_id: orderDoc.id,
                order_type: 'app-order',
            },
            return_url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/checkout/success?orderId=${orderDoc.id}`,
        });

        // Update order with stripe info
        await payload.update({
            collection: 'app-orders',
            id: orderDoc.id,
            data: {
                stripeOrderId: paymentIntent.id,
                stripeData: paymentIntent as any,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            clientSecret: paymentIntent.client_secret,
            dbOrderId: orderDoc.id,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Cafe Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}