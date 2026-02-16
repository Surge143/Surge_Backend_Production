import { stripe } from "@/lib/stripe"
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from "@/lib/emailConfig";
import { orderConfirmationEmailTemplate } from "@/lib/emailTemplate";

export async function handleInvoicePaid(invoice: any) {
    const payload = await getPayload({ config })

    const stripeSubscriptionId = invoice.subscription
    if (!stripeSubscriptionId) {
        console.log('No subscription ID found in invoice')
        return
    }

    try {
        // 1. Retrieve the subscription from Stripe to get metadata
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        const dbSubscriptionId = stripeSubscription.metadata.db_subscription_id
        const guestAccessToken = stripeSubscription.metadata.guest_access_token

        if (!dbSubscriptionId) {
            console.error('No db_subscription_id found in Stripe subscription metadata')
            return
        }

        // 2. Fetch the web-subscription document
        const subscriptionDoc = await payload.findByID({
            collection: 'web-subscription',
            id: dbSubscriptionId,
        })

        if (!subscriptionDoc) {
            console.error(`Subscription document ${dbSubscriptionId} not found in Payload`)
            return
        }

        // 3. Determine if this is the first payment
        const isFirstInvoice = invoice.billing_reason === 'subscription_create';

        // 4. Create the web-orders document
        const orderData: any = {
            customerType: subscriptionDoc.customerType,
            user: subscriptionDoc.user ? (typeof subscriptionDoc.user === 'object' ? subscriptionDoc.user.id : subscriptionDoc.user) : null,
            deliveryOption: subscriptionDoc.deliveryOption,
            origin: 'subscription',
            newsAndOffers: subscriptionDoc.newsAndOffers,
            items: subscriptionDoc.items.map((item: any) => ({
                product: typeof item.product === 'object' ? item.product.id : item.product,
                variantID: item.variantID,
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: subscriptionDoc.shippingAddress,
            billingAddress: subscriptionDoc.billingAddress,
            paymentStatus: 'completed',
            deliveryStatus: 'placed',
            pointsUsed: isFirstInvoice ? (subscriptionDoc.pointsUsed || 0) : 0,
            financials: {
                subtotal: subscriptionDoc.financials.subtotal,
                discountAmount: (subscriptionDoc.financials.discountAmount || 0) + (isFirstInvoice ? (subscriptionDoc.financials.wtDiscount || 0) : 0),
                total: invoice.amount_paid / 100,
            },
            stripeOrderId: invoice.id,
            stripeData: {
                invoiceId: invoice.id,
                subscriptionId: stripeSubscriptionId,
                customerId: invoice.customer,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                hosted_invoice_url: invoice.hosted_invoice_url,
                receipt_url: invoice.charge ? (await stripe.charges.retrieve(invoice.charge as string)).receipt_url : null,
            },
        }

        const newOrder = await payload.create({
            collection: 'web-orders',
            data: orderData,
        })

        console.log(`✅ Created order ${newOrder.id} from subscription invoice ${invoice.id}`)

        // 5. Deduct WTCoins for the first order only
        if (isFirstInvoice && subscriptionDoc.user && subscriptionDoc.pointsUsed && subscriptionDoc.pointsUsed > 0) {
            const userId = typeof subscriptionDoc.user === 'object' ? subscriptionDoc.user.id : subscriptionDoc.user
            try {
                await deductWTCoins(payload, userId, subscriptionDoc.pointsUsed, newOrder.id)
            } catch (error) {
                console.error('Error deducting WTCoins for subscription:', error)
            }
        }

        // 6. Delete the Stripe Coupon if it exists (requested by user)
        const stripeDiscount = stripeSubscription.discounts || (stripeSubscription.discounts && stripeSubscription.discounts.length > 0 ? stripeSubscription.discounts[0] : null);

        if (isFirstInvoice && stripeDiscount?.coupon) {
            try {
                const couponId = stripeDiscount.coupon.id
                await stripe.coupons.del(couponId)
                console.log(`✅ Deleted Stripe Coupon ${couponId} after first subscription payment`)
            } catch (couponDelError) {
                console.error('Error deleting Stripe coupon:', couponDelError)
            }
        }

        // 7. Update Web Subscription status
        await payload.update({
            collection: 'web-subscription',
            id: dbSubscriptionId,
            data: {
                paymentStatus: 'completed',
                subsStatus: 'active',
                stripeSubscriptionID: stripeSubscriptionId,
                nextPaymentDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            },
        })

        // 8. Deduct Stock
        if (subscriptionDoc.items && subscriptionDoc.items.length > 0) {
            for (const item of subscriptionDoc.items) {
                try {
                    await updateProductStock(payload, typeof item.product === 'object' ? item.product.id : item.product, item.variantID, item.quantity)
                } catch (stockError) {
                    console.error('Error updating stock for subscription item:', stockError)
                }
            }
        }

        // 9. Send Email
        try {
            const userEmail = typeof subscriptionDoc.user === 'object' && subscriptionDoc.user?.email
                ? subscriptionDoc.user.email
                : subscriptionDoc.billingAddress?.email || subscriptionDoc.shippingAddress?.email || invoice.customer_email

            if (userEmail) {
                await sendEmail({
                    to: userEmail,
                    subject: isFirstInvoice ? "Subscription Started - White Mantis" : "Subscription Renewal - White Mantis",
                    body: `Your subscription order #${newOrder.id} has been processed successfully.`,
                    html: orderConfirmationEmailTemplate({ order: newOrder }),
                })
                console.log(`✅ Subscription confirmation email sent to ${userEmail}`)
            }
        } catch (emailError) {
            console.error('Error sending subscription email:', emailError)
        }

    } catch (error) {
        console.error('Error handling invoice.paid webhook:', error)
    }
}

/**
 * Deduct WTCoins from user's balance
 */
async function deductWTCoins(payload: any, userId: string | number, pointsUsed: number, orderId: string | number) {
    const userRewards = await payload.find({
        collection: 'user-wt-coins',
        where: { user: { equals: userId } },
    })

    if (userRewards.docs.length > 0) {
        const userWTCoins = userRewards.docs[0]
        const newBalance = Math.max(0, (userWTCoins.totalBalance || 0) - pointsUsed)

        const processedHistory = (userWTCoins.redeemedPointsHistory || []).map((h: any) => ({
            redeemedPoints: h.redeemedPoints,
            associatedOrder: typeof h.associatedOrder === 'object' ? h.associatedOrder.id : h.associatedOrder
        }));

        await payload.update({
            collection: 'user-wt-coins',
            id: userWTCoins.id,
            data: {
                totalBalance: newBalance,
                redeemedPointsHistory: [
                    ...processedHistory,
                    {
                        redeemedPoints: pointsUsed,
                        associatedOrder: typeof orderId === 'string' && !isNaN(Number(orderId)) ? Number(orderId) : orderId,
                    }
                ]
            }
        })
        console.log(`✅ Deducted ${pointsUsed} WTCoins for subscription order ${orderId}`)
    }
}

/**
 * Update product stock
 */
async function updateProductStock(payload: any, productId: string | number, variantId: string, quantity: number) {
    const productDoc = await payload.findByID({
        collection: 'web-products',
        id: productId,
    })

    if (productDoc && productDoc.variants) {
        const variantIndex = productDoc.variants.findIndex((v: any) => v.id === variantId)
        if (variantIndex !== -1) {
            const variant = productDoc.variants[variantIndex]
            const newStock = Math.max(0, (variant.variantStockQuantity || 0) - quantity)
            productDoc.variants[variantIndex].variantStockQuantity = newStock
            if (newStock === 0) productDoc.variants[variantIndex].variantInStock = false

            await payload.update({
                collection: 'web-products',
                id: productId,
                data: { variants: productDoc.variants },
            })
            console.log(`✅ Stock updated for product ${productId}, variant ${variantId}`)
        }
    }
}