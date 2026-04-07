import React from 'react'
import Link from 'next/link'
import { Logo } from './Icons'

export const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.grid}>
        <div style={styles.brandSide}>
          <div style={styles.logoLine}>
            <Logo size={40} className="text-gradient" />
            <h2 style={styles.footerTitle}>WHITE MANTIS</h2>
          </div>
          <p style={styles.description}>
            Elevating the coffee experience through craftsmanship and community. Dubai's premier
            specialty roastery and cafe.
          </p>
        </div>

        <div style={styles.linkGroup}>
          <h4 style={styles.linkTitle}>Store</h4>
          <Link href="/store" style={styles.link}>
            All Products
          </Link>
          <Link href="/store/coffee" style={styles.link}>
            Coffee Beans
          </Link>
          <Link href="/store/equipment" style={styles.link}>
            Brewing Gear
          </Link>
        </div>

        <div style={styles.linkGroup}>
          <h4 style={styles.linkTitle}>Experience</h4>
          <Link href="/app" style={styles.link}>
            Find a Cafe
          </Link>
          <Link href="/app/menu" style={styles.link}>
            Our Menu
          </Link>
          <Link href="/loyalty" style={styles.link}>
            Rewards Program
          </Link>
        </div>

        <div style={styles.linkGroup}>
          <h4 style={styles.linkTitle}>Legal</h4>
          <Link href="/privacy" style={styles.link}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={styles.link}>
            Terms of Service
          </Link>
        </div>
      </div>

      <div className="container" style={styles.bottom}>
        <p>© 2026 White Mantis Coffee Roasters. All rights reserved.</p>
        <div style={styles.socials}>{/* Social icons could go here */}</div>
      </div>
    </footer>
  )
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: '#050403',
    padding: '100px 0 40px',
    borderTop: '1px solid var(--glass-border)',
    marginTop: '100px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
    gap: '40px',
  },
  brandSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  logoLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerTitle: {
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '3px',
    color: 'var(--primary)',
  },
  description: {
    lineHeight: '1.8',
    opacity: 0.6,
    maxWidth: '300px',
  },
  linkGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  linkTitle: {
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'var(--primary)',
    marginBottom: '8px',
  },
  link: {
    opacity: 0.5,
    fontSize: '14px',
  },
  bottom: {
    marginTop: '80px',
    paddingTop: '40px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    opacity: 0.4,
  },
  socials: {
    display: 'flex',
    gap: '20px',
  },
}
