'use client'

import React from 'react'
import Link from 'next/link'
import { Logo, CartIcon, UserIcon, MenuIcon } from './Icons'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'

export const Header = () => {
  const { cart } = useCart()
  const { user } = useUser()

  return (
    <header className="glass" style={styles.header}>
      <div className="container" style={styles.container}>
        <div style={styles.left}>
          <Link href="/" style={styles.logoContainer}>
            <Logo size={32} className="text-gradient" />
            <span style={styles.logoText}>WHITE MANTIS</span>
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
          </Link>
          <Link href="/checkout" style={styles.iconBtn} aria-label="Cart">
            <CartIcon size={20} />
            {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
          </Link>
          <button className="mobile-only" style={styles.iconBtn} aria-label="Menu">
            <MenuIcon size={24} />
          </button>
        </div>
      </div>
    </header>
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
    gap: '12px',
  },
  iconBtn: {
    padding: '10px',
    borderRadius: '12px',
    color: 'white',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '10px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
}
