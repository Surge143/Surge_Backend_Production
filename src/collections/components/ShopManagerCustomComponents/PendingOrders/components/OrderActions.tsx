'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export const OrderActions: React.FC<{
    orderId: string,
    selectedBaristaId?: string | number,
    onStatusUpdate?: (status: 'accepted' | 'rejected') => void
}> = ({ orderId, selectedBaristaId, onStatusUpdate }) => {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const updateStatus = async (status: 'accepted' | 'rejected') => {
        setLoading(status)

        try {
            const body: any = { orderAcceptance: status }
            if (status === 'accepted') {
                body.barista = Number(selectedBaristaId)
            }

            const res = await fetch(`/api/app-orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                // Refresh the server component to remove the order from the list
                if (onStatusUpdate) {
                    onStatusUpdate(status)
                } else {
                    router.refresh()
                }
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error("Order update failed:", {
                    status: res.status,
                    statusText: res.statusText,
                    error: errorData
                })
                alert(`Error: ${res.status} - ${JSON.stringify(errorData)}`)
            }
        } catch (err) {
            console.error("Error updating order:", err)
            alert("Network error updating order")
        } finally {
            setLoading(null)
        }
    }

    const buttonBaseStyle: React.CSSProperties = {
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    }

    const primaryButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: 'var(--theme-success-500)',
        color: 'white',
    }

    const secondaryButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: 'var(--theme-error-500)',
        color: 'white',
    }

    const disabledStyle: React.CSSProperties = {
        opacity: 0.5,
        cursor: 'not-allowed',
    }

    return (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
                style={{
                    ...primaryButtonStyle,
                    ...(loading || (loading === null && !selectedBaristaId) ? disabledStyle : {}),
                }}
                onClick={() => updateStatus('accepted')}
                disabled={!!loading || !selectedBaristaId}
            >
                {loading === 'accepted' ? 'Accepting...' : 'Accept'}
            </button>

            <button
                style={{
                    ...secondaryButtonStyle,
                    ...(loading ? disabledStyle : {}),
                }}
                onClick={() => updateStatus('rejected')}
                disabled={!!loading}
            >
                {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
        </div>
    )
}