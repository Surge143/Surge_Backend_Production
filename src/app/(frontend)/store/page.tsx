'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Category {
  id: string | number
  name: string
}

interface Product {
  id: string | number
  name: string
  tagline: string
  slug: string
  regularPrice?: string | number
  salePrice?: string | number
  productImage?: { url: string }
  hasVariantOptions?: boolean
  variants?: Array<{ variantRegularPrice: string | number; variantSalePrice?: string | number }>
  categories?: string | number | { id: string | number }
}

export default function StoreApp() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async (categoryId: string | number | null) => {
    setLoading(true)
    try {
      let url = '/api/web-products?limit=24&depth=1'
      if (categoryId) {
        url += `&where[categories][equals]=${categoryId}`
      }
      const res = await fetch(url)
      const data = await res.json()
      setProducts(data.docs || [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/web-categories?limit=20')
      .then((res) => res.json())
      .then((data) => setCategories(data.docs || []))
      .catch(() => {})

    fetchProducts(null)
  }, [fetchProducts])

  const handleCategoryFilter = (catId: string | number | null) => {
    setActiveCategory(catId)
    fetchProducts(catId)
  }

  const getProductPrice = (product: Product) => {
    if (product.salePrice) return { current: product.salePrice, original: product.regularPrice }
    if (product.regularPrice) return { current: product.regularPrice, original: null }
    const firstVariant = product.variants?.[0]
    if (firstVariant) {
      return {
        current: firstVariant.variantSalePrice || firstVariant.variantRegularPrice,
        original: firstVariant.variantSalePrice ? firstVariant.variantRegularPrice : null,
      }
    }
    return { current: null, original: null }
  }

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

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <button
              className={`category-pill${activeCategory === null ? ' active' : ''}`}
              onClick={() => handleCategoryFilter(null)}
            >
              All Products
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
      </section>

      {/* Product Grid */}
      <section className="container">
        {loading ? (
          /* Skeleton grid */
          <div className="grid-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass" style={styles.productCard}>
                <div className="skeleton" style={styles.skeletonImg} />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skeleton" style={{ height: '20px', borderRadius: '8px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '8px' }} />
                  <div className="skeleton" style={{ height: '18px', width: '40%', borderRadius: '8px', marginTop: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex-center" style={{ height: '40vh', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>📦</span>
            <p style={{ fontSize: '18px', opacity: 0.5 }}>No products found</p>
            {activeCategory && (
              <button className="btn-outline" onClick={() => handleCategoryFilter(null)}>
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid-auto">
            {products.map((product) => {
              const price = getProductPrice(product)
              return (
                <Link
                  key={product.id}
                  href={`/store/product/${product.slug || product.id}`}
                  className="glass glass-hover"
                  style={styles.productCard}
                >
                  {/* Product Image */}
                  <div style={styles.productImg}>
                    {product.productImage?.url ? (
                      <img
                        src={product.productImage.url}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '16px',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '48px', opacity: 0.3 }}>☕</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: '20px 24px 24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', lineHeight: '1.3' }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '13px', opacity: 0.5, marginBottom: '16px', lineHeight: '1.5' }}>
                      {product.tagline}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>
                          AED {price.current ?? '—'}
                        </span>
                        {price.original && (
                          <span style={{ fontSize: '13px', opacity: 0.4, textDecoration: 'line-through' }}>
                            AED {price.original}
                          </span>
                        )}
                      </div>
                      {product.hasVariantOptions && <span className="variant-badge">Variants</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
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
    textDecoration: 'none',
    color: 'inherit',
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
  skeletonImg: {
    margin: '12px',
    borderRadius: '16px',
    aspectRatio: '1',
  },
}
