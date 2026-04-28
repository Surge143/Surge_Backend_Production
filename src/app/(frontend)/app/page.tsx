'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '../context/UserContext'

interface Shop {
  id: string
  isShopOpen?: boolean
  address?: { city?: string; street?: string }
  shopImages?: Array<{ image?: { url?: string } }>
}

interface StampData {
  stampCount?: number
}

interface CoinData {
  totalBalance?: number
}

export default function CafeApp() {
  const { user } = useUser()
  const [shops, setShops] = useState<Shop[]>([])
  const [stamps, setStamps] = useState<StampData | null>(null)
  const [coins, setCoins] = useState<CoinData | null>(null)
  const [shopsLoading, setShopsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shop?limit=20')
      .then((res) => res.json())
      .then((data) => setShops(data.docs || []))
      .catch(() => {})
      .finally(() => setShopsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setStamps(null)
      setCoins(null)
      return
    }
    fetch(`/api/surge-stamps?where[user][equals]=${user.id}`)
      .then((res) => res.json())
      .then((data) => setStamps(data.docs?.[0] || { stampCount: 0 }))
      .catch(() => setStamps({ stampCount: 0 }))

    fetch(`/api/user-surge-coins?where[user][equals]=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCoins(data.docs?.[0] || { totalBalance: 0 }))
      .catch(() => setCoins({ totalBalance: 0 }))
  }, [user])

  const stampCount = stamps?.stampCount ?? 0
  const coinBalance = coins?.totalBalance ?? 0

  return (
    <div className="animate-up" style={{ paddingBottom: '100px' }}>
      {/* ── Loyalty Banner ── */}
      <section className="container" style={{ paddingTop: '40px' }}>
        {user ? (
          <div className="glass" style={styles.loyaltyBanner}>
            <div style={styles.loyaltyLeft}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>
                Welcome back, {user.firstName || user.email.split('@')[0]}!
              </h2>
              <p style={{ opacity: 0.6, fontSize: '14px' }}>
                Collect stamps with every cafe purchase and earn WTCoins for exclusive rewards.
              </p>
            </div>
            <div style={styles.loyaltyRight}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{stampCount}/10</span>
                <span style={styles.statLabel}>Stamps</span>
              </div>
              <div style={styles.stat}>
                <span style={{ ...styles.statValue, color: 'var(--accent)' }}>{coinBalance}</span>
                <span style={styles.statLabel}>WTCoins</span>
              </div>
            </div>
            <div className="progress-track" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <div
                className="progress-fill"
                style={{ width: `${Math.min(stampCount * 10, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          /* Not logged in: show sign-in CTA */
          <div className="glass" style={{ ...styles.loyaltyBanner, gridTemplateColumns: '1fr auto' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
                Earn Rewards with Every Cup ☕
              </h2>
              <p style={{ opacity: 0.6, fontSize: '14px' }}>
                Sign in or create an account to collect stamps and unlock WTCoin rewards.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login">
                <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '13px' }}>
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="btn-outline" style={{ padding: '12px 24px', fontSize: '13px' }}>
                  Join Surge
                </button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── Shop Selection ── */}
      <section className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          Choose a Boutique
        </h2>
        <p style={{ opacity: 0.5, fontSize: '14px', marginBottom: '32px' }}>
          Order ahead for pickup at any of our locations.
        </p>

        {shopsLoading ? (
          <div className="grid-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass" style={{ overflow: 'hidden' }}>
                <div className="skeleton" style={{ aspectRatio: '16/9' }} />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '20px', borderRadius: '8px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="flex-center" style={{ height: '30vh', flexDirection: 'column', gap: '16px', opacity: 0.4 }}>
            <span style={{ fontSize: '48px' }}>🏢</span>
            <p style={{ fontSize: '18px' }}>No boutiques available right now</p>
          </div>
        ) : (
          <div className="grid-auto">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/app/menu/${shop.id}`}
                className="glass glass-hover"
                style={styles.shopCard}
              >
                {/* Shop Image */}
                <div style={styles.shopImg}>
                  {shop.shopImages?.[0]?.image?.url ? (
                    <img
                      src={shop.shopImages[0].image.url}
                      alt={shop.address?.city}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>🏢</span>
                  )}
                </div>

                {/* Shop Info */}
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>
                    {shop.address?.city || 'Surge Boutique'}
                  </h3>
                  <p style={{ fontSize: '13px', opacity: 0.55, marginBottom: '20px', lineHeight: '1.5' }}>
                    {shop.address?.street}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: shop.isShopOpen ? 'var(--success)' : 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span style={{
                        display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                        background: shop.isShopOpen ? 'var(--success)' : 'var(--error)',
                      }} />
                      {shop.isShopOpen ? 'Open Now' : 'Currently Closed'}
                    </span>
                    <span className="btn-outline" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}>
                      View Menu →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '900',
    color: 'var(--primary)',
    lineHeight: 1,
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
    textDecoration: 'none',
    color: 'inherit',
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
