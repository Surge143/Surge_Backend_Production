'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useUser } from '../context/UserContext'

declare global {
  interface Window {
    google?: any
    handleGoogleCredential?: (response: { credential: string }) => void
  }
}

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000"
    style={{ width: '18px', height: '18px', fill: 'white', flexShrink: 0 }}>
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-169.3-115.5C113 388.2 26 251.5 26 119.6c0-130.3 70.9-199.2 186.6-199.2 57.5 0 105.4 39.5 167.5 39.5 60.1 0 96.9-39.5 169.3-39.5 57.5 0 107.3 23.3 148.4 72.2zm-261.3-62.2c-37.5-48.6-99.7-85.5-162-85.5-2.6 0-5.1.3-7.7.9 1.3 80.6 43.4 143.8 88.1 188.3 47.3 47.9 103.7 77.2 165.9 77.2 2.6 0 5.1-.3 7.7-.6-2-77.2-40.5-143.8-92-180.3z" />
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)

  const router = useRouter()
  const { login } = useUser()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const gsiLoaded = useRef(false)

  // ── Timer countdown ──
  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  // ── Load Google Identity Services & render button ──
  useEffect(() => {
    if (gsiLoaded.current) return

    const initGSI = () => {
      if (!window.google || gsiLoaded.current) return
      gsiLoaded.current = true

      window.handleGoogleCredential = async (response) => {
        setGoogleLoading(true)
        setError('')
        try {
          const res = await fetch('/api/website/google-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ googleToken: response.credential }),
          })
          const data = await res.json()
          if (res.ok && data.user) {
            login(data.user)
            router.push('/profile')
          } else {
            setError(data.error || 'Google sign-in failed')
          }
        } catch {
          setError('Google sign-in failed. Please try again.')
        } finally {
          setGoogleLoading(false)
        }
      }

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
        callback: window.handleGoogleCredential,
        ux_mode: 'popup',
      })

      // Render the styled Google button
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: googleBtnRef.current.offsetWidth || 380,
          logo_alignment: 'center',
        })
      }
    }

    // If GSI script already loaded
    if (window.google) {
      initGSI()
      return
    }

    // Otherwise load it
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGSI
    document.head.appendChild(script)
  }, [login, router])

  const handleAppleLogin = async () => {
    setAppleLoading(true)
    setError('')
    try {
      await signIn('apple', { callbackUrl: '/api/auth/set-payload-session' })
    } catch {
      setError('Apple sign-in failed. Please try again.')
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
        <h1 style={styles.heading}>
          {step === 'email' ? 'Welcome Back' : 'Verify Identity'}
        </h1>
        <p style={styles.subheading}>
          {step === 'email'
            ? 'The world of specialty coffee awaits.'
            : `We sent a 4-digit code to ${email}`}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {step === 'email' ? (
          <>
            {/* ── Google GSI button (rendered by SDK) ── */}
            <div style={{ marginBottom: '12px', position: 'relative', minHeight: '44px' }}>
              {googleLoading && (
                <div style={styles.socialOverlay}>Signing in with Google…</div>
              )}
              {/* GSI renders its iframe button here */}
              <div ref={googleBtnRef} id="google-signin-btn" style={{ width: '100%' }} />
            </div>

            {/* ── Apple button (NextAuth) ── */}
            <button
              type="button"
              id="apple-login-btn"
              onClick={handleAppleLogin}
              disabled={appleLoading}
              style={styles.appleBtn}
            >
              <AppleIcon />
              <span>{appleLoading ? 'Redirecting to Apple…' : 'Sign in with Apple'}</span>
            </button>

            <div style={styles.dividerRow}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or sign in with email</span>
              <div style={styles.dividerLine} />
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <input
                type="email"
                placeholder="Email Address"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
              <button className="btn-primary" style={{ padding: '16px' }} disabled={loading} id="send-otp-btn">
                {loading ? 'Sending Code…' : 'Send Login Code'}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              type="text"
              maxLength={4}
              placeholder="0000"
              className="input-field"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px' }}
              autoFocus
              id="otp-input"
            />
            <button className="btn-primary" style={{ padding: '16px' }} disabled={loading} id="verify-otp-btn">
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button type="button" onClick={handleSendOtp} disabled={timer > 0 || loading}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '14px', cursor: timer > 0 ? 'default' : 'pointer', opacity: timer > 0 ? 0.5 : 1 }}>
                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
              </button>
              <button type="button" onClick={() => setStep('email')}
                style={{ background: 'none', border: 'none', color: 'white', opacity: 0.4, fontSize: '14px', cursor: 'pointer' }}>
                Change Email
              </button>
            </div>
          </form>
        )}

        <p style={styles.footer}>
          New to Surge?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  authCard: { padding: '48px', width: '100%', maxWidth: '460px' },
  heading: { fontSize: '32px', fontWeight: '900', marginBottom: '8px', textAlign: 'center' },
  subheading: { opacity: 0.55, marginBottom: '32px', textAlign: 'center', fontSize: '15px' },
  error: {
    background: 'rgba(231,76,60,0.1)', color: '#e74c3c',
    padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
    marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(231,76,60,0.2)',
  },
  appleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px',
    background: '#000', color: 'white', border: '1px solid rgba(255,255,255,0.12)',
    transition: 'all 0.2s',
  },
  socialOverlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    background: 'rgba(10,8,6,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', borderRadius: '4px', color: 'rgba(255,255,255,0.7)',
  },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.3px', whiteSpace: 'nowrap' },
  footer: { marginTop: '28px', textAlign: 'center', fontSize: '14px', opacity: 0.55 },
}
