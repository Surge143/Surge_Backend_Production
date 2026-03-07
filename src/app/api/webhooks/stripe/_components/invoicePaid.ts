import { stripe } from "@/lib/stripe"
import { getPayload } from "payload"
import config from "@/payload.config"
import { sendEmail } from "@/lib/emailConfig"
import { orderConfirmationEmailTemplate } from "@/lib/emailTemplate"

export async function handleInvoicePaid(invoice: any) {
    const payload = await getPayload({ config })

    console.log("✅ invoice.paid received:", invoice.id)

    try {
        /* --------------------------------------------------
           1️⃣ Extract IDs (FIXED PATHS)
        ---------------------------------------------------*/
        // In your payload, metadata is inside subscription_details or the first line item
        const dbSubscriptionId =
            invoice.subscription_details?.metadata?.db_subscription_id ||
            invoice.lines?.data[0]?.metadata?.db_subscription_id;

        const stripeSubscriptionId = invoice.parent.subscription_details.subscription;

        if (!dbSubscriptionId) {
            console.error("❌ No db_subscription_id found in invoice metadata. Cannot link to database.");
            return
        }

        console.log("DB Subscription ID:", dbSubscriptionId)
        console.log("Stripe Subscription ID:", stripeSubscriptionId)

        /* --------------------------------------------------
           2️⃣ Idempotency Check
        ---------------------------------------------------*/
        const existingOrder = await payload.find({
            collection: "web-orders",
            where: {
                stripeOrderId: { equals: invoice.id },
            },
        })

        if (existingOrder.docs.length > 0) {
            console.log("⚠️ Order already exists. Skipping duplicate.")
            return
        }

        /* --------------------------------------------------
           3️⃣ Fetch Subscription Doc
        ---------------------------------------------------*/
        const subscriptionDoc = await payload.findByID({
            collection: "web-subscription",
            id: dbSubscriptionId,
            depth: 2,
        })

        if (!subscriptionDoc) {
            console.error("❌ Subscription doc not found in Payload for ID:", dbSubscriptionId)
            return
        }

        // Check if this is the first payment
        const isFirstInvoice = invoice.billing_reason === "subscription_create"

        /* --------------------------------------------------
           4️⃣ Safe Receipt Retrieval
        ---------------------------------------------------*/
        let receiptUrl: string | null = invoice.hosted_invoice_url // Fallback to invoice URL

        if (invoice.charge) {
            try {
                const charge = await stripe.charges.retrieve(invoice.charge as string)
                receiptUrl = charge.receipt_url
            } catch (err) {
                console.warn("⚠️ Could not fetch specific receipt_url, using invoice URL.")
            }
        }

        /* --------------------------------------------------
           5️⃣ Create Order
        ---------------------------------------------------*/
        const orderData: any = {
            customerType: subscriptionDoc.customerType,
            user: subscriptionDoc.user
                ? typeof subscriptionDoc.user === "object"
                    ? subscriptionDoc.user.id
                    : subscriptionDoc.user
                : null,
            deliveryOption: subscriptionDoc.deliveryOption,
            origin: "subscription",
            stripeSubscriptionID: stripeSubscriptionId,
            items: subscriptionDoc.items.map((item: any) => ({
                product: typeof item.product === "object" ? item.product.id : item.product,
                variantID: item.variantID,
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: subscriptionDoc.shippingAddress,
            billingAddress: subscriptionDoc.billingAddress,
            paymentStatus: "completed",
            deliveryStatus: subscriptionDoc.deliveryOption === "delivery" ? "placed" : "delivered",
            pointsUsed: isFirstInvoice ? (subscriptionDoc.pointsUsed || 0) : 0,
            financials: {
                subtotal: subscriptionDoc.financials?.subtotal ?? 0,
                couponDiscount: 0, // Subscriptions don't use coupons
                wtCoinsDiscount: isFirstInvoice ? (subscriptionDoc.financials?.wtCoinsDiscount ?? 0) : 0,
                shippingCharge: subscriptionDoc.financials?.shippingCharge ?? 0,
                taxAmount: invoice.tax ? invoice.tax / 100 : (subscriptionDoc.financials?.taxAmount ?? 0),
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
                receipt_url: receiptUrl,
            },
        }

        const newOrder = await payload.create({
            collection: "web-orders",
            data: orderData,
        })

        console.log(`✅ Order ${newOrder.id} created`)

        /* --------------------------------------------------
           6️⃣ WTCoins & Stock (Only if order created)
        ---------------------------------------------------*/
        const userId = subscriptionDoc.user && (typeof subscriptionDoc.user === "object" ? subscriptionDoc.user.id : subscriptionDoc.user);

        if (isFirstInvoice && userId && (subscriptionDoc.pointsUsed ?? 0) > 0) {
            await deductWTCoins(payload, userId, subscriptionDoc.pointsUsed!, newOrder.id)
        }

        for (const item of subscriptionDoc.items) {
            await updateProductStock(
                payload,
                typeof item.product === "object" ? item.product.id : item.product,
                item.variantID,
                item.quantity
            )
        }

        /* --------------------------------------------------
           7️⃣ Update Subscription (Next Payment Date)
        ---------------------------------------------------*/
        try {
            // Pull the next payment date directly from the line item period end
            const periodEnd = invoice.lines?.data[0]?.period?.end;

            const updateData: any = {
                paymentStatus: "completed",
                subsStatus: "active",
                stripeSubscriptionID: stripeSubscriptionId,
            };

            if (periodEnd) {
                updateData.nextPaymentDate = new Date(periodEnd * 1000).toISOString();
            }

            await payload.update({
                collection: "web-subscription",
                id: dbSubscriptionId,
                data: updateData,
            });

            console.log("✅ Subscription record updated with next payment date:", updateData.nextPaymentDate)
        } catch (err) {
            console.error("❌ Failed updating subscription record:", err)
        }

        /* --------------------------------------------------
           8️⃣ Send Confirmation Email
        ---------------------------------------------------*/
        try {
            const userEmail = (subscriptionDoc.user && typeof subscriptionDoc.user === "object")
                ? (subscriptionDoc.user as any).email
                : invoice.customer_email

            if (userEmail) {
                await sendEmail({
                    to: userEmail,
                    subject: isFirstInvoice ? "Subscription Started!" : "Subscription Renewed!",
                    body: `Order #${newOrder.id} processed.`,
                    html: orderConfirmationEmailTemplate({ order: newOrder }),
                })
                console.log("✅ Email sent")
            }
        } catch (err) {
            console.error("❌ Email failed:", err)
        }

    } catch (error) {
        console.error("❌ Fatal error in handleInvoicePaid:", error)
    }
}

/* ======================================================
    HELPER FUNCTIONS
======================================================*/

async function deductWTCoins(payload: any, userId: string | number, pointsUsed: number, orderId: string | number) {
    const userRewards = await payload.find({
        collection: "user-wt-coins",
        where: { user: { equals: userId } },
    })

    if (userRewards.docs.length === 0) return

    const record = userRewards.docs[0]
    const newBalance = Math.max(0, (record.totalBalance || 0) - pointsUsed)

    // Properly format existing history to avoid structure issues
    const processedHistory = (record.pointsRedemptionHistory || []).map((h: any) => ({
        redeemedPoints: h.redeemedPoints,
        associatedOrder: typeof h.associatedOrder === "object"
            ? { relationTo: h.associatedOrder.relationTo, value: h.associatedOrder.value }
            : h.associatedOrder
    }))

    await payload.update({
        collection: "user-wt-coins",
        id: record.id,
        data: {
            totalBalance: newBalance,
            pointsRedemptionHistory: [
                ...processedHistory,
                {
                    redeemedPoints: pointsUsed,
                    associatedOrder: {
                        relationTo: "web-orders",
                        value: orderId,
                    },
                },
            ],
        },
    })
    console.log("✅ WTCoins deducted")
}

async function updateProductStock(payload: any, productId: string | number, variantId: string | null | undefined, quantity: number) {
    const product = await payload.findByID({
        collection: "web-products",
        id: productId,
    })

    if (!product) return

    let updateData: any = {}

    if (variantId && product.variants) {
        // Handle Variant Stock
        const updatedVariants = product.variants.map((v: any) => {
            if (v.id === variantId || v._id === variantId) {
                const newQty = Math.max(0, (v.variantStockQuantity || 0) - quantity)
                return {
                    ...v,
                    variantStockQuantity: newQty,
                    variantInStock: newQty > 0
                }
            }
            return v
        })
        updateData.variants = updatedVariants
    } else {
        // Handle Global Product Stock
        const currentStock = product.stockQuantity || 0
        const newQty = Math.max(0, currentStock - quantity)
        updateData.stockQuantity = newQty
        updateData.inStock = newQty > 0
    }

    await payload.update({
        collection: "web-products",
        id: productId,
        data: updateData,
    })
    console.log(`✅ Stock updated for product ${productId}${variantId ? ` (variant: ${variantId})` : ""}`)
}
