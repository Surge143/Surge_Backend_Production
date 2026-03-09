'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './verify.module.css'

function VerifyOTPContent() {
    const [otp, setOtp] = useState(['', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    useEffect(() => {
        // Redirect back to login if no email is present
        if (!email) {
            router.push('/login')
            return
        }
        // Focus first input on mount
        inputRefs.current[0]?.focus()
    }, [email, router])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // Only allow digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only take last character
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all 4 digits are entered
        if (index === 3 && value) {
            const fullOtp = [...newOtp.slice(0, 3), value].join('')
            handleVerify(fullOtp)
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 4)
        if (!/^\d+$/.test(pastedData)) return

        const newOtp = pastedData.split('').concat(['', '', '', '']).slice(0, 4)
        setOtp(newOtp)

        if (pastedData.length === 4) {
            handleVerify(pastedData)
        }
    }

    const handleVerify = async (otpCode?: string) => {
        const code = otpCode || otp.join('')
        if (code.length !== 4) {
            setError('Please enter all 4 digits')
            return
        }

        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/otp/verify-web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code }),
            })

            const data = await response.json()

            if (response.ok) {
                // If it's a new user, send them to the "Almost There" screen
                if (data.isNewUser) {
                    router.push('/almost-there')
                } else {
                    router.push('/')
                }
            } else {
                setError(data.message || 'Invalid verification code')
                setOtp(['', '', '', ''])
                inputRefs.current[0]?.focus()
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setOtp(['', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/otp/resend-web', {
                method: 'POST',
            })

            if (response.ok) {
                setError('')
                alert('New verification code sent!')
            } else {
                const data = await response.json()
                setError(data.message || 'Failed to resend code')
            }
        } catch (err) {
            setError('Failed to resend code')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.icon}>✉️</div>
                    <h1>Verify Your Email</h1>
                    <p>We&apos;ve sent a 4-digit code to your email</p>
                </div>

                <div className={styles.otpInputs} onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={styles.otpInput}
                            disabled={loading}
                        />
                    ))}
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
                    onClick={() => handleVerify()}
                    className="btn btn-primary btn-lg"
                    disabled={loading || otp.join('').length !== 4}
                    style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                >
                    {loading ? (
                        <>
                            <span className={styles.spinner}></span>
                            Verifying...
                        </>
                    ) : (
                        'Verify Code'
                    )}
                </button>

                <div className={styles.footer}>
                    <p>Didn&apos;t receive the code?</p>
                    <button onClick={handleResend} className={styles.resendBtn} disabled={loading}>
                        Resend Code
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOTPContent />
        </Suspense>
    )
}
