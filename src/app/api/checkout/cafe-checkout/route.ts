import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { validateAppCoupon } from '@/collections/Shop/endpoints/coupons/components/shopCouponUtils';
import { calculateCouponDiscount } from '../_components/calculateCouponDiscount';

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
            paymentMethodId,
            useWTCoins,
            specialInstructions,
            orderType,
            appliedCouponCode,
            timeSelection,
            stampRewards,
            selectedSlot,
        } = body
        let { shopId, selectedBarista, menuItems } = body

        // --- ID TYPE CONVERSION (Ensure numeric IDs are numbers, not strings) ---
        if (shopId && !isNaN(Number(shopId))) {
            shopId = Number(shopId);
        }
        if (selectedBarista && !isNaN(Number(selectedBarista))) {
            selectedBarista = Number(selectedBarista);
        }

        // Barista validation

        if (selectedBarista) {
            try {
                const barista = await payload.find({
                    collection: 'admins',
                    where: {
                        and: [
                            { id: { equals: selectedBarista } },
                            { role: { equals: 'barista' } }
                        ]
                    },
                    limit: 1,
                    depth: 0,
                });

                if (barista.docs.length === 0) {
                    return NextResponse.json({ error: 'Selected barista not found.' }, { status: 400 });
                }

                const baristaDoc = barista.docs[0];

                if (baristaDoc.role !== 'barista') {
                    return NextResponse.json({ error: 'Selected barista is not a barista.' }, { status: 400 });
                }
            } catch (error) {
                return NextResponse.json({ error: 'Failed to validate barista.' }, { status: 500 });
            }
        }

        const carts = await payload.find({
            collection: 'app-cart',
            where: {
                and: [
                    { user: { equals: user.id } },
                    { origin: { equals: 'cafe' } }
                ]
            },
            limit: 1,
            depth: 2,
        });

        const cart = carts.docs[0];

        if (!cart) {
            return NextResponse.json({ error: 'No active cafe cart found for this user.' }, { status: 400 });
        }

        if (cart && cart.items && cart.items.length > 0) {
            if (cart.shop && (typeof cart.shop === 'object' ? cart.shop.id : cart.shop) !== shopId) {
                // Try loose comparison as well
                const cartShopId = typeof cart.shop === 'object' ? cart.shop.id : cart.shop;
                if (String(cartShopId) !== String(shopId)) {
                    return NextResponse.json({ error: 'Cart contains items from a different shop. Please clear cart or switch shops.' }, { status: 400 })
                }
            }

            menuItems = cart.items.map((cartItem: any) => {
                const productId = cartItem.productId || (typeof cartItem.product === 'object' && cartItem.product.value
                    ? (typeof cartItem.product.value === 'object' ? cartItem.product.value.id : cartItem.product.value)
                    : (cartItem.product));

                const relationTo = cartItem.relationTo || (typeof cartItem.product === 'object' ? cartItem.product.relationTo : 'shop-menu');

                return {
                    product: productId,
                    relationTo: relationTo,
                    vId: cartItem.vId,
                    quantity: cartItem.quantity,
                    customizations: cartItem.customizations
                };
            });
        }

        if (!orderType || !shopId || !menuItems || menuItems.length === 0) {
            return NextResponse.json({ error: 'Missing required fields or empty menu items' }, { status: 400 })
        }

        // --- 2. VALIDATE ITEMS & CALCULATE SUBTOTAL (BATCH QUERY) ---
        const productIds = menuItems.map((item: any) => {
            const product = item.product;
            return typeof product === 'object' && product !== null
                ? (product.value && typeof product.value === 'object' ? product.value.id : (product.value || product.id))
                : product;
        }).filter(Boolean);

        const productsFetched = await payload.find({
            collection: 'shop-menu',
            where: {
                id: { in: productIds }
            },
            depth: 0,
            limit: 100,
            select: {
                name: true,
                salePrice: true,
                regularPrice: true,
                shop: true,
                customizations: true,
            }
        });

        const productMap = new Map(productsFetched.docs.map(p => [String(p.id), p]));

        let subtotal = 0;
        const processedItems: any[] = [];

        for (const item of menuItems) {
            const product = item.product;
            const productId = typeof product === 'object' && product !== null
                ? (product.value && typeof product.value === 'object' ? product.value.id : (product.value || product.id))
                : product;

            if (!productId) {
                return NextResponse.json({ error: `Invalid product ID in menu items` }, { status: 400 });
            }

            const productDoc: any = productMap.get(String(productId));

            if (!productDoc) {
                return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
            }

            // Verify shop ownership
            const docShopId = productDoc.shop && (typeof productDoc.shop === 'object' ? productDoc.shop.id : productDoc.shop);
            if (docShopId !== shopId) {
                return NextResponse.json({ error: `Item ${productDoc.name} does not belong to the selected shop.` }, { status: 400 });
            }

            // Calculate item base price
            let itemPrice = productDoc.salePrice || productDoc.regularPrice || 0;

            // Validate Customizations
            if (item.customizations && Array.isArray(item.customizations)) {
                const sourceCustomizations = productDoc.customizations as any[];
                if (sourceCustomizations && Array.isArray(sourceCustomizations)) {
                    // Create a flat map of available options: "Section Title:Option Label" -> Price
                    const availableOptions = new Map<string, number>();
                    sourceCustomizations.forEach((panel: any) => {
                        if (panel.sections && Array.isArray(panel.sections)) {
                            panel.sections.forEach((section: any) => {
                                if (section.options && Array.isArray(section.options)) {
                                    section.options.forEach((opt: any) => {
                                        availableOptions.set(`${section.title}:${opt.label}`, opt.price || 0);
                                    });
                                }
                            });
                        }
                    });

                    for (const selection of item.customizations) {
                        if (selection.sectionTitle && selection.label) {
                            const key = `${selection.sectionTitle}:${selection.label}`;
                            if (availableOptions.has(key)) {
                                itemPrice += availableOptions.get(key)!;
                            } else {
                                return NextResponse.json({ error: `Invalid customization option selected: ${selection.label} in ${selection.sectionTitle}` }, { status: 400 });
                            }
                        }
                    }
                }
            }

            subtotal += itemPrice * (item.quantity || 1);
            processedItems.push({
                product: productDoc.id,
                quantity: item.quantity || 1,
                price: itemPrice,
                customizations: item.customizations || {},
            });
        }

        console.log('Processed Items for Order:', JSON.stringify(processedItems, null, 2));

        // --- TAX AND DISCOUNTS ---
        const shipAndTax = await payload.findGlobal({
            slug: 'ship-and-tax',
            depth: 0,
            select: {
                tax: true,
            }
        });
        const taxRate = shipAndTax?.tax || 0;

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

        // --- COUPON VALIDATION ---
        let couponDiscount = 0;
        let couponId: string | number | null = null;
        if (appliedCouponCode) {
            const result = await validateAppCoupon(payload, appliedCouponCode, user as any, shopId);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: result.status || 400 });
            }

            const discountResult = calculateCouponDiscount(result.coupon, subtotal, processedItems.map(item => ({
                product: typeof item.product.value === 'object' ? item.product.value.id : item.product.value,
                price: item.price,
                quantity: item.quantity
            })));

            if ('error' in discountResult) {
                return NextResponse.json({ error: discountResult.error }, { status: discountResult.status });
            }

            couponDiscount = discountResult.discount;
            couponId = discountResult.couponId;
        }

        const totalAfterDiscounts = Math.max(0, subtotal - wtDiscount - couponDiscount);
        const taxAmount = totalAfterDiscounts * (taxRate / 100);
        const finalTotal = totalAfterDiscounts + taxAmount;

        const stampRewardIds: any = []

        if (stampRewards) {
            const userStamps = await payload.find({
                collection: 'wt-stamps',
                where: { user: { equals: user.id } },
                limit: 1,
                depth: 0,
                select: { stampReward: true }
            });

            const availableRewards = userStamps.docs[0]?.stampReward || 0;
            const rewardProductsRequested = Array.isArray(stampRewards) ? stampRewards : [stampRewards];

            if (rewardProductsRequested.length > availableRewards) {
                return NextResponse.json({ error: `Insufficient stamp rewards. You have ${availableRewards} available.` }, { status: 400 });
            }

            const stampRewardProductsGlobal = await payload.findGlobal({
                slug: 'stamp-reward-products',
                depth: 0,
            });

            const validStampProductIds = (stampRewardProductsGlobal?.stampProducts || []).map((p: any) => typeof p === 'object' ? p.id : p);

            const rewardsDetails = await payload.find({
                collection: 'shop-menu',
                where: { id: { in: rewardProductsRequested } },
                depth: 0,
                limit: 100,
                select: { shop: true }
            });

            for (const productId of rewardProductsRequested) {
                const productDoc = rewardsDetails.docs.find(p => String(p.id) === String(productId));
                if (!productDoc) {
                    return NextResponse.json({ error: `Reward product not found: ${productId}` }, { status: 404 });
                }
                if (!validStampProductIds.includes(productId)) {
                    return NextResponse.json({ error: `Product ${productId} is not eligible for stamp rewards.` }, { status: 400 });
                }
                const rewardShopId = productDoc.shop && typeof productDoc.shop === 'object' ? productDoc.shop.id : productDoc.shop;
                if (!rewardShopId || rewardShopId !== shopId) {
                    return NextResponse.json({ error: `Reward product ${productId} does not belong to the selected shop.` }, { status: 400 });
                }
                stampRewardIds.push(productId);
            }
        }

        // --- STRIPE CUSTOMER ---
        let stripeCustomerId: string;
        const savedStripeId = (user as any).stripeCustomerId;

        if (savedStripeId) {
            stripeCustomerId = savedStripeId;
        } else {
            const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (existingCustomers.data.length > 0) {
                stripeCustomerId = existingCustomers.data[0].id;
            } else {
                const customer = await stripe.customers.create({
                    email: user.email,
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

        // --- CREATE ORDER ---
        const orderData: any = {
            user: user?.id,
            email: user.email,
            shop: shopId,
            items: processedItems,
            orderType: orderType,
            timeSelection: timeSelection,
            slot: selectedSlot,
            specialInstructions,
            appOrderStatus: 'pending',
            orderAcceptance: 'pending',
            financials: {
                subtotal,
                couponDiscount,
                wtCoinsDiscount: wtDiscount,
                taxAmount,
                total: finalTotal,
            },
            isCouponUsed: !!couponId,
            coupon: couponId,
            barista: selectedBarista,
            coinsUsed: wtPointsUsed,
            stampRewards: stampRewardIds,
        };

        console.log('Creating Order with Data:', JSON.stringify(orderData, null, 2));

        const orderDoc = await (payload as any).create({
            collection: 'app-orders',
            data: orderData,
            overrideAccess: true,
            depth: 0,
            select: { id: true },
        });

        // Create Payment Intent (Deferred Flow)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalTotal * 100),
            currency: 'aed',
            customer: stripeCustomerId,
            setup_future_usage: 'off_session',
            metadata: {
                db_order_id: orderDoc.id,
                order_type: 'cafe',
            },
        });

        // Update order with stripe info
        await payload.update({
            collection: 'app-orders',
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

    } catch (error: any) {
        console.error('Cafe Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}