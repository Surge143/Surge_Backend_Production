'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import styles from '../../../app.module.css'
import pageStyles from './order.module.css'

export default function OrderPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orderId || orderId === 'success') {
            setLoading(false)
            return
        }
        fetch(`/api/app-orders/${orderId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => setOrder(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [orderId])

    if (loading) return <div className={styles.spinner} />

    return (
        <div className={pageStyles.page}>
            {/* Success Animation */}
            <div className={pageStyles.successCircle}>
                <div className={pageStyles.successGlow} />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>

            <h1 className={pageStyles.title}>Order Placed!</h1>
            <p className={pageStyles.subtitle}>
                {order
                    ? `Your order #${order.id} is confirmed.`
                    : "Your order has been placed successfully."}
            </p>

            {order && (
                <div className={pageStyles.orderCard}>
                    <div className={pageStyles.orderRow}>
                        <span className={pageStyles.orderLabel}>Order ID</span>
                        <span className={pageStyles.orderValue}>#{order.id}</span>
                    </div>
                    {order.status && (
                        <div className={pageStyles.orderRow}>
                            <span className={pageStyles.orderLabel}>Status</span>
                            <span className={`${pageStyles.orderValue} ${pageStyles.statusBadge}`}>{order.status}</span>
                        </div>
                    )}
                    {order.total && (
                        <div className={pageStyles.orderRow}>
                            <span className={pageStyles.orderLabel}>Total</span>
                            <span className={`${pageStyles.orderValue} ${pageStyles.totalValue}`}>AED {order.total}</span>
                        </div>
                    )}
                    {order.orderType && (
                        <div className={pageStyles.orderRow}>
                            <span className={pageStyles.orderLabel}>Type</span>
                            <span className={pageStyles.orderValue}>{order.orderType}</span>
                        </div>
                    )}
                </div>
            )}

            <div className={pageStyles.infoBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>We&apos;ll notify you when your order is ready. Estimated time: 10–15 minutes.</span>
            </div>

            <div className={pageStyles.actions}>
                <button className={styles.btnPrimary} onClick={() => router.push('/app')}>
                    Order Again
                </button>
                <button className={styles.btnGhost} onClick={() => router.push('/app/cart')}>
                    View Cart
                </button>
            </div>
        </div>
    )
}
