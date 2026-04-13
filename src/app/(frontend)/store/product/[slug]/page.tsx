'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../../context/CartContext'
import { useUser } from '../../../context/UserContext'

interface Variant {
  id: string
  variantName: string
  variantRegularPrice: number
  variantSalePrice?: number
  variantImage?: { url: string }
  variantInStock?: boolean
}

interface Product {
  id: number
  name: string
  tagline: string
  slug: string
  description: string
  regularPrice?: number
  salePrice?: number
  inStock?: boolean
  productImage?: { url: string }
  hasVariantOptions?: boolean
  variants?: Variant[]
  productType?: string
  // Coffee characteristics
  farm?: string
  tastingNotes?: string
  variety?: string
  process?: string
  altitude?: string
  roast?: string
  body?: string
  aroma?: string
  finish?: string
  // Brew guide
  brewGuide?: { filter?: boolean; espresso?: boolean; milk?: boolean }
  // Merchandise
  material?: string
  dimensions?: string
  weight?: string
  careInstructions?: string
}

// Simple toast component
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
  if (!visible) return null
  return <div className="toast">{message}</div>
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { addToCart, loading: cartLoading } = useCart()
  const { user } = useUser()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [loading, setLoading] = useState(true)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/web-products?where[slug][equals]=${slug}&depth=1&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.docs?.length > 0) {
          const prod = data.docs[0]
          setProduct(prod)
          if (prod.hasVariantOptions && prod.variants?.length > 0) {
            setSelectedVariant(prod.variants[0])
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }, [])

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart(
        product.id,
        selectedVariant?.id || '',
        1,
      )
      showToast('Added to bag! 🛍️')
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  // Determine the current price display
  const currentPrice = selectedVariant
    ? (selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice)
    : (product?.salePrice || product?.regularPrice)

  const originalPrice = selectedVariant
    ? (selectedVariant.variantSalePrice ? selectedVariant.variantRegularPrice : null)
    : (product?.salePrice ? product.regularPrice : null)

  const displayImage = selectedVariant?.variantImage?.url || product?.productImage?.url

  const isOutOfStock =
    selectedVariant
      ? selectedVariant.variantInStock === false
      : product?.inStock === false

  if (loading) {
    return (
      <div className="container animate-up" style={{ padding: '60px 0' }}>
        <div style={styles.grid}>
          <div className="skeleton glass" style={{ height: '500px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <div className="skeleton" style={{ height: '48px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '24px', width: '70%', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '40px', width: '30%', borderRadius: '8px', marginTop: '16px' }} />
            <div className="skeleton" style={{ height: '96px', borderRadius: '12px', marginTop: '8px' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '48px' }}>😔</span>
        <p style={{ fontSize: '20px', opacity: 0.5 }}>Product not found</p>
        <Link href="/store" className="btn-outline" style={{ padding: '12px 24px' }}>
          Back to Store
        </Link>
      </div>
    )
  }

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <Toast message={toastMsg} visible={toastVisible} />

      <Link href="/store" style={{ marginBottom: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.5, fontSize: '14px' }}>
        ← Back to Store
      </Link>

      <div style={styles.grid}>
        {/* Image Section */}
        <div style={styles.imageSection}>
          <div className="glass" style={styles.mainImageWrapper}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
              />
            ) : (
              <div className="flex-center" style={{ height: '400px', opacity: 0.15, fontSize: '80px' }}>
                ☕
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div style={styles.infoSection}>
          {/* Name & Tagline */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.1', marginBottom: '10px' }}>
              {product.name}
            </h1>
            <p className="text-gradient" style={{ fontSize: '18px', fontWeight: '700' }}>
              {product.tagline}
            </p>
          </div>

          {/* Price */}
          <div style={styles.priceRow}>
            <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)' }}>
              AED {currentPrice ?? '—'}
            </span>
            {originalPrice && (
              <span style={{ fontSize: '18px', opacity: 0.4, textDecoration: 'line-through', marginLeft: '12px' }}>
                AED {originalPrice}
              </span>
            )}
            {isOutOfStock && (
              <span style={styles.outOfStockBadge}>Out of Stock</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={styles.description}>{product.description}</p>
          )}

          {/* Variants */}
          {product.hasVariantOptions && product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={styles.sectionLabel}>Select Variant</h4>
              <div style={styles.variantGrid}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`selection-option${selectedVariant?.id === v.id ? ' selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                    style={{ opacity: v.variantInStock === false ? 0.4 : 1 }}
                  >
                    <span>{v.variantName}</span>
                    <span style={{ fontWeight: '900', fontSize: '13px' }}>
                      AED {v.variantSalePrice || v.variantRegularPrice}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, padding: '18px', fontSize: '15px' }}
              onClick={handleAddToCart}
              disabled={addingToCart || cartLoading || isOutOfStock}
              id="add-to-cart-btn"
            >
              {isOutOfStock
                ? 'Out of Stock'
                : addingToCart
                ? 'Adding…'
                : 'Add to Bag'}
            </button>
          </div>

          {/* Coffee Characteristics */}
          {product.productType === 'coffee' && (product.farm || product.tastingNotes || product.roast) && (
            <div className="glass" style={styles.detailsCard}>
              <h4 style={styles.sectionLabel}>Coffee Characteristics</h4>
              <div style={styles.specsGrid}>
                {product.farm && <SpecRow label="Farm" value={product.farm} />}
                {product.variety && <SpecRow label="Variety" value={product.variety} />}
                {product.roast && <SpecRow label="Roast" value={product.roast} />}
                {product.process && <SpecRow label="Process" value={product.process} />}
                {product.altitude && <SpecRow label="Altitude" value={product.altitude} />}
                {product.body && <SpecRow label="Body" value={product.body} />}
                {product.aroma && <SpecRow label="Aroma" value={product.aroma} />}
                {product.finish && <SpecRow label="Finish" value={product.finish} />}
                {product.tastingNotes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <SpecRow label="Tasting Notes" value={product.tastingNotes} />
                  </div>
                )}
              </div>

              {/* Brew Guide */}
              {product.brewGuide && (product.brewGuide.filter || product.brewGuide.espresso || product.brewGuide.milk) && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '12px' }}>
                    Brew Guide
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {product.brewGuide.filter && <span className="variant-badge">Filter</span>}
                    {product.brewGuide.espresso && <span className="variant-badge">Espresso</span>}
                    {product.brewGuide.milk && <span className="variant-badge">Milk</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Merchandise Details */}
          {product.productType === 'merchandise' && (product.material || product.dimensions) && (
            <div className="glass" style={styles.detailsCard}>
              <h4 style={styles.sectionLabel}>Product Details</h4>
              <div style={styles.specsGrid}>
                {product.material && <SpecRow label="Material" value={product.material} />}
                {product.dimensions && <SpecRow label="Dimensions" value={product.dimensions} />}
                {product.weight && <SpecRow label="Weight" value={product.weight} />}
                {product.careInstructions && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <SpecRow label="Care" value={product.careInstructions} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SpecRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, fontWeight: '700' }}>
      {label}
    </span>
    <span style={{ fontSize: '14px', fontWeight: '600' }}>{value}</span>
  </div>
)

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(340px, 1.1fr) 1fr',
    gap: '60px',
    alignItems: 'start',
    marginTop: '32px',
  },
  imageSection: {
    position: 'sticky',
    top: '110px',
  },
  mainImageWrapper: {
    padding: '12px',
    aspectRatio: '1',
    overflow: 'hidden',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceRow: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '8px',
  },
  outOfStockBadge: {
    background: 'rgba(231,76,60,0.15)',
    color: '#e74c3c',
    border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '700',
    marginLeft: '8px',
  },
  description: {
    lineHeight: '1.8',
    opacity: 0.65,
    marginBottom: '32px',
    fontSize: '15px',
  },
  sectionLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    opacity: 0.45,
    marginBottom: '14px',
    fontWeight: '700',
  },
  variantGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  detailsCard: {
    padding: '24px',
    marginTop: '8px',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
}
