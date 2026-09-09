import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';
import { calculateWTCoinsDiscount } from '../_components/validateAndCalculateWTCoins';
import { stripe } from "@/lib/stripe";
import { validateAppCoupon } from '@/collections/Shop/endpoints/coupons/components/shopCouponUtils';
import { calculateCouponDiscount } from '../_components/calculateCouponDiscount';
import crypto from 'crypto';
import { sql } from '@payloadcms/db-postgres';

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

        let body: any;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
        }

        const {
            paymentMethodId,
            useWTCoins,
            specialInstructions,
            orderType,
            appliedCouponCode,
            timeSelection,
            stampRewards,
            selectedSlot,
        } = body || {};
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

        // --- SHOP VALIDATION (open status, operating day, hours) ---
        const shopDoc = await payload.findByID({
            collection: 'shop',
            id: shopId,
            depth: 0,
            overrideAccess: true,
        }) as any;

        if (!shopDoc) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        // 1. Live open/closed toggle
        if (!shopDoc.isShopOpen) {
            return NextResponse.json({ error: 'This shop is currently closed.' }, { status: 400 });
        }

        // 2. Operating day check
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
        const todayName = dayNames[now.getDay()];
        const operatingDays = shopDoc.operationalSettings?.operatingDays;
        if (operatingDays && !operatingDays[todayName]) {
            const label = todayName.charAt(0).toUpperCase() + todayName.slice(1);
            return NextResponse.json({ error: `This shop is not open on ${label}s.` }, { status: 400 });
        }

        // 3. Operating hours check (times stored as ISO strings; compare UTC hours/minutes)
        const openingTime = shopDoc.operationalSettings?.openingTime;
        const closingTime = shopDoc.operationalSettings?.closingTime;
        if (openingTime && closingTime) {
            const toUTCMinutes = (iso: string) => {
                const d = new Date(iso);
                return d.getUTCHours() * 60 + d.getUTCMinutes();
            };
            const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
            if (nowMinutes < toUTCMinutes(openingTime) || nowMinutes >= toUTCMinutes(closingTime)) {
                return NextResponse.json({ error: 'This shop is currently outside its operating hours.' }, { status: 400 });
            }
        }

        // --- SLOT CAPACITY CHECK ---
        let slotDoc: any = null;
        if (selectedSlot) {
            const slotId = !isNaN(Number(selectedSlot)) ? Number(selectedSlot) : selectedSlot;
            slotDoc = await payload.findByID({
                collection: 'slots',
                id: slotId,
                depth: 0,
                overrideAccess: true,
            }) as any;

            if (!slotDoc) {
                return NextResponse.json({ error: 'Selected slot not found.' }, { status: 400 });
            }
            if (!slotDoc.isActive) {
                return NextResponse.json({ error: 'The selected slot is not currently accepting bookings.' }, { status: 400 });
            }
            const currentLoad = slotDoc.currentLoad || 0;
            const maxCapacity = slotDoc.maxCapacity || 0;
            if (currentLoad >= maxCapacity) {
                return NextResponse.json({ error: 'The selected slot is fully booked. Please choose another slot.' }, { status: 400 });
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
            //
            // Bug fix: this used to match on `selection.sectionTitle` +
            // `selection.label` — fields the cart's saved customizations
            // never actually had (they carry `selectedOptionId` /
            // `selectedOptionLabel`, matching what the app sends when
            // adding to cart). So this block never matched anything, never
            // added a single add-on's price to itemPrice, and — since the
            // `if` just guarded skipping rather than throwing — never
            // errored either, so the gap was invisible until customizations
            // started actually reaching this point (see beforeCartChange.ts
            // for the earlier link in this same chain).
            //
            // Matches by the option's own id first, falling back to label
            // text, mirroring the same two-strategy lookup now used when the
            // cart snapshot is built. A selection that still can't be
            // verified against the live menu just doesn't contribute price
            // (rather than rejecting the whole checkout) — being this is the
            // first time this validation has ever actually run against real
            // data, hard-failing checkout on an edge-case mismatch would be
            // worse than a single add-on silently costing nothing.
            if (item.customizations && Array.isArray(item.customizations)) {
                const sourceCustomizations = productDoc.customizations as any[];
                if (sourceCustomizations && Array.isArray(sourceCustomizations)) {
                    const byId = new Map<string, number>();
                    const byLabel = new Map<string, number>();
                    sourceCustomizations.forEach((panel: any) => {
                        if (panel.sections && Array.isArray(panel.sections)) {
                            panel.sections.forEach((section: any) => {
                                const addOption = (opt: any) => {
                                    if (!opt?.label) return;
                                    const price = opt.price ?? 0;
                                    if (opt.id != null) byId.set(String(opt.id), price);
                                    byLabel.set(String(opt.label).trim().toLowerCase(), price);
                                };
                                // Case 1: grouped options
                                if (section.groups && Array.isArray(section.groups) && section.groups.length > 0) {
                                    section.groups.forEach((group: any) => {
                                        if (group.options && Array.isArray(group.options)) {
                                            group.options.forEach(addOption);
                                        }
                                    });
                                }
                                // Case 2: flat options (no groups)
                                if (section.options && Array.isArray(section.options)) {
                                    section.options.forEach(addOption);
                                }
                            });
                        }
                    });

                    for (const selection of item.customizations) {
                        const selectedOptionId = String(selection?.selectedOptionId ?? selection?.optionId ?? "");
                        const selectedOptionLabel = String(selection?.selectedOptionLabel ?? selection?.label ?? "").trim().toLowerCase();
                        const price =
                            (selectedOptionId && byId.get(selectedOptionId)) ??
                            (selectedOptionLabel && byLabel.get(selectedOptionLabel)) ??
                            null;
                        if (price != null) {
                            itemPrice += price;
                        } else if (selectedOptionId || selectedOptionLabel) {
                            console.warn(`[cafe-checkout] Could not verify customization option against menu — not charging for it`, {
                                productId: productDoc.id,
                                selectedOptionId,
                                selectedOptionLabel,
                            });
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

            const discountResult = calculateCouponDiscount(result.coupon, subtotal, processedItems.map((item) => ({
                product: item.product,
                price: item.price,
                quantity: item.quantity,
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
                collection: 'surge-stamps',
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

            // Single query: fetch reward products and verify they are eligible + belong to this shop
            const rewardsDetails = await payload.find({
                collection: 'shop-menu',
                where: {
                    and: [
                        { id: { in: rewardProductsRequested } },
                        { isStampFreeProduct: { equals: true } },
                    ]
                },
                depth: 0,
                limit: 100,
                select: { id: true, shop: true }
            });

            const foundRewardIds = new Set(rewardsDetails.docs.map(p => String(p.id)));

            for (const productId of rewardProductsRequested) {
                if (!foundRewardIds.has(String(productId))) {
                    return NextResponse.json({ error: `Product ${productId} is not found or not eligible for stamp rewards.` }, { status: 400 });
                }

                const productDoc = rewardsDetails.docs.find(p => String(p.id) === String(productId));
                const rewardShopId = productDoc?.shop && typeof productDoc.shop === 'object' ? productDoc.shop.id : productDoc?.shop;

                if (String(rewardShopId) !== String(shopId)) {
                    return NextResponse.json({ error: `Reward product ${productId} does not belong to the selected shop.` }, { status: 400 });
                }
                stampRewardIds.push(productId);
            }

            // Add the redeemed product as a real order line too — this used
            // to only ever be recorded in the separate `stampRewards`
            // relationship (a validation/balance-deduction record), never in
            // `items`, so the barista dashboard never saw it and there was
            // nothing to actually prepare. Pushed AFTER subtotal/tax/total
            // are already computed above, so a free item never inflates the
            // bill. Tagged with a synthetic marker inside its own
            // (freeform-JSON) customizations array — the items schema has no
            // dedicated price/isReward column, and this is the one
            // unambiguous signal apiCafeOrders.ts (the app) and the invoice
            // reader need to render it as a AED 0 "FREE" row regardless of
            // whether the same product also appears elsewhere in the order
            // as a normal paid line.
            for (const rewardProductId of stampRewardIds) {
                processedItems.push({
                    product: rewardProductId,
                    quantity: 1,
                    customizations: [{ __rewardRedemption: true }],
                });
            }
        }

        // --- STRIPE CUSTOMER ---
        let stripeCustomerId: string;
        const savedStripeId = (user as any).stripeCustomerId;

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

        const orderData: any = {
            user: user?.id,
            email: (user as any).contactEmail ?? user.email,
            shop: shopId,
            items: processedItems,
            orderType: orderType,
            timeSelection: timeSelection,
            slot: selectedSlot,
            specialInstructions,
            appOrderStatus: orderType === 'take-away' ? 'pending' : undefined,
            appOrderStatusDine: orderType === 'dine-in' ? 'pending' : undefined,
            orderAcceptance: 'pending',
            financials: {
                subtotal,
                couponDiscount,
                surgeCoinsDiscount: wtDiscount,
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

        // Serialize concurrent bookings for the SAME slot — the capacity check
        // above is a fast-fail for the common case, but without a lock, two
        // near-simultaneous checkouts for the last remaining slot could both
        // pass that read before either order is created, overbooking it. A
        // second request for a DIFFERENT slot (or no slot at all) is unaffected
        // and proceeds immediately without any transaction overhead.
        //
        // Note: stamp-reward eligibility is deliberately NOT re-checked here.
        // The stamp balance itself is only ever decremented later, when payment
        // is confirmed (see deductStampRewards in appPaymentIntentSucceeded.ts,
        // now lock-protected against the same class of race) — creating an
        // order here never touches it. Re-reading the same untouched balance a
        // second time inside a lock would give false confidence without
        // actually closing anything, so it's intentionally left out; see the
        // audit notes for what a real fix here would require.
        let orderDoc: any;
        if (slotDoc) {
            const transactionID = await payload.db.beginTransaction()
            const txReq = transactionID ? ({ transactionID } as any) : undefined
            let committed = false
            try {
                if (transactionID) {
                    const tx = (payload.db as any).sessions?.[String(transactionID)]?.db
                    await payload.db.execute({ db: tx, sql: sql`SELECT pg_advisory_xact_lock(${Number(slotDoc.id)})` })
                }

                // Re-check capacity now that we hold the lock — the read above
                // can be stale if another booking for this exact slot committed
                // in the meantime.
                const freshSlot: any = await payload.findByID({
                    collection: 'slots',
                    id: slotDoc.id,
                    depth: 0,
                    overrideAccess: true,
                    req: txReq,
                })
                const freshLoad = freshSlot?.currentLoad || 0
                const freshCapacity = freshSlot?.maxCapacity || 0
                if (freshLoad >= freshCapacity) {
                    return NextResponse.json({ error: 'The selected slot is fully booked. Please choose another slot.' }, { status: 400 });
                }

                orderDoc = await (payload as any).create({
                    collection: 'app-orders',
                    data: orderData,
                    overrideAccess: true,
                    depth: 0,
                    select: { id: true },
                    req: txReq,
                });

                if (transactionID) {
                    await payload.db.commitTransaction(transactionID)
                    committed = true
                }
            } finally {
                // Guarantees the lock and connection are always released — on
                // the early "fully booked" return above as well as on any
                // thrown error — so a failed/short-circuited request can never
                // leave a transaction open.
                if (transactionID && !committed) {
                    await payload.db.rollbackTransaction(transactionID).catch(() => {})
                }
            }
        } else {
            orderDoc = await (payload as any).create({
                collection: 'app-orders',
                data: orderData,
                overrideAccess: true,
                depth: 0,
                select: { id: true },
            });
        }

        // Create Payment Intent (Deferred Flow)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalTotal * 100),
            currency: 'aed',
            customer: stripeCustomerId,
            setup_future_usage: 'off_session',
            automatic_payment_methods: { enabled: true },
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
            dbOrderId: String(orderDoc.id),
            stripeCustomerId,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Cafe Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
