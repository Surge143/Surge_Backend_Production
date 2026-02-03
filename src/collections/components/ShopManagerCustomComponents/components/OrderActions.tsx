'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export const OrderActions: React.FC<{ orderId: string, onStatusUpdate?: (status: 'accepted' | 'rejected') => void }> = ({ orderId, onStatusUpdate }) => {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const updateStatus = async (status: 'accepted' | 'rejected') => {
        setLoading(status)

        try {
            const res = await fetch(`/api/app-orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderAcceptance: status }),
            })

            if (res.ok) {
                // Refresh the server component to remove the order from the list
                if (onStatusUpdate) {
                    onStatusUpdate(status)
                } else {
                    router.refresh()
                }
            }
        } catch (err) {
            console.error("Error updating order:", err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
                size="large"
                buttonStyle="primary"
                onClick={() => updateStatus('accepted')}
                disabled={!!loading}
            >
                {loading === 'accepted' ? 'Accepting...' : 'Accept'}
            </Button>

            <Button
                size="large"
                buttonStyle="secondary"
                onClick={() => updateStatus('rejected')}
                disabled={!!loading}
            >
                {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </Button>
        </div>
    )
}