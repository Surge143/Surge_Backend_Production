'use client'

import { Collapsible } from '@payloadcms/ui'
import React, { useEffect, useState, useMemo } from 'react'
import { io } from 'socket.io-client'
import Denque from 'denque'

export const AcceptedOrdersClient: React.FC<{
    initialOrders: any[],
    currentUser: { id: string | number, role?: string | null } | null
}> = ({ initialOrders, currentUser }) => {
    // using separate states for now and slot orders
    const [nowOrdersArr, setNowOrdersArr] = useState<any[]>(
        initialOrders.filter(o => o.timeSelection === 'now' || !o.timeSelection)
    )
    const [slotOrders, setSlotOrders] = useState<any[]>(
        initialOrders.filter(o => o.timeSelection === 'custom')
    )

    // Using Denque for logical queue management of Now orders
    // In React, we still need to render an array, so we sync them
    const nowQueue = useMemo(() => {
        const queue = new Denque(nowOrdersArr)
        return queue
    }, [nowOrdersArr])

    // Sorting logic for now orders: Purely Time-based (Oldest Order first)
    const sortedNowOrders = useMemo(() => {
        return nowQueue.toArray().sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime()
            const bTime = new Date(b.createdAt).getTime()
            return aTime - bTime
        })
    }, [nowQueue])

    // Sorting logic for slot orders: By Slot Time > Oldest Order (CreatedAt)
    const sortedSlotOrders = useMemo(() => {
        return [...slotOrders].sort((a, b) => {
            const aSlotTime = a.slot?.slot ? new Date(a.slot.slot).getTime() : 0
            const bSlotTime = b.slot?.slot ? new Date(b.slot.slot).getTime() : 0

            if (aSlotTime !== bSlotTime) {
                return aSlotTime - bSlotTime
            }

            const aTime = new Date(a.createdAt).getTime()
            const bTime = new Date(b.createdAt).getTime()
            return aTime - bTime
        })
    }, [slotOrders])

    useEffect(() => {
        const socket = io()

        const isOrderForCurrentUser = (order: any) => {
            if (!currentUser) return true
            if (currentUser.role !== 'barista') return true
            const baristaId = typeof order.barista === 'object' ? order.barista.id : order.barista
            return String(baristaId) === String(currentUser.id)
        }

        const handleOrderUpdate = (updatedOrder: any) => {
            if (!isOrderForCurrentUser(updatedOrder)) {
                setNowOrdersArr(prev => prev.filter(o => o.id !== updatedOrder.id))
                setSlotOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
                return
            }

            if (updatedOrder.orderAcceptance === 'accepted') {
                if (updatedOrder.timeSelection === 'custom') {
                    setSlotOrders(prev => {
                        const exists = prev.find(o => o.id === updatedOrder.id)
                        if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                        return [...prev, updatedOrder]
                    })
                    setNowOrdersArr(prev => prev.filter(o => o.id !== updatedOrder.id))
                } else {
                    setNowOrdersArr(prev => {
                        const exists = prev.find(o => o.id === updatedOrder.id)
                        if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                        return [...prev, updatedOrder]
                    })
                    setSlotOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
                }
            } else if (updatedOrder.orderAcceptance === 'rejected') {
                setNowOrdersArr(prev => prev.filter(o => o.id !== updatedOrder.id))
                setSlotOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
            }
        }

        socket.on('order-updated', handleOrderUpdate)
        socket.on('order-created', handleOrderUpdate)

        return () => {
            socket.disconnect()
        }
    }, [currentUser])

    const handleMarkComplete = async (orderId: string) => {
        setNowOrdersArr(prev => prev.filter(o => o.id !== orderId))
        setSlotOrders(prev => prev.filter(o => o.id !== orderId))
        // In a real app, you'd call an API to mark as complete/delivered
    }

    const OrderCard = ({ order }: { order: any }) => (
        <div
            key={order.id}
            style={{
                border: '1px solid var(--theme-elevation-150)',
                background: 'var(--theme-elevation-50)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '1rem'
            }}
        >
            <div style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--theme-elevation-150)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h3 style={{ margin: 0 }}>{order.name}</h3>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', opacity: 0.6 }}>
                        Shop: {order.shop?.name || 'Unknown'}
                    </p>
                    {order.timeSelection === 'custom' && order.slot?.slot && (
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--theme-warning-500)' }}>
                            Slot: {new Date(order.slot.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
                <button
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: 'var(--theme-success-500)',
                        color: 'white',
                    }}
                    onClick={() => handleMarkComplete(order.id)}
                >
                    Complete
                </button>
            </div>
            <Collapsible header={`Details (${order.menuRelation?.length || 0} items)`}>
                <div style={{ padding: '1rem', background: 'var(--theme-elevation-100)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {order.menuRelation?.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--theme-elevation-150)' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.name}</td>
                                    <td style={{ padding: '0.75rem' }}>₹{item.price || '0'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Collapsible>
        </div>
    )

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Now Orders Container */}
            <div>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--theme-success-500)' }}></span>
                    Now Orders (Queue)
                </h2>
                {sortedNowOrders.length > 0 ? (
                    sortedNowOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--theme-elevation-200)', borderRadius: '6px' }}>
                        <p style={{ opacity: 0.5 }}>Queue is empty</p>
                    </div>
                )}
            </div>

            {/* Slot Orders Container */}
            <div>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--theme-warning-500)' }}></span>
                    Slot Orders
                </h2>
                {sortedSlotOrders.length > 0 ? (
                    sortedSlotOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--theme-elevation-200)', borderRadius: '6px' }}>
                        <p style={{ opacity: 0.5 }}>No scheduled orders</p>
                    </div>
                )}
            </div>
        </div>
    )
}
