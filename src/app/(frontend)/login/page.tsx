'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/otp/send-web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                // Redirect to OTP verification page
                router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
            } else {
                setError(data.message || 'Failed to send OTP')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGuestCheckout = () => {
        router.push('/products')
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.icon}>☕</div>
                    <h1>Welcome Back</h1>
                    <p>Enter your email to receive a verification code</p>
                </div>

                <form onSubmit={handleSendOTP} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Sending...
                            </>
                        ) : (
                            'Send Verification Code'
                        )}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>or</span>
                </div>

                <button
                    onClick={handleGuestCheckout}
                    className="btn btn-outline btn-lg"
                    style={{ width: '100%' }}
                >
                    Continue as Guest
                </button>

                <p className={styles.footer}>
                    By continuing, you agree to our{' '}
                    <a href="/terms">Terms of Service</a> and{' '}
                    <a href="/privacy">Privacy Policy</a>
                </p>
            </div>
        </div>
    )
}
