import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail } from '@/lib/emailConfig'
import { CafeOrderCancellationEmail } from '@/lib/emailTemplates/CafeOrderCancellation'
import { StoreOrderCancellationEmail } from '@/lib/emailTemplates/StoreOrderCancellation'

export async function handleChargeRefunded(charge: any) {
    const payload = await getPayload({ config })

    const orderId = charge.metadata?.db_order_id
    const orderType = charge.metadata?.order_type // 'store' | 'cafe'

    if (!orderId) {
        console.error('[ChargeRefunded] No db_order_id in charge metadata, skipping')
        return
    }

    // Determine collection based on order type
    const collection = orderType === 'cafe' ? 'app-orders' : 'web-orders'

    console.log(`🔄 [ChargeRefunded] Processing refund for ${collection} #${orderId}`)

    let order: any
    try {
        order = await payload.findByID({
            collection,
            id: orderId,
            depth: 2,
        })
    } catch {
        console.error(`[ChargeRefunded] Order #${orderId} not found in ${collection}`)
        return
    }

    if (!order) {
        console.error(`[ChargeRefunded] Order #${orderId} not found`)
        return
    }

    // --- 1. RESTORE STOCK ---
    const productCollection = orderType === 'cafe' ? 'shop-menu' : 'web-products'
    const variantIdKey = 'variantID'

    if (order.items && order.items.length > 0) {
        for (const item of order.items) {
            try {
                const productId = typeof item.product === 'object' ? item.product.id : item.product
                const quantity = item.quantity || 1

                const productDoc: any = await payload.findByID({
                    collection: productCollection,
                    id: productId,
                })

                if (!productDoc) {
                    console.warn(`[ChargeRefunded] Product ${productId} not found, skipping stock restore`)
                    continue
                }

                if (orderType === 'cafe') {
                    // Cafe (shop-menu): stock is at top level — stockCount / inStock
                    const currentStock = productDoc.stockCount || 0
                    const restoredStock = currentStock + quantity

                    await payload.update({
                        collection: 'shop-menu',
                        id: productId,
                        data: {
                            stockCount: restoredStock,
                            inStock: restoredStock > 0,
                        },
                        overrideAccess: true,
                    })

                    console.log(`✅ [ChargeRefunded] shop-menu stock restored for ${productId}: ${currentStock} → ${restoredStock}`)
                } else {
                    // Web store (web-products): stock is per variant
                    const variantId = item[variantIdKey]

                    if (productDoc.hasVariantOptions && productDoc.variants && Array.isArray(productDoc.variants)) {
                        const variantIndex = productDoc.variants.findIndex((v: any) => v.id === variantId)

                        if (variantIndex !== -1) {
                            const variant = productDoc.variants[variantIndex]
                            const currentStock = variant.variantStockQuantity || 0
                            const restoredStock = currentStock + quantity

                            productDoc.variants[variantIndex].variantStockQuantity = restoredStock
                            if (restoredStock > 0) {
                                productDoc.variants[variantIndex].variantInStock = true
                            }

                            await payload.update({
                                collection: 'web-products',
                                id: productId,
                                data: { variants: productDoc.variants },
                                overrideAccess: true,
                            })

                            console.log(`✅ [ChargeRefunded] web-products stock restored for ${productId}, variant ${variantId}: ${currentStock} → ${restoredStock}`)
                        } else {
                            console.warn(`[ChargeRefunded] Variant ${variantId} not found in product ${productId}`)
                        }
                    } else {
                        // No variants on web product
                        const currentStock = productDoc.stockQuantity || 0
                        await payload.update({
                            collection: 'web-products',
                            id: productId,
                            data: { stockQuantity: currentStock + quantity },
                            overrideAccess: true,
                        })
                    }
                }
            } catch (err) {
                console.error(`[ChargeRefunded] Error restoring stock for item:`, err)
            }
        }
    }

    // --- 2. RESTORE WTCOINS (if they were deducted) ---
    const userId = typeof order.user === 'object' ? order.user?.id : order.user
    const pointsUsed = (order.pointsUsed || order.coinsUsed || 0)

    if (userId && pointsUsed > 0) {
        try {
            const userRewards = await payload.find({
                collection: 'user-surge-coins',
                where: { user: { equals: userId } },
            })

            if (userRewards.docs.length > 0) {
                const userWTCoins = userRewards.docs[0]
                const restoredBalance = (userWTCoins.totalBalance || 0) + pointsUsed

                // Remove the redemption history entry tied to this order
                const updatedHistory = (userWTCoins.pointsRedemptionHistory || []).map((h: any) => ({
                    redeemedPoints: h.redeemedPoints,
                    associatedOrder: typeof h.associatedOrder === 'object'
                        ? { relationTo: h.associatedOrder.relationTo, value: h.associatedOrder.value }
                        : h.associatedOrder,
                })).filter((h: any) => {
                    const orderValue = typeof h.associatedOrder === 'object' ? h.associatedOrder.value : h.associatedOrder;
                    return String(orderValue) !== String(orderId);
                })

                await (payload.update as any)({
                    collection: 'user-surge-coins',
                    id: userWTCoins.id,
                    data: {
                        totalBalance: restoredBalance,
                        pointsRedemptionHistory: updatedHistory,
                    },
                    overrideAccess: true,
                })

                console.log(`✅ [ChargeRefunded] Restored ${pointsUsed} WTCoins to user ${userId}. New balance: ${restoredBalance}`)
            }
        } catch (err) {
            console.error('[ChargeRefunded] Error restoring WTCoins:', err)
        }
    }

    // --- 3. UPDATE ORDER STATUS ---
    try {
        let statusField = 'deliveryStatus' // Default for 'store' orders
        if (orderType === 'cafe') {
            statusField = order.orderType === 'dine-in' ? 'appOrderStatusDine' : 'appOrderStatus'
        }

        const updateData: any = {
            paymentStatus: 'refunded',
            [statusField]: 'cancelled',
            refundedAmount: (charge.amount_refunded || 0) / 100, // Convert from cents
        }

        if (orderType !== 'cafe') {
            updateData.refundedOn = new Date().toISOString()
        }

        await payload.update({
            collection,
            id: orderId,
            data: updateData,
            overrideAccess: true,
        })

        console.log(`✅ [ChargeRefunded] Order #${orderId} marked as refunded and cancelled`)
    } catch (err: any) {
        console.error(`[ChargeRefunded] Error updating ${collection} #${orderId} status:`, err)
        if (err.data && Array.isArray(err.data)) {
            console.error('[ChargeRefunded] Detailed Validation Errors:', JSON.stringify(err.data, null, 2))
        }
    }

    // --- 4. SEND CANCELLATION EMAIL ---
    try {
        const userEmail =
            typeof order.user === 'object' && order.user?.email
                ? order.user.email
                : order.billingAddress?.email || order.shippingAddress?.email

        if (userEmail) {
            const html = orderType === 'cafe'
                ? CafeOrderCancellationEmail(order)
                : StoreOrderCancellationEmail(order)

            await sendEmail({
                to: userEmail,
                subject: 'Your Order Has Been Cancelled - White Mantis',
                html,
            })

            console.log(`✅ [ChargeRefunded] Cancellation email sent to ${userEmail}`)
        } else {
            console.warn(`⚠️ [ChargeRefunded] No email found for order ${orderId}, skipping cancellation email`)
        }
    } catch (err) {
        console.error('[ChargeRefunded] Error sending cancellation email:', err)
    }
}
