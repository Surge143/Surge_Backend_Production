'use client'

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../app.module.css'

// ── Cart Context ──────────────────────────────────────────────────────────────
interface CartContextValue {
    cartCount: number
    refreshCart: () => void
}

const CartCtx = createContext<CartContextValue>({ cartCount: 0, refreshCart: () => { } })
export const useAppCart = () => useContext(CartCtx)

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
    const [cartCount, setCartCount] = useState(0)
    const pathname = usePathname()

    const refreshCart = useCallback(async () => {
        try {
            const res = await fetch('/api/app/cart')
            if (!res.ok) return
            const data = await res.json()
            setCartCount(Array.isArray(data.items) ? data.items.length : 0)
        } catch {
            // silently fail
        }
    }, [])

    useEffect(() => {
        refreshCart()
    }, [refreshCart, pathname])

    const navItems = [
        {
            href: '/app',
            label: 'Home',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
            exact: true,
        },
        {
            href: '/app/cart',
            label: 'Cart',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
            ),
            badge: cartCount,
        },
    ]

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href
        return pathname.startsWith(href)
    }

    return (
        <CartCtx.Provider value={{ cartCount, refreshCart }}>
            <div className={styles.appRoot}>
                <div className={styles.pageContent}>
                    {children}
                </div>

                <nav className={styles.bottomNav}>
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href, item.exact) ? styles.active : ''}`}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge != null && item.badge > 0 && (
                                <span className={styles.navCartBadge}>{item.badge > 9 ? '9+' : item.badge}</span>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </CartCtx.Provider>
    )
}
