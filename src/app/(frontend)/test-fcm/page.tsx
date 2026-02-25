'use client'

import { useState } from 'react'
import { sendTestNotification } from './actions'

export default function TestFCMPage() {
    const [token, setToken] = useState('')
    const [status, setStatus] = useState<{
        loading: boolean
        error?: string
        success?: string
    }>({ loading: false })

    const handleSend = async () => {
        if (!token) {
            setStatus({ loading: false, error: 'Please enter an FCM token' })
            return
        }

        setStatus({ loading: true })
        try {
            const result = await sendTestNotification(token)
            if (result.success) {
                setStatus({ loading: false, success: 'Notification sent successfully! Check server logs.' })
            } else {
                setStatus({ loading: false, error: result.error })
            }
        } catch (err: any) {
            setStatus({ loading: false, error: err.message || 'An unexpected error occurred' })
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '1.5rem', color: '#333' }}>FCM Notification Tester</h1>

            <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                    Enter your Android device token below to send a test notification from the server component.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="token" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Device Token
                    </label>
                    <input
                        id="token"
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="PASTE_YOUR_COPIED_ANDROID_TOKEN_HERE"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={status.loading}
                    style={{
                        backgroundColor: status.loading ? '#ccc' : '#0070f3',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: status.loading ? 'not-allowed' : 'pointer',
                        width: '100%'
                    }}
                >
                    {status.loading ? 'Sending...' : 'Send Test Notification'}
                </button>

                {status.error && (
                    <div style={{ marginTop: '1rem', color: '#d32f2f', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                        <strong>Error:</strong> {status.error}
                    </div>
                )}

                {status.success && (
                    <div style={{ marginTop: '1rem', color: '#388e3c', padding: '0.75rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                        {status.success}
                    </div>
                )}
            </div>
        </div>
    )
}
