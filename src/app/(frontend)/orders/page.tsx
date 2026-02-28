'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './orders.module.css'

type OrderType = 'website' | 'app' | 'subscription'

interface BaseOrder {
    id: string | number
    updatedAt: string
    createdAt: string
}

interface WebOrder extends BaseOrder {
    deliveryStatus: string
    paymentStatus: string
    financials: {
        total: number
    }
    items: Array<{
        product: any
        quantity: number
        price: number
    }>
}

interface AppOrder extends BaseOrder {
    appOrderStatus: string
    appOrderStatusDine?: string
    orderType: 'take-away' | 'dine-in'
    paymentStatus: string
    financials: {
        total: number
    }
    items: Array<{
        product: any
        quantity: number
        price: number
    }>
    shop: any
}

interface WebSubscription extends BaseOrder {
    subsStatus: string
    paymentStatus: string
    financials: {
        total: number
    }
    items: Array<{
        product: any
        quantity: number
        price: number
    }>
}

export default function OrdersPage() {
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<OrderType>('website')
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<string | number | null>(null)

    const [webOrders, setWebOrders] = useState<WebOrder[]>([])
    const [appOrders, setAppOrders] = useState<AppOrder[]>([])
    const [subscriptions, setSubscriptions] = useState<WebSubscription[]>([])

    useEffect(() => {
        const init = async () => {
            try {
                const meRes = await fetch('/api/users/me')
                if (!meRes.ok) {
                    window.location.href = '/login'
                    return
                }
                const meData = await meRes.json()
                if (!meData.user) {
                    window.location.href = '/login'
                    return
                }
                setUser(meData.user)

                const userId = meData.user.id

                // Fetch all orders in parallel
                const [webRes, appRes, subRes] = await Promise.all([
                    fetch(`/api/web-orders?where[user][equals]=${userId}&sort=-createdAt`),
                    fetch(`/api/app-orders?where[user][equals]=${userId}&sort=-createdAt`),
                    fetch(`/api/web-subscription?where[user][equals]=${userId}&sort=-createdAt`)
                ])

                const [webData, appData, subData] = await Promise.all([
                    webRes.json(),
                    appRes.json(),
                    subRes.json()
                ])

                setWebOrders(webData.docs || [])
                setAppOrders(appData.docs || [])
                setSubscriptions(subData.docs || [])
            } catch (error) {
                console.error('Failed to fetch orders:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleCancel = async (id: string | number, type: OrderType) => {
        if (!confirm('Are you sure you want to cancel? This will initiate a refund.')) return

        setCancelling(id)
        try {
            const collection = type === 'website' ? 'web-orders' : type === 'app' ? 'app-orders' : 'web-subscription'
            const res = await fetch(`/api/${collection}/${id}/cancel`)
            const data = await res.json()

            if (res.ok) {
                alert(data.message || 'Cancellation initiated successfully')
                // Refresh data
                const refreshRes = await fetch(`/api/${collection}?where[user][equals]=${user.id}&sort=-createdAt`)
                const refreshData = await refreshRes.json()
                if (type === 'website') setWebOrders(refreshData.docs)
                else if (type === 'app') setAppOrders(refreshData.docs)
                else setSubscriptions(refreshData.docs)
            } else {
                alert(data.error || 'Failed to cancel')
            }
        } catch (error) {
            alert('An error occurred while cancelling')
        } finally {
            setCancelling(null)
        }
    }

    const renderBadge = (status: string) => {
        const s = status.toLowerCase().replace(/\s+/g, '').replace('-', '')
        let className = styles.badge
        if (s === 'pending' || s === 'preparing') className += ` ${styles.badgePending}`
        else if (s === 'completed' || s === 'paid' || s === 'active' || s === 'ready') className += ` ${styles.badgeCompleted}`
        else if (s === 'cancelled' || s === 'rejected') className += ` ${styles.badgeCancelled}`
        else if (s === 'refunded') className += ` ${styles.badgeRefunded}`
        else if (s === 'refundinitiated') className += ` ${styles.badgeRefundInitiated}`

        return <span className={className}>{status}</span>
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className="container">
                    <div className={styles.loading}><p>Brewing your order history...</p></div>
                </div>
            </div>
        )
    }

    const activeList = activeTab === 'website' ? webOrders : activeTab === 'app' ? appOrders : subscriptions

    return (
        <div className={styles.container}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Your Orders</h1>
                    <p className={styles.subtitle}>Manage your one-time purchases and active subscriptions</p>
                </header>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'website' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('website')}
                    >
                        Website Orders
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'app' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('app')}
                    >
                        App & Cafe Orders
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'subscription' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('subscription')}
                    >
                        Subscriptions
                    </button>
                </div>

                {activeList.length > 0 ? (
                    <div className={styles.orderList}>
                        {activeList.map((order) => (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <div className={styles.orderInfo}>
                                        <h3>Order #{order.id}</h3>
                                        <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                                    </div>
                                    <div className={styles.statusBadges}>
                                        {renderBadge((order as any).paymentStatus)}
                                        {activeTab === 'website' && renderBadge((order as WebOrder).deliveryStatus)}
                                        {activeTab === 'app' && (
                                            renderBadge((order as AppOrder).orderType === 'dine-in'
                                                ? (order as AppOrder).appOrderStatusDine || 'Pending'
                                                : (order as AppOrder).appOrderStatus)
                                        )}
                                        {activeTab === 'subscription' && renderBadge((order as WebSubscription).subsStatus)}
                                    </div>
                                </div>

                                <div className={styles.orderBody}>
                                    <div className={styles.itemsSummary}>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className={styles.itemRow}>
                                                <span>{typeof item.product === 'object' ? item.product.name : 'Product'} x {item.quantity}</span>
                                                {item.price !== undefined && <span>AED {(item.price * item.quantity).toFixed(2)}</span>}
                                            </div>
                                        ))}
                                        {activeTab === 'app' && (order as AppOrder).shop && (
                                            <div className={styles.itemRow}>
                                                <small>Picked up from: {typeof (order as AppOrder).shop === 'object' ? (order as AppOrder).shop.name : 'Cafe'}</small>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.orderActions}>
                                        <div className={styles.total}>
                                            AED {order.financials?.total.toFixed(2)}
                                        </div>
                                        {((activeTab === 'website' && (order as WebOrder).deliveryStatus === 'placed') ||
                                            (activeTab === 'app' && (
                                                ((order as AppOrder).orderType === 'dine-in' && (order as AppOrder).appOrderStatusDine === 'pending') ||
                                                ((order as AppOrder).orderType !== 'dine-in' && (order as AppOrder).appOrderStatus === 'pending')
                                            )) ||
                                            (activeTab === 'subscription' && (order as WebSubscription).subsStatus === 'active')) && (
                                                <button
                                                    className={styles.cancelBtn}
                                                    onClick={() => handleCancel(order.id, activeTab)}
                                                    disabled={cancelling === order.id}
                                                >
                                                    {cancelling === order.id ? 'Processing...' : 'Cancel & Refund'}
                                                </button>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <h3>No {activeTab.replace('-', ' ')} found</h3>
                        <p>You haven&apos;t made any {activeTab} yet.</p>
                        <br />
                        <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
