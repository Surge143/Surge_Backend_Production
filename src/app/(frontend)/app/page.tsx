'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CafeApp() {
  const [shops, setShops] = useState<any[]>([])
  const [stamps, setStamps] = useState<any>(null)
  const [coins, setCoins] = useState<any>(null)

  // Mock User ID - will be replaced by Auth later
  const MOCK_USER_ID = '67f259029789315dcc447a11'

  useEffect(() => {
    fetch('/api/shop')
      .then((res) => res.json())
      .then((data) => setShops(data.docs || []))

    fetch(`/api/surge-stamps?where[user][equals]=${MOCK_USER_ID}`)
      .then((res) => res.json())
      .then((data) => setStamps(data.docs?.[0] || { stampCount: 0 }))

    fetch(`/api/user-wt-coins?where[user][equals]=${MOCK_USER_ID}`)
      .then((res) => res.json())
      .then((data) => setCoins(data.docs?.[0] || { totalBalance: 0 }))
  }, [])

  return (
    <div className="animate-up" style={{ paddingBottom: '100px' }}>
      {/* Loyalty Banner */}
      <section className="container" style={{ paddingTop: '40px' }}>
        <div className="glass" style={styles.loyaltyBanner}>
          <div style={styles.loyaltyLeft}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
              Your Rewards
            </h2>
            <p style={{ opacity: 0.6, fontSize: '14px' }}>
              Collect stamps and earn coins for exclusive treats.
            </p>
          </div>
          <div style={styles.loyaltyRight}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{stamps?.stampCount || 0}/10</span>
              <span style={styles.statLabel}>Stamps</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{coins?.totalBalance || 0}</span>
              <span style={styles.statLabel}>WTCoins</span>
            </div>
          </div>
          <div className="progress-track" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
            <div
              className="progress-fill"
              style={{ width: `${(stamps?.stampCount || 0) * 10}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Shop Selection */}
      <section className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '32px' }}>
          Choose a Boutique
        </h2>
        <div className="grid-auto">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/app/menu/${shop.id}`}
              className="glass glass-hover"
              style={styles.shopCard}
            >
              <div style={styles.shopImg}>
                {shop.shopImages?.[0]?.image?.url ? (
                  <img
                    src={shop.shopImages[0].image.url}
                    alt={shop.address?.city}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '48px' }}>🏢</span>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                  {shop.address?.city || 'White Mantis Boutique'}
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '20px' }}>
                  {shop.address?.street}
                </p>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: shop.isShopOpen ? 'var(--success)' : 'var(--error)',
                    }}
                  >
                    {shop.isShopOpen ? '● Open Now' : '● Currently Closed'}
                  </span>
                  <span className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    View Menu
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loyaltyBanner: {
    padding: '32px',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: '24px',
  },
  loyaltyLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  loyaltyRight: {
    display: 'flex',
    gap: '32px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--primary)',
  },
  statLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.5,
  },
  shopCard: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  shopImg: {
    aspectRatio: '16/9',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
}
