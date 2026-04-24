'use client'

import React from 'react'
import Link from 'next/link'
import { Logo, UserIcon } from './Icons'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { CartDrawer } from './CartDrawer'

// Cart icon with animated badge
const CartButton = () => {
  const { totalItems, cartOpen, setCartOpen } = useCart()

  return (
    <button
      onClick={() => setCartOpen(!cartOpen)}
      style={styles.iconBtn}
      aria-label={`Cart${totalItems > 0 ? ` — ${totalItems} items` : ''}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {totalItems > 0 && (
        <span style={styles.badge}>{totalItems > 99 ? '99+' : totalItems}</span>
      )}
    </button>
  )
}

export const Header = () => {
  const { user } = useUser()

  return (
    <>
      <header className="glass" style={styles.header}>
        <div className="container" style={styles.container}>
          <div style={styles.left}>
            <Link href="/" style={styles.logoContainer}>
              <Logo size={32} className="text-gradient" />
              <span style={styles.logoText}>SURGE</span>
            </Link>

            <nav className="desktop-only" style={styles.nav}>
              <Link href="/store" style={styles.navLink}>
                Store
              </Link>
              <Link href="/app" style={styles.navLink}>
                Cafe
              </Link>
              <Link href="/blog" style={styles.navLink}>
                Blog
              </Link>
            </nav>
          </div>

          <div style={styles.right}>
            <Link href={user ? '/profile' : '/login'} style={styles.iconBtn} aria-label="Profile">
              <UserIcon size={20} />
              {user && <span style={styles.userDot} aria-hidden />}
            </Link>

            <CartButton />
          </div>
        </div>
      </header>

      {/* Cart drawer — rendered at the root level */}
      <CartDrawer />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: '20px',
    left: '20px',
    right: '20px',
    margin: '0 20px',
    zIndex: 1000,
    borderRadius: '16px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '900',
    letterSpacing: '2px',
    color: 'var(--primary)',
  },
  nav: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.7,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    padding: '10px',
    borderRadius: '12px',
    color: 'white',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '9px',
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    padding: '0 3px',
  },
  userDot: {
    position: 'absolute',
    bottom: '6px',
    right: '6px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--success)',
    border: '1.5px solid #0a0806',
  },
}
