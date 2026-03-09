import Link from 'next/link'
import styles from './page.module.css'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string, subscriptionId?: string, token?: string }> }) {
    const resolvedSearchParams = await searchParams;
    const orderId = resolvedSearchParams.orderId || resolvedSearchParams.subscriptionId;
    const { token } = resolvedSearchParams;
    let order: any = null;

    if (orderId) {
        try {
            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })

            // Try fetching from WebOrders first
            try {
                order = await payload.findByID({
                    collection: 'web-orders',
                    id: orderId,
                    depth: 1,
                    overrideAccess: true,
                })
            } catch (e) {
                // Not in WebOrders, try WebSubscription
                try {
                    order = await payload.findByID({
                        collection: 'web-subscription',
                        id: orderId,
                        depth: 1,
                        overrideAccess: true,
                    })
                } catch (e2) {
                    // Finally, try AppOrders (which are public or owner-based)
                    try {
                        order = await payload.findByID({
                            collection: 'app-orders',
                            id: orderId,
                            depth: 1,
                            overrideAccess: true,
                        })
                    } catch (e3) {
                        console.log("Order not found in any collection:", orderId);
                    }
                }
            }

            // Security check: If it's a guest order, the token must match
            if (order && order.customerType === 'guest') {
                if (order.guestAccessToken !== token) {
                    order = null; // Unauthorized
                }
            }
        } catch (e) {
            console.error("Error fetching order on success page:", e);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconContainer}>
                    <svg
                        className={styles.icon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </div>
                <h1 className={styles.title}>Order Confirmed!</h1>
                <p className={styles.message}>
                    Thank you for your purchase. Your order has been received and is being processed.
                </p>

                {order && (
                    <div className={styles.orderSummary}>
                        <h3>Order Details</h3>
                        <p>Order ID: {order.id}</p>
                        <p>Total: {order.financials?.total} AED</p>
                        <p>Status: {order.paymentStatus || order.appOrderStatus || order.appOrderStatusDine}</p>

                        <div className={styles.itemsList}>
                            <h4>Items:</h4>
                            <ul>
                                {order.items?.map((item: any, idx: number) => (
                                    <li key={idx}>
                                        {item.product?.name || 'Product'} x {item.quantity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <Link href="/orders" className={styles.button}>
                        View Orders
                    </Link>
                    <Link href="/shop" className={`${styles.button} ${styles.secondary}`}>
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
