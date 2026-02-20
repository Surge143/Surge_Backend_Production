import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from "@/lib/emailConfig";
import { orderConfirmationEmailTemplate } from "@/lib/emailTemplate";

export async function handleAppPaymentIntentSucceeded(paymentIntent: any) {
    console.log('🏁 Starting handleAppPaymentIntentSucceeded for:', paymentIntent.id)
    const payload = await getPayload({ config })

    let orderId = paymentIntent.metadata.db_order_id
    console.log('📦 Order ID from metadata:', orderId)

    if (!orderId) {
        console.error('❌ No order ID found in metadata')
        return
    }

    // Convert to number if it's a numeric string
    if (typeof orderId === 'string' && !isNaN(Number(orderId))) {
        orderId = Number(orderId)
        console.log('🔄 Converted orderId to number:', orderId)
    }

    let order: any
    try {
        console.log('🔍 Searching for order in app-orders...')
        order = await payload.findByID({
            collection: 'app-orders',
            id: orderId,
            depth: 2,
        })

        if (!order) {
            console.error('❌ Order not found for ID:', orderId)
            return
        }
        console.log('✅ Order found:', order.id)

        // --- WTCOINS MANAGEMENT ---
        if (order.user) {
            const userId = typeof order.user === 'object' ? order.user.id : order.user

            try {
                // DEDUCT WTCOINS IF USED (coinsUsed in AppOrders)
                if (order.coinsUsed && order.coinsUsed > 0) {
                    await deductWTCoins(payload, userId, order.coinsUsed, orderId)
                }
            } catch (error) {
                console.error('Error managing WTCoins:', error)
            }
        }

        // --- CLEAR USER CART ---
        if (order.user) {
            const userId = typeof order.user === 'object' ? order.user.id : order.user

            try {
                await clearUserCart(payload, userId)
            } catch (error) {
                console.error('Error clearing cart:', error)
            }
        }

        // --- STOCK DEDUCTION ---
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                try {
                    const productId = typeof item.product === 'object' ? item.product.id : item.product
                    const quantity = item.quantity || 1

                    // Fetch the shop-menu product
                    const productDoc = await payload.findByID({
                        collection: 'shop-menu',
                        id: productId,
                    })

                    if (!productDoc) {
                        console.error(`Shop item ${productId} not found`)
                        continue
                    }

                    // For Cafe orders, stock management is at the top level of ShopMenu
                    const currentStock = productDoc.stockCount || 0
                    const newStock = Math.max(0, currentStock - quantity)

                    await payload.update({
                        collection: 'shop-menu',
                        id: productId,
                        data: {
                            stockCount: newStock,
                            inStock: newStock > 0,
                        },
                    })

                    console.log(`✅ Stock updated for shop-menu ${productId}: ${currentStock} → ${newStock}`)
                } catch (error) {
                    console.error(`Error updating stock for shop item:`, error)
                }
            }
        }

        // --- UPDATE ORDER STATUS AND PAYMENT DETAILS ---
        try {
            const chargeId = paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id
            const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url

            await payload.update({
                collection: 'app-orders',
                id: orderId,
                data: {
                    paymentStatus: 'paid', // AppOrders uses paid/completed
                    stripeData: {
                        paymentIntentId: paymentIntent.id,
                        chargeId: chargeId,
                        customerId: paymentIntent.customer,
                        receiptUrl: receiptUrl,
                        amount: paymentIntent.amount,
                        currency: paymentIntent.currency,
                        paymentMethod: paymentIntent.payment_method,
                        status: paymentIntent.status,
                        created: paymentIntent.created,
                    },
                },
            })
            console.log(`✅ Order ${orderId} marked as paid with payment details`)

            // Send order confirmation email
            try {
                const userEmail = typeof order.user === 'object' ? order.user?.email : null
                if (userEmail) {
                    const userName = (order.user as any)?.firstName || 'Coffee Lover'

                    await sendEmail({
                        to: userEmail,
                        subject: "Order Confirmation - White Mantis Cafe",
                        body: `Hi ${userName},

Thank you for your cafe order! Your order #${orderId} has been confirmed.

We're starting to prepare your order. You can track its status in the app.

Happy brewing,
Team White Mantis Cafe`.trim(),
                        html: orderConfirmationEmailTemplate({ order: order }),
                    })

                    console.log(`✅ App order confirmation email sent to ${userEmail}`)
                } else {
                    console.warn(`⚠️ No email found for app order ${orderId}, skipping confirmation email`)
                }
            } catch (emailError: any) {
                console.error("❌ Failed to send order confirmation email:", emailError)
            }
        } catch (error) {
            console.error('Error updating order status:', error)
        }

    } catch (error) {
        console.error('Error fetching order in App Payment Intent Webhook:', error)
        return
    }
}

async function deductWTCoins(payload: any, userId: string | number, pointsUsed: number, orderId: string | number) {
    try {
        const userRewards = await payload.find({
            collection: 'user-wt-coins',
            where: { user: { equals: userId } },
        })

        if (userRewards.docs.length === 0) return

        const userWTCoins = userRewards.docs[0]
        const newBalance = Math.max(0, (userWTCoins.totalBalance || 0) - pointsUsed)

        const processedHistory = (userWTCoins.pointsRedemptionHistory || []).map((h: any) => ({
            redeemedPoints: h.redeemedPoints,
            associatedOrder: typeof h.associatedOrder === 'object' ? h.associatedOrder.id : h.associatedOrder
        }));

        await payload.update({
            collection: 'user-wt-coins',
            id: userWTCoins.id,
            data: {
                totalBalance: newBalance,
                pointsRedemptionHistory: [
                    ...processedHistory,
                    {
                        redeemedPoints: pointsUsed,
                        associatedOrder: {
                            relationTo: 'app-orders',
                            value: orderId,
                        },
                    }
                ]
            }
        })

        console.log(`✅ Deducted ${pointsUsed} WTCoins from user ${userId}. New balance: ${newBalance}`)
    } catch (error) {
        console.error('Error deducting WTCoins:', error)
        throw error
    }
}

async function clearUserCart(payload: any, userId: string | number) {
    try {
        const cartResult = await payload.find({
            collection: 'app-cart',
            where: { user: { equals: userId } },
        })

        if (cartResult.docs.length > 0) {
            const cart = cartResult.docs[0]
            await payload.update({
                collection: 'app-cart',
                id: cart.id,
                data: {
                    items: [],
                    shop: null
                }
            })
            console.log(`✅ Cleared app-cart for user ${userId}`)
        }
    } catch (error) {
        console.error('Error clearing user app-cart:', error)
        throw error
    }
}