'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '../context/UserContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
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
    } catch (err) {
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
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex-center animate-up" style={{ minHeight: '80vh' }}>
      <div className="glass" style={styles.authCard}>
        <h1
          style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', textAlign: 'center' }}
        >
          {step === 'email' ? 'Join the Mantis' : 'Verify Email'}
        </h1>
        <p style={{ opacity: 0.6, marginBottom: '40px', textAlign: 'center' }}>
          {step === 'email'
            ? 'Create an account to start earning rewards.'
            : `We've sent a 4-digit code to ${email}`}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {step === 'email' ? (
          <form
            onSubmit={handleSendOtp}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
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
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <input
                type="text"
                maxLength={4}
                placeholder="0000"
                className="input-field"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={{
                  ...styles.input,
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '8px',
                }}
                autoFocus
              />
            </div>
            <button className="btn-primary" style={{ padding: '16px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Complete Sign Up'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={timer > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '14px',
                  cursor: timer > 0 ? 'default' : 'pointer',
                  opacity: timer > 0 ? 0.5 : 1,
                }}
              >
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  opacity: 0.5,
                  fontSize: '14px',
                  marginLeft: '16px',
                  cursor: 'pointer',
                }}
              >
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
  authCard: {
    padding: '48px',
    width: '100%',
    maxWidth: '450px',
  },
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
}
