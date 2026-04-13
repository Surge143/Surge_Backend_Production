'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useUser } from '../../context/UserContext'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Payment Form ────────────────────────────────────────────────────────────

interface PaymentFormProps {
  dbOrderId: string
  onSuccess: (id: string) => void
  onError: (msg: string) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ dbOrderId, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      onError(error.message || 'Payment failed')
      setPaying(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(dbOrderId)
    } else {
      onError('Payment not completed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stripe-element-wrapper">
        <PaymentElement options={{ layout: 'tabs', fields: { billingDetails: { address: 'never' } } }} />
      </div>
      <button className="btn-primary" type="submit" disabled={!stripe || paying}
        style={{ padding: '18px', fontSize: '15px' }} id="cafe-pay-now-btn">
        {paying ? 'Processing…' : 'Confirm & Pay'}
      </button>
    </form>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CafeCheckoutPage() {
  const { user } = useUser()
  const router = useRouter()

  const [cart, setCart] = useState<any[]>([])
  const [shop, setShop] = useState<any>(null)
  const [cartLoading, setCartLoading] = useState(true)
  const [slots, setSlots] = useState<any[]>([])

  const [orderType, setOrderType] = useState<'take-away' | 'dine-in'>('take-away')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [useWTCoins, setUseWTCoins] = useState(false)
  const [coinBalance, setCoinBalance] = useState(0)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [dbOrderId, setDbOrderId] = useState<string | null>(null)
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Fetch cart
  useEffect(() => {
    fetch('/api/app/cart', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setCart(d.items || [])
        setShop(d.shop || null)
      })
      .catch(() => {})
      .finally(() => setCartLoading(false))
  }, [])

  // Fetch coins
  useEffect(() => {
    if (!user) return
    fetch(`/api/user-wt-coins?where[user][equals]=${user.id}`)
      .then((r) => r.json())
      .then((d) => setCoinBalance(d.docs?.[0]?.totalBalance || 0))
      .catch(() => {})
  }, [user])

  // Fetch slots for selected shop
  useEffect(() => {
    const shopId = shop?.id || shop
    if (!shopId) return
    fetch(`/api/slots?where[shop][equals]=${shopId}&where[isActive][equals]=true&limit=20`)
      .then((r) => r.json())
      .then((d) => setSlots(d.docs || []))
      .catch(() => {})
  }, [shop])

  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0)
  const shopId = shop?.id || shop

  const handlePlaceOrder = async () => {
    if (!shopId) { setError('Missing shop information.'); return }
    if (cart.length === 0) { setError('Your cart is empty.'); return }

    setError('')
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout/cafe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shopId,
          orderType,
          selectedSlot: selectedSlot || undefined,
          specialInstructions,
          useWTCoins,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to place order')
        return
      }
      setClientSecret(data.clientSecret)
      setDbOrderId(data.dbOrderId)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ─── Success ─────────────────────────────────────────────────────────────

  if (successOrderId) {
    return (
      <div className="container flex-center animate-up" style={{ minHeight: '70vh', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '72px' }}>☕</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Order Placed!</h1>
        <p style={{ fontSize: '18px', opacity: 0.6, maxWidth: '480px' }}>
          Your cafe order <strong style={{ color: 'var(--primary)' }}>#{successOrderId.toString().slice(-8).toUpperCase()}</strong> is being prepared. We&apos;ll notify you when it&apos;s ready.
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button className="btn-primary" onClick={() => router.push('/profile')}>View Orders</button>
          <button className="btn-outline" onClick={() => router.push('/app')}>Back to Cafes</button>
        </div>
      </div>
    )
  }

  // ─── Payment Step ─────────────────────────────────────────────────────────

  if (clientSecret && dbOrderId) {
    return (
      <div className="container animate-up" style={{ padding: '60px 0', maxWidth: '580px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>Complete Payment</h1>
        <p style={{ opacity: 0.5, marginBottom: '40px', fontSize: '14px' }}>
          Order #{dbOrderId.toString().slice(-8).toUpperCase()} · AED {subtotal.toFixed(2)}
        </p>
        <div className="glass" style={{ padding: '32px' }}>
          <Elements stripe={stripePromise} options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: { colorPrimary: '#c4a484', colorBackground: '#0f0c09', colorText: '#f5f5f5', fontFamily: 'Outfit, sans-serif', borderRadius: '12px' }
            }
          }}>
            <PaymentForm
              dbOrderId={dbOrderId}
              onSuccess={(id) => {
                setSuccessOrderId(id)
                // Clear app cart
                fetch('/api/app/cart', { method: 'DELETE', credentials: 'include' }).catch(() => {})
              }}
              onError={(msg) => { setError(msg); setClientSecret(null) }}
            />
          </Elements>
        </div>
        {error && <div style={styles.errorBox}>{error}</div>}
        <button style={styles.backBtn} onClick={() => { setClientSecret(null); setDbOrderId(null); setError('') }}>
          ← Change order details
        </button>
      </div>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (cartLoading) {
    return (
      <div className="container animate-up" style={{ padding: '60px 0', maxWidth: '720px' }}>
        <div className="skeleton" style={{ height: '48px', borderRadius: '12px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: '20px' }} />
      </div>
    )
  }

  // ─── Empty cart ───────────────────────────────────────────────────────────

  if (cart.length === 0) {
    return (
      <div className="container flex-center animate-up" style={{ minHeight: '70vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px' }}>☕</div>
        <h1 style={{ fontSize: '36px', fontWeight: '900' }}>Nothing in your cart</h1>
        <p style={{ opacity: 0.5 }}>Go back and add some items to your order.</p>
        <Link href="/app"><button className="btn-primary" style={{ marginTop: '8px' }}>Browse Cafes</button></Link>
      </div>
    )
  }

  // ─── Main checkout form ───────────────────────────────────────────────────

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <h1 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '48px' }}>Cafe Checkout</h1>

      {!user && (
        <div style={{ ...styles.errorBox, marginBottom: '32px', borderColor: 'rgba(196,164,132,0.3)', background: 'rgba(196,164,132,0.08)', color: 'var(--primary)' }}>
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</Link> to place your order and earn loyalty stamps.
        </div>
      )}

      <div style={styles.grid}>
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Order Type */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Order Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(['take-away', 'dine-in'] as const).map((type) => (
                <button
                  key={type}
                  className={`selection-option${orderType === type ? ' selected' : ''}`}
                  onClick={() => setOrderType(type)}
                  id={`order-type-${type}`}
                >
                  {type === 'take-away' ? '🥡 Take Away' : '🪑 Dine In'}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot */}
          {slots.length > 0 && (
            <div className="glass" style={styles.card}>
              <h3 style={styles.cardTitle}>Select Time Slot <span style={{ opacity: 0.4, fontWeight: '400' }}>(optional)</span></h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className={`selection-option${!selectedSlot ? ' selected' : ''}`}
                  onClick={() => setSelectedSlot('')}
                >
                  <span>ASAP</span>
                  <span style={{ opacity: 0.5, fontSize: '12px' }}>As soon as possible</span>
                </button>
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    className={`selection-option${selectedSlot === String(slot.id) ? ' selected' : ''}`}
                    onClick={() => setSelectedSlot(String(slot.id))}
                    style={{ opacity: slot.currentLoad >= slot.maxCapacity ? 0.4 : 1 }}
                    disabled={slot.currentLoad >= slot.maxCapacity}
                  >
                    <span>{slot.slotLabel || slot.startTime}</span>
                    <span style={{ opacity: 0.5, fontSize: '12px' }}>{slot.currentLoad}/{slot.maxCapacity} booked</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WTCoins */}
          {coinBalance > 0 && (
            <div className="glass" style={{ ...styles.card, background: 'rgba(196,164,132,0.05)', borderColor: 'rgba(196,164,132,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: '800', marginBottom: '4px' }}>Use WTCoins</h4>
                  <p style={{ fontSize: '13px', opacity: 0.55 }}>You have {coinBalance} coins (~AED {(coinBalance * 0.01).toFixed(2)} off)</p>
                </div>
                <div
                  onClick={() => setUseWTCoins(!useWTCoins)}
                  style={{
                    width: '48px', height: '28px', borderRadius: '14px', cursor: 'pointer',
                    background: useWTCoins ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', padding: '3px', transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                    transform: useWTCoins ? 'translateX(20px)' : 'translateX(0)', transition: 'all 0.2s',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Special Instructions <span style={{ opacity: 0.4, fontWeight: '400' }}>(optional)</span></h3>
            <textarea
              className="input-field"
              placeholder="Allergies, preferences, extra notes…"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="glass" style={styles.summaryCard}>
          <h3 style={styles.cardTitle}>Order Summary</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
            {cart.map((item) => (
              <div key={item.id} style={styles.summaryItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </p>
                  {item.customizations?.length > 0 && (
                    <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '2px' }}>
                      {item.customizations.map((c: any) => c.label).join(', ')}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', opacity: 0.45, marginTop: '2px' }}>Qty: {item.quantity}</p>
                </div>
                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--primary)', flexShrink: 0, marginLeft: '12px' }}>
                  AED {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={{ ...styles.priceRow, fontSize: '20px', fontWeight: '900' }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>AED {subtotal.toFixed(2)}</span>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '18px', marginTop: '24px', fontSize: '15px' }}
            onClick={handlePlaceOrder}
            disabled={checkoutLoading || !user || cart.length === 0}
            id="cafe-place-order-btn"
          >
            {!user ? 'Sign In to Order' : checkoutLoading ? 'Preparing Order…' : 'Place Order & Pay'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', opacity: 0.35, marginTop: '12px' }}>
            Secured by Stripe · AED · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '40px',
    alignItems: 'start',
  },
  card: { padding: '28px 32px' },
  cardTitle: { fontSize: '16px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.2px' },
  summaryCard: { padding: '28px 32px', position: 'sticky', top: '110px' },
  summaryItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.07)', margin: '16px 0' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  errorBox: {
    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
    color: '#e74c3c', padding: '14px 16px', borderRadius: '12px', fontSize: '14px', marginTop: '16px', lineHeight: '1.5',
  },
  backBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '13px',
    cursor: 'pointer', marginTop: '20px', padding: '4px 0', display: 'block',
  },
}
