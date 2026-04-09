import React from 'react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '60px 20px' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <header className="animate-up" style={{ marginBottom: '80px' }}>
          <h1 className="text-gradient" style={{ fontSize: '72px', marginBottom: '20px' }}>
            Elevate Your Brew
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.6, maxWidth: '600px', margin: '0 auto' }}>
            Dubai&apos;s premier specialty coffee destination. Experience craftsmanship in every bean and
            every cup.
          </p>
        </header>

        <div className="grid-auto animate-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/app" className="glass glass-hover" style={styles.card}>
            <div style={styles.cardIcon}>☕</div>
            <h2 style={styles.cardTitle}>Cafe Selection</h2>
            <p style={styles.cardText}>
              Order for pickup at our boutique locations and earn loyalty rewards.
            </p>
            <span className="btn-primary" style={{ marginTop: 'auto', fontSize: '14px' }}>
              Start Order
            </span>
          </Link>

          <Link href="/store" className="glass glass-hover" style={styles.card}>
            <div style={styles.cardIcon}>📦</div>
            <h2 style={styles.cardTitle}>Product Store</h2>
            <p style={styles.cardText}>
              Browse our artisan roasts, brewing equipment, and lifestyle goods.
            </p>
            <span className="btn-outline" style={{ marginTop: 'auto', fontSize: '14px' }}>
              Explore Shop
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    height: '100%',
  },
  cardIcon: {
    fontSize: '64px',
    marginBottom: '32px',
  },
  cardTitle: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '16px',
    color: 'var(--primary)',
  },
  cardText: {
    fontSize: '16px',
    opacity: 0.7,
    lineHeight: '1.8',
    marginBottom: '40px',
  },
}
