'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './almost-there.module.css'
import Link from 'next/link'

export default function AlmostTherePage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [referralCode, setReferralCode] = useState('')
    const [referrer, setReferrer] = useState<{ id: string, name: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    const handleValidateReferral = async () => {
        if (!referralCode.trim()) return

        setError('')
        setValidating(true)
        setReferrer(null)

        try {
            const response = await fetch('/api/users/validate-referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCode: referralCode.trim() }),
            })

            const data = await response.json()

            if (response.ok) {
                setReferrer(data.referrer)
                setSuccess(`Valid code! Referred by ${data.referrer.name}`)
            } else {
                setError(data.message || 'Invalid referral code')
            }
        } catch (err) {
            setError('Failed to validate. Try again.')
        } finally {
            setValidating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // First, get current user to get their ID
            const meRes = await fetch('/api/users/me')
            const meData = await meRes.json()

            if (!meData.user) {
                router.push('/login')
                return
            }

            // Update user profile
            const updateRes = await fetch(`/api/users/${meData.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    referralCodeInput: referralCode.trim(), // hook will handle linking
                }),
            })

            if (updateRes.ok) {
                router.push('/')
            } else {
                const data = await updateRes.json()
                setError(data.errors?.[0]?.message || 'Failed to save profile')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.icon}>✨</div>
                    <h1>Almost There!</h1>
                    <p>Tell us a bit about yourself to complete your profile.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>First Name</label>
                            <input
                                className={styles.input}
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                className={styles.input}
                                placeholder="Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={`${styles.inputGroup} ${styles.referralSection}`}>
                        <label className={styles.label}>Referral Code (Optional)</label>
                        <input
                            className={styles.input}
                            placeholder="friend1234"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                        />
                        <button
                            type="button"
                            className={styles.validateBtn}
                            onClick={handleValidateReferral}
                            disabled={validating || !referralCode.trim()}
                        >
                            {validating ? '...' : 'Validate'}
                        </button>

                        {referrer && (
                            <div className={styles.referrerInfo}>
                                <span>🎉 Recommended by <strong>{referrer.name}</strong></span>
                            </div>
                        )}

                        {error && !referrer && (
                            <div className={styles.error}>
                                <span>❌ {error}</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '12px' }}
                    >
                        {loading ? 'Saving Profile...' : 'Complete Signup'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Want to skip? <Link href="/">Go to Home</Link>      
                </p>
            </div>
        </div>
    )
}
