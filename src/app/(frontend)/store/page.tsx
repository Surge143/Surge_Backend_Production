'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StoreApp() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/web-products?limit=10')
      .then((res) => res.json())
      .then((data) => setProducts(data.docs || []))

    fetch('/api/web-categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.docs || []))
  }, [])

  return (
    <div className="animate-up" style={{ paddingBottom: '100px' }}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 className="text-gradient" style={{ fontSize: '64px', marginBottom: '16px' }}>
            Artisan Roasts
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.6, maxWidth: '600px', margin: '0 auto 40px' }}>
            Explore our curated collection of specialty beans, sourced directly from the world&apos;s
            most renowned farms.
          </p>
          <div className="flex-center" style={{ gap: '16px' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="btn-outline"
                style={{ padding: '10px 20px', fontSize: '12px' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container">
        <div className="grid-auto">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/store/product/${product.slug || product.id}`}
              className="glass glass-hover"
              style={styles.productCard}
            >
              <div style={styles.productImg}>
                {product.productImages?.[0]?.image?.url ? (
                  <img
                    src={product.productImages[0].image.url}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '16px',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '14px', opacity: 0.3 }}>Premium Roast</span>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.5, marginBottom: '20px' }}>
                  {product.tagline}
                </p>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>
                    AED {product.regularPrice || product.variants?.[0]?.variantRegularPrice}
                  </span>
                  {product.hasVariantOptions && <span className="variant-badge">Variants</span>}
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
  hero: {
    padding: '100px 0 60px',
  },
  productCard: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  productImg: {
    aspectRatio: '1',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '12px',
    borderRadius: '16px',
    overflow: 'hidden',
  },
}
