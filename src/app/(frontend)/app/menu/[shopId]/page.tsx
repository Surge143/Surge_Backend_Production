'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ShopDoc {
  id: string | number
  address?: { city?: string; street?: string }
  isShopOpen?: boolean
}

interface Category {
  id: string | number
  name: string
}

interface MenuItem {
  id: string | number
  name: string
  tagline?: string
  regularPrice?: number
  salePrice?: number
  image?: { url: string }
  isStampFreeProduct?: boolean
}

interface CartSummary {
  items: any[]
  totalCount: number
  subtotal: number
}

export default function ShopMenuPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const router = useRouter()

  const [shop, setShop] = useState<ShopDoc | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | number | null>(null)
  const [menuLoading, setMenuLoading] = useState(true)
  const [cartSummary, setCartSummary] = useState<CartSummary>({ items: [], totalCount: 0, subtotal: 0 })

  // Fetch shop details
  useEffect(() => {
    if (!shopId) return
    fetch(`/api/shop/${shopId}`)
      .then((r) => r.json())
      .then((d) => setShop(d))
      .catch(() => {})
  }, [shopId])

  // Fetch categories
  useEffect(() => {
    fetch('/api/app-categories?limit=20')
      .then((r) => r.json())
      .then((d) => setCategories(d.docs || []))
      .catch(() => {})
  }, [])

  // Fetch menu items
  const fetchMenu = useCallback(
    (categoryId: string | number | null) => {
      setMenuLoading(true)
      let url = `/api/shop-menu?where[shop][equals]=${shopId}&depth=1&limit=40`
      if (categoryId) url += `&where[categories][equals]=${categoryId}`
      fetch(url)
        .then((r) => r.json())
        .then((d) => setMenu(d.docs || []))
        .catch(() => setMenu([]))
        .finally(() => setMenuLoading(false))
    },
    [shopId],
  )

  useEffect(() => {
    if (shopId) fetchMenu(null)
  }, [shopId, fetchMenu])

  // Fetch & refresh cart — runs on mount and whenever user returns to this tab/page
  const refreshCart = useCallback(() => {
    fetch('/api/app/cart', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items = d.items || []
        setCartSummary({
          items,
          totalCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
          subtotal: items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshCart()
    // Re-fetch whenever the user switches back to this tab (e.g. returning from customize page)
    const handleFocus = () => refreshCart()
    const handleVisibility = () => { if (document.visibilityState === 'visible') refreshCart() }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshCart])

  const handleCategoryFilter = (catId: string | number | null) => {
    setActiveCategory(catId)
    fetchMenu(catId)
  }

  return (
    <div style={{ paddingBottom: '140px' }}>
      {/* ── Header ── */}
      <div className="container" style={{ paddingTop: '40px', marginBottom: '40px' }}>
        <Link href="/app" style={{ opacity: 0.5, fontSize: '14px', display: 'inline-block', marginBottom: '20px' }}>
          ← Back to Cafes
        </Link>
        {shop && (
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '6px' }}>
              {shop.address?.city || 'Our Menu'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ opacity: 0.55, fontSize: '14px' }}>{shop.address?.street}</p>
              <span style={{
                fontSize: '12px', fontWeight: '700',
                color: shop.isShopOpen ? 'var(--success)' : 'var(--error)',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: shop.isShopOpen ? 'var(--success)' : 'var(--error)' }} />
                {shop.isShopOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Category filter tabs ── */}
      <div className="no-scrollbar" style={{ overflowX: 'auto', paddingBottom: '8px', marginBottom: '32px' }}>
        <div className="container" style={{ display: 'flex', gap: '10px', minWidth: 'max-content' }}>
          <button
            className={`category-pill${activeCategory === null ? ' active' : ''}`}
            onClick={() => handleCategoryFilter(null)}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => handleCategoryFilter(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Grid ── */}
      <div className="container">
        {menuLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass skeleton" style={{ height: '88px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : menu.length === 0 ? (
          <div className="flex-center" style={{ height: '30vh', flexDirection: 'column', gap: '16px', opacity: 0.4 }}>
            <span style={{ fontSize: '48px' }}>🍵</span>
            <p style={{ fontSize: '18px' }}>No items available</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {menu.map((item) => {
              const price = item.salePrice || item.regularPrice || 0
              return (
                <Link
                  key={item.id}
                  href={`/app/customize/${item.id}?shopId=${shopId}`}
                  className="glass glass-hover"
                  style={styles.menuCard}
                >
                  <div style={styles.itemLeft}>
                    {item.image?.url && (
                      <div style={styles.itemImg}>
                        <img src={item.image.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800' }}>{item.name}</h4>
                        {item.isStampFreeProduct && (
                          <span className="variant-badge" style={{ background: 'rgba(39,174,96,0.15)', color: 'var(--success)', borderColor: 'rgba(39,174,96,0.3)' }}>
                            FREE with stamp
                          </span>
                        )}
                      </div>
                      {item.tagline && <p style={{ fontSize: '13px', opacity: 0.5 }}>{item.tagline}</p>}
                    </div>
                  </div>
                  <div style={styles.itemRight}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                      AED {price}
                    </span>
                    <span style={styles.addBtn}>+</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating Cart Bar ── */}
      {cartSummary.totalCount > 0 && (
        <div style={styles.floatingBar} className="animate-up">
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '700', fontSize: '16px' }}>
              {cartSummary.totalCount} item{cartSummary.totalCount !== 1 ? 's' : ''} · AED {cartSummary.subtotal.toFixed(2)}
            </span>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '14px' }}
            onClick={() => router.push('/app/checkout')}
            id="go-to-cafe-checkout-btn"
          >
            View Order →
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  menuCard: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    gap: '16px',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: 0,
  },
  itemImg: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  addBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    color: 'var(--secondary)',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    lineHeight: 1,
  },
  floatingBar: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)',
    maxWidth: '700px',
    background: 'rgba(15, 12, 9, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(196,164,132,0.25)',
    borderRadius: '20px',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    zIndex: 900,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
}
