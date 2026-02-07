import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getNextHeaders } from 'next/headers';

export async function POST(req: NextRequest) {
    try {

        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const headers = await getNextHeaders();

        const authResult = await payload.auth({
            headers,
        });
        const { user } = authResult;
        console.log('Authenticated User:', user?.email);

        const body = await req.json();
        const {
            shippingAddress,
            billingAddress,
            deliveryOption,
            shippingAddressAsBillingAddress,
            paymentMethodId,
            email,
            product,
        } = body

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

        // Tax and Shipping
        let tax: any = 0
        let shipping: any = 0
        try {
            const taxAndShippingResult = await payload.findGlobal({
                slug: 'ship-and-tax',
                depth: 1,
            })

            if (!taxAndShippingResult) {
                return NextResponse.json({ error: 'Tax and shipping not found' }, { status: 404 })
            }
            tax = taxAndShippingResult?.tax

            if (shippingAddress.emirates === 'abu_dhabi') {
                shipping = taxAndShippingResult?.emirateCharges?.abu_dhabi
            } else if (shippingAddress.emirates === 'dubai') {
                shipping = taxAndShippingResult?.emirateCharges?.dubai
            } else if (shippingAddress.emirates === 'sharjah') {
                shipping = taxAndShippingResult?.emirateCharges?.sharjah
            } else if (shippingAddress.emirates === 'ajman') {
                shipping = taxAndShippingResult?.emirateCharges?.ajman
            } else if (shippingAddress.emirates === 'umm_al_quwain') {
                shipping = taxAndShippingResult?.emirateCharges?.umm_al_quwain
            } else if (shippingAddress.emirates === 'ras_al_khaimah') {
                shipping = taxAndShippingResult?.emirateCharges?.ras_al_khaimah
            } else if (shippingAddress.emirates === 'fujairah') {
                shipping = taxAndShippingResult?.emirateCharges?.fujairah
            } else {
                return NextResponse.json({ error: 'Invalid emirates' }, { status: 400 })
            }
        } catch (error) {
            console.error('Error fetching tax and shipping:', error)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }

        // Product Fetching
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
            const finalPrice = totalPrice - totalDiscount

            if (user) {
                const userRewards = await payload.find({
                    collection: 'user-rewards',
                    where: { user: { equals: user.id } },
                });

                if (!userRewards.docs.length) {
                    return NextResponse.json({ error: 'User rewards not found' }, { status: 404 });
                }

                const userRewardDoc = userRewards.docs[0];

                if (userRewardDoc.totalEarnedPoints < finalPrice) {
                    return NextResponse.json({ error: 'Insufficient user rewards' }, { status: 400 });
                }

                await payload.update({
                    collection: 'user-rewards',
                    id: userRewardDoc.id,
                    data: {
                        totalEarnedPoints: userRewardDoc.totalEarnedPoints - finalPrice,
                    },
                });
            }








            return NextResponse.json({ data: finalPrice }, { status: 200 })

        } catch (error) {
            console.error('Error fetching product:', error)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }
    } catch (error) {
        console.error('Error fetching Checkout Page', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}