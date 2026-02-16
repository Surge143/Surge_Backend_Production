import { stripe } from "@/lib/stripe";
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function handlePaymentIntentSucceeded(paymentIntent: any) {
    const payload = await getPayload({ config })

    const orderId = paymentIntent.metadata.db_order_id

    if (!orderId) {
        console.error('No order ID found in metadata')
        return
    }

    let order: any
    try {
        order = await payload.findByID({
            collection: 'web-orders',
            id: orderId,
            depth: 2, // Fetch related product data
        })

        if (!order) {
            console.error('Order not found')
            return
        }

        // --- WTCOINS MANAGEMENT ---
        // Handle WTCoins deduction and reward earning
        if (order.user) {
            const userId = typeof order.user === 'object' ? order.user.id : order.user

            try {
                // 1. DEDUCT WTCOINS IF USED
                if (order.pointsUsed && order.pointsUsed > 0) {
                    await deductWTCoins(payload, userId, order.pointsUsed, orderId)
                }

                // 2. AWARD WTCOINS BASED ON REAL MONEY SPENT
                // Calculate the actual amount paid (excluding WTCoins discount)
                const wtCoinsDiscount = order.pointsUsed ? await convertPointsToAED(payload, order.pointsUsed) : 0
                const realMoneySpent = Math.max(0, order.financials.total - wtCoinsDiscount)

                if (realMoneySpent > 0) {
                    await awardWTCoins(payload, userId, realMoneySpent, orderId)
                }
            } catch (error) {
                console.error('Error managing WTCoins:', error)
            }
        }

        // --- CLEAR USER CART ---
        // Clear the cart after successful payment
        if (order.user) {
            const userId = typeof order.user === 'object' ? order.user.id : order.user

            try {
                await clearUserCart(payload, userId)
            } catch (error) {
                console.error('Error clearing cart:', error)
            }
        }

        // --- STOCK DEDUCTION ---
        // Deduct stock for each item in the order
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                try {
                    const productId = typeof item.product === 'object' ? item.product.id : item.product
                    const variantId = item.variantID
                    const quantity = item.quantity

                    // Fetch the product to update stock
                    const productDoc = await payload.findByID({
                        collection: 'web-products',
                        id: productId,
                    })

                    if (!productDoc) {
                        console.error(`Product ${productId} not found`)
                        continue
                    }

                    // Find the variant and update its stock
                    if (productDoc.variants && Array.isArray(productDoc.variants)) {
                        const variantIndex = productDoc.variants.findIndex((v: any) => v.id === variantId)

                        if (variantIndex !== -1) {
                            const variant = productDoc.variants[variantIndex]
                            const currentStock = variant.variantStockQuantity || 0
                            const newStock = Math.max(0, currentStock - quantity)

                            // Update the variant stock
                            productDoc.variants[variantIndex].variantStockQuantity = newStock

                            // If stock reaches 0, mark as out of stock
                            if (newStock === 0) {
                                productDoc.variants[variantIndex].variantInStock = false
                            }

                            await payload.update({
                                collection: 'web-products',
                                id: productId,
                                data: {
                                    variants: productDoc.variants,
                                },
                            })

                            console.log(`✅ Stock updated for product ${productId}, variant ${variantId}: ${currentStock} → ${newStock}`)
                        } else {
                            console.error(`Variant ${variantId} not found in product ${productId}`)
                        }
                    }
                } catch (error) {
                    console.error(`Error updating stock for item:`, error)
                }
            }
        }

        // --- UPDATE ORDER STATUS ---
        try {
            await payload.update({
                collection: 'web-orders',
                id: orderId,
                data: {
                    paymentStatus: 'completed',
                },
            })
            console.log(`✅ Order ${orderId} marked as completed`)
        } catch (error) {
            console.error('Error updating order status:', error)
        }

    } catch (error) {
        console.error('Error fetching order in Payment Intent Webhook:', error)
        return
    }
}

/**
 * Deduct WTCoins from user's balance and log the transaction
 */
async function deductWTCoins(payload: any, userId: string | number, pointsUsed: number, orderId: string | number) {
    try {
        // Find user's WTCoins record
        const userRewards = await payload.find({
            collection: 'user-wt-coins',
            where: { user: { equals: userId } },
        })

        if (userRewards.docs.length === 0) {
            console.error(`No WTCoins record found for user ${userId}`)
            return
        }

        const userWTCoins = userRewards.docs[0]
        const newBalance = Math.max(0, (userWTCoins.totalBalance || 0) - pointsUsed)

        // Update balance and add to redemption history
        await payload.update({
            collection: 'user-wt-coins',
            id: userWTCoins.id,
            data: {
                totalBalance: newBalance,
                redeemedPointsHistory: [
                    ...(userWTCoins.redeemedPointsHistory || []),
                    {
                        redeemedPoints: pointsUsed,
                        associatedOrder: orderId,
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

/**
 * Award WTCoins to user based on real money spent
 */
async function awardWTCoins(payload: any, userId: string | number, realMoneySpent: number, orderId: string | number) {
    try {
        // Fetch WTCoins configuration
        const wtCoinsConfig = await payload.findGlobal({
            slug: 'wt-coins',
            depth: 1,
        })

        if (!wtCoinsConfig) {
            console.error('WTCoins configuration not found')
            return
        }

        // Calculate points to award (percentage of real money spent)
        const pointsEarnRate = wtCoinsConfig.pointsEarn || 0
        const pointsToAward = Math.floor(realMoneySpent * (pointsEarnRate / 100))

        if (pointsToAward <= 0) {
            console.log(`No points to award for order ${orderId}`)
            return
        }

        // Calculate expiry date
        const expiryMonths = wtCoinsConfig.rewardExpiry || 12
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + expiryMonths)

        // Find or create user's WTCoins record
        const userRewards = await payload.find({
            collection: 'user-wt-coins',
            where: { user: { equals: userId } },
        })

        let userWTCoins: any

        if (userRewards.docs.length === 0) {
            // Create new record
            userWTCoins = await payload.create({
                collection: 'user-wt-coins',
                data: {
                    user: userId,
                    totalBalance: pointsToAward,
                    earningHistory: [
                        {
                            amount: pointsToAward,
                            earnedAt: new Date(),
                            expiryDate: expiryDate,
                        }
                    ],
                    redeemedPointsHistory: []
                }
            })
            console.log(`✅ Created WTCoins record and awarded ${pointsToAward} points to user ${userId}`)
        } else {
            // Update existing record
            userWTCoins = userRewards.docs[0]
            const newBalance = (userWTCoins.totalBalance || 0) + pointsToAward

            await payload.update({
                collection: 'user-wt-coins',
                id: userWTCoins.id,
                data: {
                    totalBalance: newBalance,
                    earningHistory: [
                        ...(userWTCoins.earningHistory || []),
                        {
                            amount: pointsToAward,
                            earnedAt: new Date(),
                            expiryDate: expiryDate,
                        }
                    ]
                }
            })
            console.log(`✅ Awarded ${pointsToAward} WTCoins to user ${userId}. New balance: ${newBalance}`)
        }
    } catch (error) {
        console.error('Error awarding WTCoins:', error)
        throw error
    }
}

/**
 * Convert points to AED based on configuration
 */
async function convertPointsToAED(payload: any, points: number): Promise<number> {
    try {
        const wtCoinsConfig = await payload.findGlobal({
            slug: 'wt-coins',
            depth: 1,
        })

        if (!wtCoinsConfig) {
            return 0
        }

        const pointsToAedRate = wtCoinsConfig.pointsToAed || 1
        return points / pointsToAedRate
    } catch (error) {
        console.error('Error converting points to AED:', error)
        return 0
    }
}

/**
 * Clear user's cart after successful payment
 */
async function clearUserCart(payload: any, userId: string | number) {
    try {
        // Find user's cart
        const cartResult = await payload.find({
            collection: 'web-cart',
            where: { user: { equals: userId } },
        })

        if (cartResult.docs.length > 0) {
            const cart = cartResult.docs[0]

            // Clear all items from the cart
            await payload.update({
                collection: 'web-cart',
                id: cart.id,
                data: {
                    items: []
                }
            })

            console.log(`✅ Cleared cart for user ${userId}`)
        }
    } catch (error) {
        console.error('Error clearing user cart:', error)
        throw error
    }
}