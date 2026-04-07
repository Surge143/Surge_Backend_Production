'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart()
  const { user } = useUser()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])

  const [address, setAddress] = useState({
    street: '',
    city: '',
    emirates: 'dubai',
    country: 'United Arab Emirates',
    addressFirstName: '',
    addressLastName: '',
    phoneNumber: '',
  })

  useEffect(() => {
    const u = user
    if (u) {
      setEmail(u.email)
      fetch(`/api/users/${u.id}/addresses`)
        .then((res) => res.json())
        .then((data) => setSavedAddresses(data.addresses || []))
    }
  }, [user])

  const handleSelectSavedAddress = (id: string) => {
    const selected = savedAddresses.find((a) => String(a.id) === String(id))
    if (selected) {
      setAddress({
        street: selected.street,
        city: selected.city,
        emirates: selected.emirates,
        country: 'United Arab Emirates',
        addressFirstName: selected.addressFirstName,
        addressLastName: selected.addressLastName,
        phoneNumber: selected.phoneNumber,
      })
    }
  }

  const hasAppItems = cart.some((i) => i.type === 'app')
  const hasStoreItems = cart.some((i) => i.type === 'store')

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      if (hasAppItems) {
        const appItems = cart.filter((i) => i.type === 'app')
        const shopId = appItems[0].variant

        await fetch('/api/app-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderType: 'take-away',
            shop: shopId,
            items: appItems.map((item) => ({
              product: item.id,
              quantity: item.quantity,
              customizations: item.customizations,
            })),
            financials: { total: subtotal, subtotal },
            status: 'pending',
            user: user?.id,
            email: email,
          }),
        })
      }

      if (hasStoreItems) {
        const storeItems = cart.filter((i) => i.type === 'store')
        const res = await fetch('/api/web-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            items: storeItems.map((item) => ({
              product: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
            total: subtotal,
            status: 'pending',
            shippingAddress: address,
            user: user?.id,
          }),
        })
        const data = await res.json()
        if (data.doc) setOrderId(data.doc.id)
      }

      clearCart()
    } catch (e) {
      console.error('Order failed', e)
    } finally {
      setLoading(false)
    }
  }

  if (orderId) {
    return (
      <div className="container flex-center" style={{ height: '70vh', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Thank You!</h1>
        <p style={{ fontSize: '20px', opacity: 0.6, marginTop: '16px' }}>
          Your order #{orderId} has been placed.
        </p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary"
          style={{ marginTop: '40px' }}
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <h1 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '48px' }}>Checkout</h1>

      <div style={styles.grid}>
        {/* Form Section */}
        <div style={styles.formSection}>
          <div className="glass" style={{ padding: '32px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Contact Information</h3>
            <input
              type="email"
              placeholder="Email Address"
              className="glass"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
            />
          </div>

          {hasStoreItems && (
            <div className="glass" style={{ padding: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3>Shipping Address</h3>
                {savedAddresses.length > 0 && (
                  <select
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                    }}
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                  >
                    <option value="">Select Saved Address</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} - {a.street}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  placeholder="First Name"
                  className="glass"
                  style={styles.input}
                  value={address.addressFirstName}
                  onChange={(e) => setAddress({ ...address, addressFirstName: e.target.value })}
                />
                <input
                  placeholder="Last Name"
                  className="glass"
                  style={styles.input}
                  value={address.addressLastName}
                  onChange={(e) => setAddress({ ...address, addressLastName: e.target.value })}
                />
                <input
                  placeholder="Street Address"
                  className="glass"
                  style={{ ...styles.input, gridColumn: 'span 2' }}
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                />
                <input
                  placeholder="City"
                  className="glass"
                  style={styles.input}
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                <select
                  className="glass"
                  style={styles.input}
                  value={address.emirates}
                  onChange={(e) => setAddress({ ...address, emirates: e.target.value })}
                >
                  <option value="dubai">Dubai</option>
                  <option value="abu_dhabi">Abu Dhabi</option>
                  <option value="sharjah">Sharjah</option>
                </select>
                <input
                  placeholder="Phone Number"
                  className="glass"
                  style={{ ...styles.input, gridColumn: 'span 2' }}
                  value={address.phoneNumber}
                  onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {hasAppItems && !hasStoreItems && (
            <div
              className="glass"
              style={{ padding: '32px', background: 'rgba(var(--primary-rgb), 0.1)' }}
            >
              <h3 style={{ marginBottom: '8px' }}>Boutique Pickup</h3>
              <p style={{ opacity: 0.6, fontSize: '14px' }}>
                Your order will be prepared for pickup at the selected boutique.
              </p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="glass" style={styles.summarySection}>
          <h3 style={{ marginBottom: '24px' }}>Order Summary</h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}
          >
            {cart.map((item, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}
              >
                <span>
                  {item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}
                </span>
                <span>AED {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: '800',
              }}
            >
              <span>Total</span>
              <span>AED {subtotal}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '40px', padding: '18px' }}
            onClick={handlePlaceOrder}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '40px',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  summarySection: {
    padding: '32px',
    height: 'fit-content',
    position: 'sticky',
    top: '110px',
  },
  input: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
  },
}
