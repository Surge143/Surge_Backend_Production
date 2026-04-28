'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Types ───────────────────────────────────────────────────────────────────

type DeliveryOption = 'delivery' | 'pickup'

interface Address {
  addressFirstName: string
  addressLastName: string
  street: string
  city: string
  emirates: string
  phoneNumber: string
}

interface SavedAddress extends Address {
  id: string
  label?: string
}

interface TaxShipping {
  taxRate: number
  shippingCharge: number
}

interface CheckoutResponse {
  error?: string
  clientSecret?: string | null
  dbOrderId?: string | number | null
}

const getErrorMessage = (fallback: string, value: unknown) => {
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ─── Stripe Payment Form (inner) ──────────────────────────────────────────────

interface PaymentFormProps {
  dbOrderId: string
  onSuccess: (orderId: string) => void
  onError: (msg: string) => void
  clearCart: () => void
  billingDetails: {
    name?: string
    email?: string
    phone?: string
    address: {
      line1?: string
      city?: string
      country: string
    }
  }
}

const PaymentForm: React.FC<PaymentFormProps> = ({ dbOrderId, onSuccess, onError, clearCart, billingDetails }) => {
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
      confirmParams: {
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
    })

    if (error) {
      onError(error.message || 'Payment failed')
      setPaying(false)
    } else if (paymentIntent?.status === 'succeeded') {
      clearCart()
      onSuccess(dbOrderId)
    } else {
      onError('Payment was not completed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="stripe-element-wrapper">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>
      <button
        type="submit"
        className="btn-primary"
        style={{ padding: '18px', fontSize: '15px', marginTop: '8px' }}
        disabled={!stripe || paying}
        id="pay-now-btn"
      >
        {paying ? 'Processing Payment…' : 'Pay Now'}
      </button>
    </form>
  )
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, subtotal, totalItems, clearCart, refreshCart } = useCart()
  const { user } = useUser()
  const router = useRouter()

  // Form state
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('delivery')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<Address>({
    addressFirstName: '',
    addressLastName: '',
    street: '',
    city: '',
    emirates: 'dubai',
    phoneNumber: '',
  })
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [orderNotes, setOrderNotes] = useState('')

  // Pricing state
  const [taxShipping, setTaxShipping] = useState<TaxShipping>({ taxRate: 0, shippingCharge: 0 })
  const [taxShippingLoading, setTaxShippingLoading] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponValidating, setCouponValidating] = useState(false)

  // Checkout flow state
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [dbOrderId, setDbOrderId] = useState<string | null>(null)
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      setEmail((user as any).contactEmail || user.email || '')
      fetch(`/api/users/${user.id}/addresses`)
        .then((r) => r.json())
        .then((d) => setSavedAddresses(d.addresses || []))
        .catch(() => {})
    }
  }, [user])

  // Recalculate tax/shipping whenever delivery option or address emirates changes
  const recalcTaxShipping = useCallback(async () => {
    if (cart.length === 0) return
    setTaxShippingLoading(true)
    try {
      const body: any = { deliveryOption }
      if (deliveryOption === 'delivery') {
        body.shippingAddress = { ...address, addressCountry: 'United Arab Emirates' }
      }
      const res = await fetch('/api/checkout/calculate-tax-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setTaxShipping({ taxRate: data.taxRate || 0, shippingCharge: data.shippingCharge || 0 })
      }
    } catch {
      // ignore, use 0
    } finally {
      setTaxShippingLoading(false)
    }
  }, [deliveryOption, address.emirates, cart.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    recalcTaxShipping()
  }, [recalcTaxShipping])

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) { setCouponError('Please enter a coupon code'); return }
    setCouponValidating(true)
    setCouponError('')
    try {
      const res = await fetch(`/api/surge-coupon/coupons/${code}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid coupon code')
        return
      }
      setAppliedCoupon({ code, ...data.coupon })
    } catch {
      setCouponError('Failed to validate coupon. Please try again.')
    } finally {
      setCouponValidating(false)
    }
  }

  const handleSelectSavedAddress = (id: string) => {
    const found = savedAddresses.find((a) => String(a.id) === id)
    if (found) setAddress(found)
  }

  const handlePlaceOrder = async () => {
    if (!email) { setCheckoutError('Please enter your email address.'); return }
    if (deliveryOption === 'delivery' && !address.street) {
      setCheckoutError('Please enter your shipping address.')
      return
    }

    setCheckoutError('')
    setCheckoutLoading(true)

    try {
      const body: any = {
        email,
        deliveryOption,
        shippingAddressAsBillingAddress: true,
        orderNotes,
        ...(appliedCoupon ? { appliedCouponCode: appliedCoupon.code } : {}),
      }

      if (deliveryOption === 'delivery') {
        body.shippingAddress = { ...address, addressCountry: 'United Arab Emirates' }
      } else {
        body.billingAddress = { ...address, addressCountry: 'United Arab Emirates' }
      }

      const res = await fetch('/api/checkout/one-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await parseJsonSafely<CheckoutResponse>(res)

      if (!res.ok) {
        setCheckoutError(getErrorMessage('Failed to create order. Please try again.', data?.error))
        return
      }

      const nextClientSecret = typeof data?.clientSecret === 'string' ? data.clientSecret : ''
      const nextOrderId = data?.dbOrderId !== null && data?.dbOrderId !== undefined ? String(data.dbOrderId) : ''

      if (!nextClientSecret || !nextOrderId) {
        setCheckoutError('Checkout response was incomplete. Please try again.')
        return
      }

      setClientSecret(nextClientSecret)
      setDbOrderId(nextOrderId)
    } catch (err: any) {
      setCheckoutError(err.message || 'An unexpected error occurred.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ─── Computed totals ───────────────────────────────────────────────────────

  const taxAmount = subtotal * (taxShipping.taxRate / 100)
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? subtotal * (appliedCoupon.discountAmount / 100)
      : Number(appliedCoupon.discountAmount || 0)
    : 0
  const finalTotal = Math.max(0, subtotal - couponDiscount) + taxShipping.shippingCharge + taxAmount
  const displaySuccessOrderId = successOrderId ? String(successOrderId) : ''
  const displayDbOrderId = dbOrderId ? String(dbOrderId) : ''
  const readyForPayment = typeof clientSecret === 'string' && clientSecret.length > 0 && !!displayDbOrderId

  // ─── Success state ─────────────────────────────────────────────────────────

  if (displaySuccessOrderId) {
    return (
      <div className="container flex-center animate-up" style={{ minHeight: '70vh', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '72px' }}>🎉</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Order Placed!</h1>
        <p style={{ fontSize: '18px', opacity: 0.6, maxWidth: '500px' }}>
          Your order <strong style={{ color: 'var(--primary)' }}>#{displaySuccessOrderId.slice(-8).toUpperCase()}</strong> has been placed and payment confirmed. You&apos;ll receive an email confirmation shortly.
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button className="btn-primary" onClick={() => router.push('/profile')}>
            View Orders
          </button>
          <button className="btn-outline" onClick={() => router.push('/store')}>
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty cart ────────────────────────────────────────────────────────────

  if (totalItems === 0 && !readyForPayment) {
    return (
      <div className="container flex-center animate-up" style={{ minHeight: '70vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px' }}>🛒</div>
        <h1 style={{ fontSize: '36px', fontWeight: '900' }}>Your cart is empty</h1>
        <p style={{ opacity: 0.5, fontSize: '16px' }}>Add some products before checking out.</p>
        <Link href="/store">
          <button className="btn-primary" style={{ marginTop: '8px' }}>Browse Store</button>
        </Link>
      </div>
    )
  }

  // ─── Payment step (Stripe Elements rendered) ───────────────────────────────

  if (readyForPayment) {
    const stripeAppearance = {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#c4a484',
        colorBackground: '#0f0c09',
        colorText: '#f5f5f5',
        colorDanger: '#e74c3c',
        fontFamily: 'Outfit, sans-serif',
        borderRadius: '12px',
        spacingUnit: '5px',
      },
    }

    return (
      <div className="container animate-up" style={{ padding: '60px 0', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>Complete Payment</h1>
        <p style={{ opacity: 0.5, marginBottom: '40px', fontSize: '14px' }}>
          Order #{displayDbOrderId.slice(-8).toUpperCase()} · AED {finalTotal.toFixed(2)}
        </p>

        <div className="glass" style={{ padding: '32px' }}>
          <Elements stripe={stripePromise} options={{ clientSecret: clientSecret!, appearance: stripeAppearance }}>
            <PaymentForm
              dbOrderId={displayDbOrderId}
              clearCart={clearCart}
              billingDetails={{
                name: `${address.addressFirstName} ${address.addressLastName}`.trim() || undefined,
                email: email || undefined,
                phone: address.phoneNumber || undefined,
                address: {
                  line1: address.street || undefined,
                  city: address.city || undefined,
                  country: 'AE',
                },
              }}
              onSuccess={(id) => {
                setSuccessOrderId(id)
                refreshCart()
              }}
              onError={(msg) => {
                setCheckoutError(msg)
                setClientSecret(null)
              }}
            />
          </Elements>
        </div>

        {checkoutError && (
          <div style={styles.errorBox}>{checkoutError}</div>
        )}

        <button
          style={{ ...styles.backLink, marginTop: '20px' }}
          onClick={() => { setClientSecret(null); setDbOrderId(null); setCheckoutError('') }}
        >
          ← Back to order details
        </button>
      </div>
    )
  }

  // ─── Main checkout form ────────────────────────────────────────────────────

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <h1 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '48px' }}>Checkout</h1>

      <div style={styles.grid}>
        {/* ── Left: Forms ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Contact */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Contact Information</h3>
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
              required
              id="checkout-email"
            />
          </div>

          {/* Delivery Option */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Delivery Method</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              {(['delivery', 'pickup'] as DeliveryOption[]).map((opt) => (
                <button
                  key={opt}
                  className={`selection-option${deliveryOption === opt ? ' selected' : ''}`}
                  onClick={() => setDeliveryOption(opt)}
                  id={`delivery-option-${opt}`}
                >
                  <span>{opt === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Address (delivery mode) */}
          {deliveryOption === 'delivery' && (
            <div className="glass" style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={styles.cardTitle}>Shipping Address</h3>
                {savedAddresses.length > 0 && (
                  <select
                    style={styles.select}
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Use saved address…</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label ? `${a.label} — ` : ''}{a.street}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input className="input-field" placeholder="First Name" value={address.addressFirstName}
                  onChange={(e) => setAddress({ ...address, addressFirstName: e.target.value })} required />
                <input className="input-field" placeholder="Last Name" value={address.addressLastName}
                  onChange={(e) => setAddress({ ...address, addressLastName: e.target.value })} required />
                <input className="input-field" placeholder="Street Address" value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  style={{ gridColumn: 'span 2' }} required />
                <input className="input-field" placeholder="City" value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                <select className="input-field" value={address.emirates}
                  onChange={(e) => setAddress({ ...address, emirates: e.target.value })}>
                  <option value="dubai">Dubai</option>
                  <option value="abu_dhabi">Abu Dhabi</option>
                  <option value="sharjah">Sharjah</option>
                  <option value="ajman">Ajman</option>
                  <option value="ras_al_khaimah">Ras Al Khaimah</option>
                  <option value="fujairah">Fujairah</option>
                  <option value="umm_al_quwain">Umm Al Quwain</option>
                </select>
                <input className="input-field" placeholder="Phone Number (+971…)" value={address.phoneNumber}
                  onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                  style={{ gridColumn: 'span 2' }} required />
              </div>
            </div>
          )}

          {/* Pickup notice */}
          {deliveryOption === 'pickup' && (
            <div className="glass" style={{ ...styles.card, background: 'rgba(196,164,132,0.05)', borderColor: 'rgba(196,164,132,0.2)' }}>
              <h3 style={{ ...styles.cardTitle, color: 'var(--primary)' }}>Store Pickup</h3>
              <p style={{ opacity: 0.65, fontSize: '14px', lineHeight: '1.7' }}>
                Your order will be prepared and ready for pickup at your selected Surge boutique. You&apos;ll receive a notification when your order is ready.
              </p>
              {/* Billing address for pickup */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input className="input-field" placeholder="First Name" value={address.addressFirstName}
                  onChange={(e) => setAddress({ ...address, addressFirstName: e.target.value })} />
                <input className="input-field" placeholder="Last Name" value={address.addressLastName}
                  onChange={(e) => setAddress({ ...address, addressLastName: e.target.value })} />
                <input className="input-field" placeholder="Phone Number" value={address.phoneNumber}
                  onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                  style={{ gridColumn: 'span 2' }} />
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Order Notes <span style={{ opacity: 0.4, fontWeight: '400' }}>(optional)</span></h3>
            <textarea
              className="input-field"
              placeholder="Special instructions, gift messages, etc."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Coupon */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Coupon Code</h3>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>✓ {appliedCoupon.code}</p>
                  {appliedCoupon.couponTagline && (
                    <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>{appliedCoupon.couponTagline}</p>
                  )}
                  <p style={{ fontSize: '12px', color: '#2ecc71', marginTop: '4px', fontWeight: '600' }}>
                    −AED {couponDiscount.toFixed(2)} off
                  </p>
                </div>
                <button
                  onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(231,76,60,0.8)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="input-field"
                    style={{ flex: 1 }}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    className="btn-outline"
                    onClick={handleApplyCoupon}
                    disabled={couponValidating || !couponCode.trim()}
                    style={{ padding: '12px 18px', fontSize: '13px', flexShrink: 0 }}
                  >
                    {couponValidating ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p style={{ fontSize: '12px', color: '#e74c3c', marginTop: '8px' }}>{couponError}</p>}
              </>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="glass" style={styles.summaryCard}>
          <h3 style={styles.cardTitle}>Order Summary</h3>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
            {cart.map((item) => (
              <div key={`${item.product}-${item.vId}`} style={styles.summaryItem}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  {item.image && (
                    <img src={item.image} alt={item.name}
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </p>
                    {item.variantName && (
                      <p style={{ fontSize: '12px', opacity: 0.45 }}>{item.variantName}</p>
                    )}
                    <p style={{ fontSize: '12px', opacity: 0.45 }}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--primary)', flexShrink: 0, marginLeft: '8px' }}>
                  AED {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          {/* Pricing breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={styles.priceRow}>
              <span style={{ opacity: 0.6 }}>Subtotal</span>
              <span>AED {subtotal.toFixed(2)}</span>
            </div>
            {deliveryOption === 'delivery' && (
              <div style={styles.priceRow}>
                <span style={{ opacity: 0.6 }}>Shipping</span>
                <span>{taxShippingLoading ? '…' : taxShipping.shippingCharge === 0 ? 'Free' : `AED ${taxShipping.shippingCharge.toFixed(2)}`}</span>
              </div>
            )}
            {appliedCoupon && couponDiscount > 0 && (
              <div style={{ ...styles.priceRow, color: '#2ecc71' }}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span>−AED {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {taxShipping.taxRate > 0 && (
              <div style={styles.priceRow}>
                <span style={{ opacity: 0.6 }}>Tax ({taxShipping.taxRate}%)</span>
                <span>{taxShippingLoading ? '…' : `AED ${taxAmount.toFixed(2)}`}</span>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          <div style={{ ...styles.priceRow, fontSize: '20px', fontWeight: '900' }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>AED {finalTotal.toFixed(2)}</span>
          </div>

          {checkoutError && (
            <div style={styles.errorBox}>{checkoutError}</div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '18px', marginTop: '24px', fontSize: '15px' }}
            onClick={handlePlaceOrder}
            disabled={checkoutLoading || totalItems === 0}
            id="place-order-btn"
          >
            {checkoutLoading ? 'Preparing Order…' : 'Place Order & Pay'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', opacity: 0.35, marginTop: '12px' }}>
            Secured by Stripe · AED · End-to-end encrypted
          </p>

          {!user && (
            <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.5, marginTop: '12px' }}>
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</Link> to track your order history
            </p>
          )}
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
  card: {
    padding: '28px 32px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    marginBottom: '20px',
    letterSpacing: '-0.2px',
  },
  summaryCard: {
    padding: '28px 32px',
    position: 'sticky',
    top: '110px',
  },
  select: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '16px 0',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBox: {
    background: 'rgba(231,76,60,0.1)',
    border: '1px solid rgba(231,76,60,0.3)',
    color: '#e74c3c',
    padding: '14px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    marginTop: '16px',
    lineHeight: '1.5',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
    display: 'block',
  },
}
