'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../../context/CartContext'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/web-products?where[slug][equals]=${slug}`)
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

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: selectedVariant ? selectedVariant.variantRegularPrice : product.regularPrice,
      quantity: 1,
      image: product.productImages?.[0]?.image?.url,
      variant: selectedVariant?.variantName,
      type: 'store',
    })
    // Optional: Show success state or redirect to cart
  }

  if (loading)
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        Loading...
      </div>
    )
  if (!product)
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        Product not found
      </div>
    )

  return (
    <div className="container animate-up" style={{ padding: '60px 0' }}>
      <Link href="/store" style={{ marginBottom: '40px', display: 'inline-block', opacity: 0.5 }}>
        ← Back to Store
      </Link>

      <div style={styles.grid}>
        {/* Image Gallery */}
        <div className="glass" style={styles.imageSection}>
          {product.productImages?.[0]?.image?.url ? (
            <img
              src={product.productImages[0].image.url}
              alt={product.name}
              style={{ width: '100%', borderRadius: '20px' }}
            />
          ) : (
            <div className="flex-center" style={{ height: '400px', opacity: 0.2 }}>
              No Image Available
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={styles.infoSection}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '12px' }}>
            {product.name}
          </h1>
          <p className="text-gradient" style={{ fontSize: '20px', marginBottom: '32px' }}>
            {product.tagline}
          </p>

          <div style={styles.priceRow}>
            <span style={{ fontSize: '32px', fontWeight: '800' }}>
              AED {selectedVariant ? selectedVariant.variantRegularPrice : product.regularPrice}
            </span>
          </div>

          <p style={{ lineHeight: '1.8', opacity: 0.7, marginBottom: '40px' }}>
            {product.description ||
              'Our signature roast, crafted with precision and passion. Experience the deep, complex flavors that only Surge can provide.'}
          </p>

          {/* Variants */}
          {product.hasVariantOptions && (
            <div style={{ marginBottom: '40px' }}>
              <h4 style={styles.selectionTitle}>Select Size/Format</h4>
              <div style={styles.variantGrid}>
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    className={`selection-option ${selectedVariant?.id === v.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                    style={{ width: '100%' }}
                  >
                    <span>{v.variantName}</span>
                    <span>AED {v.variantRegularPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleAddToCart}>
              Add to Bag
            </button>
            <button className="btn-outline" style={{ flex: 1 }}>
              Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr',
    gap: '60px',
  },
  imageSection: {
    padding: '20px',
    height: 'fit-content',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceRow: {
    marginBottom: '32px',
  },
  selectionTitle: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.5,
    marginBottom: '16px',
  },
  variantGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
}
