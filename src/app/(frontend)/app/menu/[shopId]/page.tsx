'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ShopMenuPage() {
  const { shopId } = useParams()
  const [shop, setShop] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch Shop Details
    fetch(`/api/shop/${shopId}`)
      .then((res) => res.json())
      .then((data) => setShop(data))

    // Fetch Shop Menu
    fetch(`/api/shop-menu?where[shop][equals]=${shopId}`)
      .then((res) => res.json())
      .then((data) => {
        setMenu(data.docs || [])
        // Group by category if needed, or just list
        setLoading(false)
      })

    // Fetch Categories for filtering
    fetch('/api/app-categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.docs || []))
  }, [shopId])

  if (loading)
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        Loading Menu...
      </div>
    )

  return (
    <div className="container animate-up" style={{ padding: '40px 0 120px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/app" style={styles.backLink}>
          ← Back to Cafes
        </Link>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px' }}>
          {shop?.address?.city || 'Our Menu'}
        </h1>
        <p style={{ opacity: 0.6 }}>{shop?.address?.street}</p>
      </header>

      {/* Category Tabs */}
      <div className="no-scrollbar" style={styles.categoryTabs}>
        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className="btn-outline"
            style={{ padding: '8px 20px', fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu List */}
      <div style={styles.menuGrid}>
        {menu.map((item) => (
          <div key={item.id} className="glass glass-hover" style={styles.menuCard}>
            <div style={styles.itemInfo}>
              <h4 style={{ fontSize: '18px', fontWeight: '800' }}>{item.name}</h4>
              <p style={{ fontSize: '13px', opacity: 0.5, margin: '8px 0 16px' }}>{item.tagline}</p>
              <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                AED {item.regularPrice}
              </span>
            </div>
            <Link
              href={`/app/customize/${item.id}?shopId=${shopId}`}
              className="btn-primary flex-center"
              style={styles.addBtn}
            >
              +
            </Link>
          </div>
        ))}
      </div>

      {/* Floating Cart Bar could go here */}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backLink: {
    fontSize: '14px',
    opacity: 0.6,
  },
  categoryTabs: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    marginBottom: '40px',
    paddingBottom: '10px',
  },
  menuGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  menuCard: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  addBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    fontSize: '24px',
    padding: 0,
  },
}
