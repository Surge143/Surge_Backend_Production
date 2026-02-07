'use client'

import { Collapsible } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { OrderActions } from './OrderActions'

export const OrderListClient: React.FC<{
    initialOrders: any[],
    baristas: { id: string | number, name: string, shop: any }[]
}> = ({ initialOrders, baristas = [] }) => {
    const [orders, setOrders] = useState<any[]>(initialOrders)
    const [selectedBaristas, setSelectedBaristas] = useState<Record<string, string | number>>({})
    const router = useRouter()

    useEffect(() => {
        // Initialize socket connection
        const socket = io()

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id)
        })

        socket.on('order-created', (newOrder: any) => {
            console.log('New order received:', newOrder)
            try {
                // Filter for pending orders only (safety check)
                if (newOrder.orderAcceptance === 'pending') {
                    setOrders((prev) => {
                        // Avoid duplicates
                        if (prev.find(o => o.id === newOrder.id)) return prev
                        return [newOrder, ...prev]
                    })
                }
            } catch (err) {
                console.error('Socket Message Error:', err)
            }
        })

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err)
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const handleUpdate = (orderId: string, status: 'accepted' | 'rejected') => {
        // Manually update local state to reflect the change immediately
        setOrders(prev => prev.filter(o => o.id !== orderId))
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.length > 0 ? (
                orders.map((order: any) => (
                    <div
                        key={order.id}
                        style={{
                            border: '1px solid var(--theme-elevation-150)',
                            background: 'var(--theme-elevation-50)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Order Header */}
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
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* Barista Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>Assign Barista</label>
                                    <select
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid var(--theme-elevation-200)',
                                            background: 'var(--theme-elevation-100)',
                                            color: 'inherit',
                                            fontSize: '0.85rem'
                                        }}
                                        value={selectedBaristas[order.id] || ''}
                                        onChange={(e) => setSelectedBaristas(prev => ({
                                            ...prev,
                                            [order.id]: e.target.value
                                        }))}
                                    >
                                        <option value="">Select Barista... ({baristas.length})</option>
                                        {baristas.length === 0 && <option disabled>Check Admins collection</option>}
                                        {baristas
                                            // .filter(b => {
                                            //     // 1. Get Order Shop ID
                                            //     const orderShopId = typeof order.shop === 'object' ? order.shop?.id : order.shop

                                            //     // 2. Get Barista Shop ID
                                            //     let baristaShopId = b.shop
                                            //     if (typeof b.shop === 'object' && b.shop !== null) {
                                            //         baristaShopId = b.shop.id
                                            //     }

                                            //     // 3. Logic: If no shop assigned to order OR barista, show them
                                            //     if (!orderShopId || !baristaShopId) return true

                                            //     // 4. Compare IDs as strings
                                            //     return String(orderShopId) === String(baristaShopId)
                                            // })
                                            .map(barista => (
                                                <option key={barista.id} value={barista.id}>
                                                    {barista.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                {/* Client Actions */}
                                <OrderActions
                                    orderId={order.id}
                                    selectedBaristaId={selectedBaristas[order.id]}
                                    onStatusUpdate={(status) => handleUpdate(order.id, status)}
                                />
                            </div>
                        </div>

                        {/* Collapsible Product List */}
                        <Collapsible
                            header={`View Order Details (${order.menuRelation?.length || 0} items)`}
                        >
                            <div style={{ padding: '1rem', background: 'var(--theme-elevation-100)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--theme-elevation-200)', opacity: 0.5, fontSize: '0.75rem', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem' }}>Item</th>
                                            <th style={{ padding: '0.5rem' }}>Price</th>
                                        </tr>
                                    </thead>
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
                ))
            ) : (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                    <h3>No Pending Orders</h3>
                    <p>New orders will appear here automatically.</p>
                </div>
            )}
        </div>
    )
}
