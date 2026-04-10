'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useUser } from '../context/UserContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)

  const router = useRouter()
  const { login } = useUser()

  useEffect(() => {
    let interval: any
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'apple_auth_failed') {
      setError('Apple sign-up failed. Please try again.')
    }
  }, [])

  const handleAppleSignUp = async () => {
    try {
      setAppleLoading(true)
      setError('')
      await signIn('apple', { callbackUrl: '/api/auth/set-payload-session' })
    } catch {
      setError('Apple sign-up failed. Please try again.')
      setAppleLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/otp/send-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStep('otp')
        setTimer(60)
      } else {
        setError(data.message || 'Failed to send OTP')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/otp/verify-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        login(data.user)
        router.push('/profile')
      } else {
        setError(data.message || 'Invalid verification code')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex-center animate-up" style={{ minHeight: '80vh' }}>
      <div className="glass" style={styles.authCard}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', textAlign: 'center' }}>
          {step === 'email' ? 'Join Surge' : 'Verify Email'}
        </h1>
        <p style={{ opacity: 0.6, marginBottom: '40px', textAlign: 'center' }}>
          {step === 'email'
            ? 'Create an account to start earning rewards.'
            : `We've sent a 4-digit code to ${email}`}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <button className="btn-primary" style={{ padding: '16px' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Create Account'}
            </button>

            <div style={styles.dividerRow}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine} />
            </div>

            <button
              type="button"
              onClick={handleAppleSignUp}
              disabled={appleLoading}
              style={{ ...styles.appleBtn, opacity: appleLoading ? 0.6 : 1, cursor: appleLoading ? 'not-allowed' : 'pointer' }}
            >
              {appleLoading ? (
                <span>Redirecting to Apple...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000"
                    style={{ width: '18px', height: '18px', fill: 'white', flexShrink: 0 }}>
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-169.3-115.5C113 388.2 26 251.5 26 119.6c0-130.3 70.9-199.2 186.6-199.2 57.5 0 105.4 39.5 167.5 39.5 60.1 0 96.9-39.5 169.3-39.5 57.5 0 107.3 23.3 148.4 72.2zm-261.3-62.2c-37.5-48.6-99.7-85.5-162-85.5-2.6 0-5.1.3-7.7.9 1.3 80.6 43.4 143.8 88.1 188.3 47.3 47.9 103.7 77.2 165.9 77.2 2.6 0 5.1-.3 7.7-.6-2-77.2-40.5-143.8-92-180.3z" />
                  </svg>
                  <span>Continue with Apple</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              type="text"
              maxLength={4}
              placeholder="0000"
              className="input-field"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ ...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              autoFocus
            />
            <button className="btn-primary" style={{ padding: '16px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Complete Sign Up'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={handleSendOtp} disabled={timer > 0 || loading}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '14px', cursor: timer > 0 ? 'default' : 'pointer', opacity: timer > 0 ? 0.5 : 1 }}>
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
              </button>
              <button type="button" onClick={() => setStep('email')}
                style={{ background: 'none', border: 'none', color: 'white', opacity: 0.5, fontSize: '14px', marginLeft: '16px', cursor: 'pointer' }}>
                Change Email
              </button>
            </div>
          </form>
        )}

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', opacity: 0.6 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  authCard: { padding: '48px', width: '100%', maxWidth: '450px' },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '16px',
    borderRadius: '12px',
    color: 'white',
    outline: 'none',
  },
  error: {
    background: 'rgba(255, 59, 48, 0.1)',
    color: '#ff3b30',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' },
  dividerText: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px' },
  appleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 16px',
    background: '#000',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    cursor: 'pointer',
  },
}
