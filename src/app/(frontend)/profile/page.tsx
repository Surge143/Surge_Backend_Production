'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'

export default function ProfilePage() {
  const { user, loading, logout, login } = useUser()
  const router = useRouter()

  const [stamps, setStamps] = useState<any>(null)
  const [coins, setCoins] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [appOrders, setAppOrders] = useState<any[]>([])
  const [activeOrderTab, setActiveOrderTab] = useState<'web' | 'cafe'>('cafe')

  // Profile Edit State
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
  })

  // Address State
  const [addresses, setAddresses] = useState<any[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    addressFirstName: '',
    addressLastName: '',
    street: '',
    city: '',
    emirates: 'dubai',
    phoneNumber: '',
    label: 'Home',
  })

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }

    const u = user
    if (!u) return

    setProfileForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || '',
      gender: u.gender || '',
    })

    // Fetch Loyalty & Data
    fetch(`/api/surge-stamps?where[user][equals]=${u.id}`)
      .then((res) => res.json())
      .then((data) => setStamps(data.docs?.[0]))

    fetch(`/api/user-surge-coins?where[user][equals]=${u.id}`)
      .then((res) => res.json())
      .then((data) => setCoins(data.docs?.[0]))

    fetch(`/api/web-orders?where[email][equals]=${u.email}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.docs || []))

    fetch(`/api/app-orders?where[user][equals]=${u.id}&sort=-createdAt&limit=20`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setAppOrders(data.docs || []))

    fetch(`/api/users/${u.id}/addresses`)
      .then((res) => res.json())
      .then((data) => setAddresses(data.addresses || []))
  }, [user, loading])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        const updated = await res.json()
        login(updated.doc)
        setEditMode(false)
      }
    } catch (err) {
      console.error('Update failed', err)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.doc.addresses)
        setShowAddressForm(false)
        setAddressForm({
          addressFirstName: '',
          addressLastName: '',
          street: '',
          city: '',
          emirates: 'dubai',
          phoneNumber: '',
          label: 'Home',
        })
      }
    } catch (err) {
      console.error('Add address failed', err)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}/addresses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      })
      if (res.ok) {
        setAddresses(addresses.filter((a) => String(a.id) !== String(addressId)))
      }
    } catch (err) {
      console.error('Delete address failed', err)
    }
  }

  if (loading || !user)
    return (
      <div className="flex-center" style={{ height: '70vh' }}>
        Loading Profile...
      </div>
    )

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '60px',
        }}
      >
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={styles.avatar}>
            {user.profileImage?.url ? (
              <img src={user.profileImage.url} alt="Profile" style={styles.avatarImg} />
            ) : (
              <span style={{ fontSize: '32px' }}>
                {(user.firstName?.[0] || user.email[0]).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: '900' }}>
              {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Surge Member'}
            </h1>
            <p style={{ opacity: 0.6 }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
          <button
            className="btn-primary"
            onClick={async () => {
              await logout()
              router.push('/')
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {editMode && (
        <section className="glass animate-up" style={{ padding: '40px', marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '800' }}>
            Personal Information
          </h2>
          <form onSubmit={handleUpdateProfile} style={styles.formGrid}>
            <input
              className="input-field"
              placeholder="First Name"
              value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Last Name"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
            <select
              className="input-field"
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <button className="btn-primary" type="submit" style={{ gridColumn: 'span 2' }}>
              Save Changes
            </button>
          </form>
        </section>
      )}

      <div style={styles.mainGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Loyalty Info */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Loyalty Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>
                  {stamps?.stampCount || 0}/10
                </span>
                <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>Stamps</p>
              </div>
              <div>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#2ecc71' }}>
                  {stamps?.stampReward || 0}
                </span>
                <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>Free Rewards</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)' }}>
                  {coins?.totalBalance || 0}
                </span>
                <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>WTCoins</p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="glass" style={styles.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={styles.cardTitle}>My Addresses</h3>
              <button onClick={() => setShowAddressForm(true)} style={styles.textBtn}>
                + Add New
              </button>
            </div>

            {showAddressForm && (
              <form
                onSubmit={handleAddAddress}
                style={{
                  ...styles.formGrid,
                  marginBottom: '24px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                }}
              >
                <input
                  className="input-field"
                  placeholder="First Name"
                  required
                  value={addressForm.addressFirstName}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, addressFirstName: e.target.value })
                  }
                />
                <input
                  className="input-field"
                  placeholder="Last Name"
                  required
                  value={addressForm.addressLastName}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, addressLastName: e.target.value })
                  }
                />
                <input
                  className="input-field"
                  placeholder="Street"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="City"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
                <select
                  className="input-field"
                  value={addressForm.emirates}
                  onChange={(e) => setAddressForm({ ...addressForm, emirates: e.target.value })}
                >
                  <option value="dubai">Dubai</option>
                  <option value="abu_dhabi">Abu Dhabi</option>
                  <option value="sharjah">Sharjah</option>
                </select>
                <input
                  className="input-field"
                  placeholder="Phone"
                  required
                  value={addressForm.phoneNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                />
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>
                  Save Address
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {addresses.map((addr) => (
                <div key={addr.id} style={styles.addressRow}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700' }}>
                      {addr.addressFirstName} {addr.addressLastName}{' '}
                      <span style={styles.tag}>{addr.label}</span>
                    </p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
                      {addr.street}, {addr.city}, {addr.emirates}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} style={{ color: '#ff3b30' }}>
                    Delete
                  </button>
                </div>
              ))}
              {addresses.length === 0 && (
                <p style={{ opacity: 0.4, fontSize: '13px' }}>No addresses saved yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass" style={{ ...styles.card, padding: 0 }}>
          <div style={{ padding: '32px 32px 0' }}>
            <h3 style={styles.cardTitle}>Order History</h3>
            <div style={{ display: 'flex', gap: '0', marginTop: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {(['cafe', 'web'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveOrderTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '10px 20px', fontSize: '13px', fontWeight: '700',
                    color: activeOrderTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                    borderBottom: activeOrderTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    marginBottom: '-1px', transition: 'all 0.2s',
                  }}
                >
                  {tab === 'cafe' ? '☕ Cafe Orders' : '🛍 Web Orders'}
                </button>
              ))}
            </div>
          </div>
          <div>
            {activeOrderTab === 'cafe' ? (
              appOrders.length > 0 ? appOrders.map((order, i) => (
                <div key={i} style={styles.orderRow}>
                  <div>
                    <p style={{ fontWeight: '800' }}>Cafe #{String(order.id).slice(-6)}</p>
                    <p style={{ fontSize: '12px', opacity: 0.5 }}>
                      {new Date(order.createdAt).toLocaleDateString()} · {order.orderType || ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '800', color: 'var(--primary)' }}>
                      AED {order.financials?.total?.toFixed(2) ?? '—'}
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.5 }}>{order.paymentStatus || order.appOrderStatus}</p>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No cafe orders yet.</div>
              )
            ) : (
              orders.length > 0 ? orders.map((order, i) => (
                <div key={i} style={styles.orderRow}>
                  <div>
                    <p style={{ fontWeight: '800' }}>Order #{String(order.id).slice(-6)}</p>
                    <p style={{ fontSize: '12px', opacity: 0.5 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '800', color: 'var(--primary)' }}>AED {order.total}</p>
                    <p style={{ fontSize: '12px', opacity: 0.5 }}>{order.status}</p>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No web orders yet.</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'var(--primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '900',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  card: { padding: '32px' },
  cardTitle: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  addressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  tag: {
    fontSize: '10px',
    background: 'var(--primary)',
    color: 'black',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '700',
    cursor: 'pointer',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
}
