'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Option {
  label: string
  price?: number
}

interface Section {
  title: string
  selectionType: 'single' | 'multiple'
  options: Option[]
}

interface MenuProduct {
  id: string | number
  name: string
  tagline?: string
  description?: string
  regularPrice?: number
  salePrice?: number
  image?: { url: string }
  customizations?: Array<{ sections: Section[] }>
}

interface AppCartResponse {
  error?: string
  items?: any[]
  origin?: 'cafe' | 'store'
  shop?: { id?: string | number } | string | number | null
}

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
  if (!visible) return null
  return <div className="toast">{message}</div>
}

export default function CustomizePage() {
  const { productId } = useParams<{ productId: string }>()
  const searchParams = useSearchParams()
  const rawShopId = searchParams.get('shopId')
  // Guard against stringified null/undefined that would fail Payload's relationship validation
  const shopId = (rawShopId && rawShopId !== 'null' && rawShopId !== 'undefined') ? rawShopId : null
  const router = useRouter()


  const [product, setProduct] = useState<MenuProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [mixedCartPending, setMixedCartPending] = useState(false)
  const [mixedCartOrigin, setMixedCartOrigin] = useState<'cafe' | 'store'>('store')
  const [pendingCustomizations, setPendingCustomizations] = useState<any[]>([])
  const [selections, setSelections] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!productId) return
    fetch(`/api/shop-menu/${productId}?depth=1`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productId])

  const calculateTotal = useCallback(() => {
    if (!product) return 0
    const base = product.salePrice || product.regularPrice || 0
    const extras = Object.values(selections)
      .flat()
      .reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0)
    return (base + extras) * quantity
  }, [product, selections, quantity])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2600)
  }

  const handleToggleOption = (section: Section, opt: Option) => {
    setSelections((prev) => {
      const current = prev[section.title] || (section.selectionType === 'single' ? null : [])
      if (section.selectionType === 'single') {
        return { ...prev, [section.title]: opt }
      }
      const arr: Option[] = Array.isArray(current) ? current : []
      const exists = arr.find((o) => o.label === opt.label)
      return {
        ...prev,
        [section.title]: exists
          ? arr.filter((o) => o.label !== opt.label)
          : [...arr, opt],
      }
    })
  }

  const isSelected = (sectionTitle: string, optLabel: string, selectionType: string) => {
    const sel = selections[sectionTitle]
    if (selectionType === 'single') return sel?.label === optLabel
    return Array.isArray(sel) && sel.some((o) => o.label === optLabel)
  }

  // Core cart POST — optionally clears existing cart first
  // retryAfterClear: internal flag used when recovering from stale-cart errors
  const doAddToAppCart = async (clearFirst: boolean, customizationsFlat: any[], retryAfterClear = false) => {
    setAdding(true)
    try {
      if (clearFirst) {
        await fetch('/api/website/cart/clear', { method: 'POST', credentials: 'include' }).catch(() => {})
        await fetch('/api/app/cart', { method: 'DELETE', credentials: 'include' })
      }

      const cartBody: Record<string, any> = {
        productId: product!.id,
        quantity,
        customizations: customizationsFlat,
      }
      // NOTE: Do NOT send shopId — the backend derives it from the product's own
      // shop field. Sending the URL param shopId caused Payload relationship
      // validation failures ("The following field is invalid: Shop").

      const res = await fetch('/api/app/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cartBody),
      })
      const data = await parseJsonSafely<AppCartResponse>(res)

      if (!res.ok) {
        if (data?.error === 'MIXED_CART') {
          setMixedCartOrigin(data?.origin === 'cafe' || (data as any)?.currentOrigin === 'cafe' ? 'cafe' : 'store')
          setPendingCustomizations(customizationsFlat)
          setMixedCartPending(true)
          return
        }
        if (res.status === 401) {
          router.push('/login')
          return
        }
        // If the error mentions "shop" or is a 500, try clearing the stale cart and retrying once
        const errMsg: string = (data?.error || '').toLowerCase()
        if (!retryAfterClear && (res.status === 500 || errMsg.includes('shop'))) {
          await fetch('/api/app/cart', { method: 'DELETE', credentials: 'include' }).catch(() => {})
          await doAddToAppCart(false, customizationsFlat, true)
          return
        }
        showToast(data?.error || 'Failed to add to cart')
        return
      }
      if (!Array.isArray(data?.items) || data.items.length === 0) {
        showToast('Item was not added to cart. Please try again.')
        return
      }
      showToast('Added to cart! ✅')
      setTimeout(() => {
        window.location.href = `/app/menu/${shopId || ''}`
      }, 700)
    } catch {
      showToast('Failed to add item. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    const customizationsFlat: Array<{ sectionTitle: string; label: string; price: number }> = []
    for (const [sectionTitle, sel] of Object.entries(selections)) {
      const items = Array.isArray(sel) ? sel : sel ? [sel] : []
      items.forEach((opt: Option) => {
        customizationsFlat.push({ sectionTitle, label: opt.label, price: opt.price || 0 })
      })
    }
    await doAddToAppCart(false, customizationsFlat)
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container animate-up" style={{ padding: '60px 0' }}>
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton" style={{ height: '48px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '200px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
        </div>
      </div>
    )
  }

  // ── Not found state ───────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '20px', opacity: 0.5 }}>Product not found</p>
        <Link href={`/app/menu/${shopId}`} className="btn-outline" style={{ padding: '12px 24px' }}>
          Back to Menu
        </Link>
      </div>
    )
  }

  const sections = product.customizations?.[0]?.sections || []

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="container animate-up" style={{ padding: '60px 0', maxWidth: '640px' }}>
      <Toast message={toastMsg} visible={toastVisible} />

      <Link
        href={`/app/menu/${shopId}`}
        style={{ opacity: 0.5, fontSize: '14px', display: 'inline-block', marginBottom: '32px' }}
      >
        ← Back to Menu
      </Link>

      {/* Product Header */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '40px' }}>
        {product.image?.url && (
          <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={product.image.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', lineHeight: '1.1', marginBottom: '6px' }}>
            {product.name}
          </h1>
          {product.tagline && (
            <p className="text-gradient" style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
              {product.tagline}
            </p>
          )}
          {product.description && (
            <p style={{ opacity: 0.6, fontSize: '14px', lineHeight: '1.6' }}>{product.description}</p>
          )}
        </div>
      </div>

      {/* Customization Sections */}
      {sections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
          {sections.map((section) => (
            <div key={section.title}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', opacity: 0.55 }}>
                  {section.title}
                </h4>
                <span style={{ fontSize: '11px', opacity: 0.4, fontWeight: '600', letterSpacing: '0.5px' }}>
                  {section.selectionType === 'single' ? 'Choose one' : 'Select any'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {section.options?.map((opt) => (
                  <button
                    key={opt.label}
                    className={`selection-option${isSelected(section.title, opt.label, section.selectionType) ? ' selected' : ''}`}
                    onClick={() => handleToggleOption(section, opt)}
                  >
                    <span>{opt.label}</span>
                    <span style={{ fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                      {(opt.price || 0) > 0 ? `+AED ${opt.price}` : 'Free'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700' }}>Quantity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={qtyBtnStyle}
            >
              −
            </button>
            <span style={{ fontWeight: '800', fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button onClick={() => setQuantity(quantity + 1)} style={qtyBtnStyle}>
              +
            </button>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '18px', fontSize: '15px' }}
          onClick={handleAddToCart}
          disabled={adding}
          id="add-to-cafe-cart-btn"
        >
          {adding ? 'Adding to Cart…' : `Add to Cart • AED ${calculateTotal().toFixed(2)}`}
        </button>
      </div>

      {/* Mixed-cart replacement dialog */}
      {mixedCartPending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div className="glass animate-up" style={{ maxWidth: '400px', width: '100%', padding: '36px', borderRadius: '24px' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>🔄</div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', textAlign: 'center', marginBottom: '12px' }}>
              Replace Cart?
            </h3>
            <p style={{ fontSize: '15px', opacity: 0.7, textAlign: 'center', lineHeight: '1.6' }}>
              Your cart has <strong style={{ color: 'var(--primary)' }}>{mixedCartOrigin === 'cafe' ? 'Cafe' : 'Store'}</strong> items.
              Adding a Cafe item will clear your current cart.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn-outline"
                style={{ flex: 1, padding: '14px' }}
                onClick={() => setMixedCartPending(false)}
              >
                Keep {mixedCartOrigin === 'cafe' ? 'Cafe' : 'Store'} Cart
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '14px' }}
                onClick={() => {
                  setMixedCartPending(false)
                  doAddToAppCart(true, pendingCustomizations)
                }}
              >
                Replace Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const qtyBtnStyle: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '18px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
}
