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

                // DEDUCT STAMP REWARDS IF USED (stampRewards in AppOrders)
                if (order.stampRewards && Array.isArray(order.stampRewards) && order.stampRewards.length > 0) {
                    await deductStampRewards(payload, userId, order.stampRewards.length, orderId)
                }
            } catch (error) {
                console.error('Error managing rewards:', error)
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

        // --- STOCK DEDUCTION (Paid Items + Free Reward Items) ---
        const allItemsToDeduct: { productId: string | number, quantity: number }[] = [];

        // Add regular order items
        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                const productId = typeof item.product === 'object' ? item.product.id : item.product;
                allItemsToDeduct.push({ productId, quantity: item.quantity || 1 });
            });
        }

        // Add stamp reward items (quantity is always 1 per reward item)
        if (order.stampRewards && Array.isArray(order.stampRewards)) {
            order.stampRewards.forEach((reward: any) => {
                const productId = typeof reward === 'object' ? reward.id : reward;
                allItemsToDeduct.push({ productId, quantity: 1 });
            });
        }

        if (allItemsToDeduct.length > 0) {
            for (const { productId, quantity } of allItemsToDeduct) {
                try {
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
                    console.error(`Error updating stock for shop item ${productId}:`, error)
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
            where: { user: { equals: Number(userId) } },
        })

        if (userRewards.docs.length === 0) return

        const userWTCoins = userRewards.docs[0]

        // --- FIFO DEDUCTION LOGIC ---
        let pointsToDeduct = pointsUsed;
        const now = new Date();

        // Sort history by earnedAt (oldest first) and filter for active ones (non-expired and remainingAmount > 0)
        const earningHistory = [...(userWTCoins.coinEarningHistory || [])].sort((a: any, b: any) =>
            new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime()
        );

        const updatedHistory = earningHistory.map((entry: any) => {
            const expiryDate = entry.expiryDate ? new Date(entry.expiryDate) : null;
            const isExpired = expiryDate && expiryDate <= now;

            if (pointsToDeduct > 0 && !isExpired && (entry.remainingAmount || 0) > 0) {
                const deduction = Math.min(entry.remainingAmount, pointsToDeduct);
                pointsToDeduct -= deduction;
                return {
                    ...entry,
                    remainingAmount: entry.remainingAmount - deduction
                };
            }
            return entry;
        });

        if (pointsToDeduct > 0) {
            console.warn(`⚠️ User ${userId} requested to spend ${pointsUsed} but only ${pointsUsed - pointsToDeduct} were available/active.`);
        }

        const processedHistory = (userWTCoins.pointsRedemptionHistory || []).map((h: any) => {
            const associatedValue = typeof h.associatedOrder === 'object'
                ? (h.associatedOrder.value || h.associatedOrder.id)
                : h.associatedOrder;

            return {
                redeemedPoints: h.redeemedPoints,
                associatedOrder: {
                    relationTo: h.associatedOrder?.relationTo || 'app-orders',
                    value: associatedValue
                }
            };
        });

        await payload.update({
            collection: 'user-wt-coins',
            id: userWTCoins.id,
            data: {
                // totalBalance will be recalculated by UserWTCoins afterChange hook
                coinEarningHistory: updatedHistory,
                pointsRedemptionHistory: [
                    ...processedHistory,
                    {
                        redeemedPoints: pointsUsed - pointsToDeduct,
                        associatedOrder: {
                            relationTo: 'app-orders',
                            value: orderId,
                        },
                    }
                ]
            }
        })

        console.log(`✅ Deducted ${pointsUsed - pointsToDeduct} WTCoins from user ${userId} using FIFO.`)
    } catch (error) {
        console.error('Error deducting WTCoins:', error)
        throw error
    }
}
async function deductStampRewards(payload: any, userId: string | number, rewardsUsed: number, orderId: string | number) {
    try {
        const stampResult = await payload.find({
            collection: 'wt-stamps',
            where: { user: { equals: userId } },
            limit: 1,
        })

        if (stampResult.docs.length === 0) {
            console.error(`[deductStampRewards] No WTStamps record found for user ${userId}`)
            return
        }

        const userStamps = stampResult.docs[0]
        const currentRewardBalance = userStamps.stampReward || 0
        const newRewardBalance = Math.max(0, currentRewardBalance - rewardsUsed)

        const processedHistory = (userStamps.stampsRedemptionHistory || []).map((h: any) => ({
            redeemedStamps: h.redeemedStamps,
            associatedOrder: typeof h.associatedOrder === 'object' ? h.associatedOrder.id : h.associatedOrder
        }));

        await payload.update({
            collection: 'wt-stamps',
            id: userStamps.id,
            data: {
                stampReward: newRewardBalance,
                stampsRedemptionHistory: [
                    ...processedHistory,
                    {
                        redeemedStamps: rewardsUsed,
                        associatedOrder: {
                            relationTo: 'app-orders',
                            value: orderId,
                        },
                    }
                ]
            }
        })

        console.log(`✅ Deducted ${rewardsUsed} Stamp Rewards from user ${userId}. New balance: ${newRewardBalance}`)
    } catch (error) {
        console.error('Error deducting Stamp Rewards:', error)
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