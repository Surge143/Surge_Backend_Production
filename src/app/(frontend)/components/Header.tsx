'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import { useState, useEffect } from 'react'
import styles from './Header.module.css'

export default function Header() {
    const { itemCount } = useCart()
    const [user, setUser] = useState<any>(null)
    const [showUserMenu, setShowUserMenu] = useState(false)

    useEffect(() => {
        // Check if user is logged in
        fetch('/api/users/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => setUser(data?.user || null))
            .catch(() => setUser(null))
    }, [])

    const handleLogout = async () => {
        await fetch('/api/users/logout', { method: 'POST' })
        setUser(null)
        window.location.href = '/'
    }

    return (
        <header className={styles.header}>
            <div className="container">
                <div className={styles.headerContent}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>☕</span>
                        <span className={styles.logoText}>WhiteMantis</span>
                    </Link>

                    {/* Navigation */}
                    <nav className={styles.nav}>
                        <Link href="/" className={styles.navLink}>Home</Link>
                        <Link href="/products" className={styles.navLink}>Products</Link>
                        <Link href="/about" className={styles.navLink}>About</Link>
                        <Link href="/contact" className={styles.navLink}>Contact</Link>
                    </nav>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {/* Wishlist */}
                        <Link href="/wishlist" className={styles.iconButton} title="Wishlist">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className={styles.iconButton} title="Cart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <div className={styles.userMenu}>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    title="Account"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </button>
                                {showUserMenu && (
                                    <div className={styles.dropdown}>
                                        <Link href="/profile" className={styles.dropdownItem}>Profile</Link>
                                        <Link href="/orders" className={styles.dropdownItem}>Orders</Link>
                                        <button onClick={handleLogout} className={styles.dropdownItem}>Logout</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="btn btn-primary btn-sm">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
