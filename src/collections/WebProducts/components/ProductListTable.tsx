'use client'
import React, { useEffect, useMemo, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  id?: string | null
  variantName: string
  variantRegularPrice: number
  variantSalePrice?: number | null
  variantInStock?: boolean | null
  variantStockQuantity?: number | null
}

interface Product {
  id: number
  name: string
  slug?: string | null
  _status?: string | null
  hasVariantOptions?: boolean | null
  variants?: Variant[] | null
  regularPrice?: number | null
  salePrice?: number | null
  inStock?: boolean | null
  stockQuantity?: number | null
  // Payload sometimes returns a bare numeric ID instead of the populated
  // media object when draft=true and depth=1. We resolve these below.
  productImage?: { url?: string } | number | null
  categories?: { name?: string } | null
  updatedAt?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(v?: number | null) {
  if (v == null) return '—'
  return `AED ${Number(v).toFixed(2)}`
}

function variantPriceRange(variants: Variant[]) {
  const prices = variants.map((v) => v.variantSalePrice ?? v.variantRegularPrice).filter((p): p is number => p != null)
  if (!prices.length) return '—'
  const min = Math.min(...prices), max = Math.max(...prices)
  if (min === max) return `AED ${min.toFixed(2)}`
  return `AED ${min.toFixed(2)} – ${max.toFixed(2)}`
}

function variantTotalStock(variants: Variant[]) {
  return variants.reduce((s, v) => s + (v.variantInStock ? (v.variantStockQuantity ?? 0) : 0), 0)
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Stock badge ───────────────────────────────────────────────────────────────

function StockBadge({ inStock, qty }: { inStock: boolean; qty: number }) {
  const isLow = inStock && qty <= 5
  const color = !inStock ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e'
  const bg = !inStock ? '#ef444412' : isLow ? '#f59e0b12' : '#22c55e12'
  const border = !inStock ? '#ef444430' : isLow ? '#f59e0b30' : '#22c55e30'
  const label = !inStock ? 'Out of Stock' : isLow ? `Low · ${qty}` : `In Stock · ${qty}`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      color, background: bg, border: `1px solid ${border}`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

// no CSS hiding — our table renders above the native Payload list
const HIDE_NATIVE = ``

// Grid: img | name | category | price | sale price | stock | updated
const COLS = '52px 1fr 130px 130px 110px 160px 100px'
// Variant sub-row grid (same, first col is indent spacer)
const VAR_COLS = '52px 1fr 130px 130px 110px 160px 100px'

// ── Main component ────────────────────────────────────────────────────────────

export const ProductListTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/web-products?limit=500&depth=1&sort=name&draft=true')
      .then((r) => r.json())
      .then(async (data) => {
        const docs: Product[] = data.docs ?? []

        // ── Batch-resolve any productImage that came back as a bare ID ────────
        // With drafts enabled, Payload sometimes skips populating relationships
        // and returns just the numeric ID. We collect all such IDs, fetch them
        // in a single /api/media request, then merge the results back.
        const unresolvedIds = [
          ...new Set(
            docs
              .map((p) => p.productImage)
              .filter((img): img is number => typeof img === 'number'),
          ),
        ]

        if (unresolvedIds.length > 0) {
          try {
            const mediaRes = await fetch(
              `/api/media?where[id][in]=${unresolvedIds.join(',')}&limit=${unresolvedIds.length}&depth=0`,
            )
            const mediaData = await mediaRes.json()
            const mediaMap: Record<number, { url?: string }> = {}
            for (const m of mediaData.docs ?? []) {
              mediaMap[m.id] = m
            }
            // Swap bare IDs for the full media objects
            for (const p of docs) {
              if (typeof p.productImage === 'number') {
                p.productImage = mediaMap[p.productImage] ?? null
              }
            }
          } catch {
            // Non-fatal: images might just not show for this render
          }
        }
        // ────────────────────────────────────────────────────────────────────

        setProducts(docs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.slug ?? '').toLowerCase().includes(q),
    )
  }, [products, search])

  // ── Header cell ────────────────────────────────────────────────────────────
  const Th = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      padding: '10px 10px',
      fontSize: 10, fontWeight: 700, letterSpacing: 0.7,
      textTransform: 'uppercase', color: '#555',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  )

  return (
    <>
      <style>{HIDE_NATIVE}</style>

      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        color: 'var(--theme-text, #e0e0e0)',
        marginBottom: 24,
      }}>
        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          padding: '8px 0',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Products</span>
          <span style={{
            padding: '1px 8px', borderRadius: 10, fontSize: 11,
            background: 'var(--theme-elevation-100, #1a1a1a)',
            border: '1px solid var(--theme-elevation-200, #2a2a2a)',
            color: '#888',
          }}>
            {filtered.length}
          </span>
          <div style={{ flex: 1 }} />
          {/* Search */}
          <div style={{ position: 'relative', width: 220 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--theme-elevation-50, #111)',
                border: '1px solid var(--theme-elevation-200, #222)',
                borderRadius: 4, padding: '6px 28px',
                color: 'var(--theme-text, #e0e0e0)', fontSize: 12, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#444', fontSize: 14, cursor: 'pointer', padding: 0
                }}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{
          border: '1px solid var(--theme-elevation-200, #1e1e1e)',
          borderRadius: 6, overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: COLS,
            background: 'var(--theme-elevation-50, #0d0d0d)',
            borderBottom: '1px solid var(--theme-elevation-200, #1e1e1e)',
          }}>
            <Th> </Th>
            <Th>Product Name</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Sale Price</Th>
            <Th>Stock</Th>
            <Th>Updated</Th>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '20px 16px', color: '#555', fontSize: 12 }}>Loading…</div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '20px 16px', color: '#555', fontSize: 12 }}>No products found.</div>
          )}

          {/* Rows */}
          {filtered.map((product, pi) => {
            const hasVariants = Boolean(product.hasVariantOptions) && (product.variants?.length ?? 0) > 0
            const variants = product.variants ?? []
            const isLast = pi === filtered.length - 1
            const published = product._status === 'published'

            return (
              <React.Fragment key={product.id}>
                {/* ── Product row ── */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: COLS,
                    alignItems: 'center',
                    background: 'var(--theme-elevation-0, #0b0b0b)',
                    borderBottom: hasVariants
                      ? 'none'
                      : isLast
                        ? 'none'
                        : '1px solid var(--theme-elevation-150, #161616)',
                  }}
                >
                  {/* Image — productImage is always a resolved object by this point */}
                  <div style={{ padding: '10px 8px 10px 10px' }}>
                    {typeof product.productImage === 'object' && product.productImage?.url ? (
                      <img src={product.productImage.url} alt={product.name}
                        style={{
                          width: 36, height: 36, objectFit: 'cover', borderRadius: 4, display: 'block',
                          border: '1px solid var(--theme-elevation-200, #1e1e1e)'
                        }} />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: 4,
                        background: 'var(--theme-elevation-150, #1a1a1a)',
                        border: '1px solid var(--theme-elevation-200, #1e1e1e)'
                      }} />
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ padding: '10px 8px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span title={published ? 'Published' : 'Draft'} style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: published ? '#22c55e' : '#f59e0b',
                      }} />
                      <a href={`/admin/collections/web-products/${product.id}`}
                        style={{
                          color: 'var(--theme-text, #e0e0e0)',
                          textDecoration: 'underline', textUnderlineOffset: 2,
                          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', fontSize: 13,
                        }}>
                        {product.name}
                      </a>
                      {hasVariants && (
                        <span style={{
                          flexShrink: 0, padding: '1px 6px', borderRadius: 3, fontSize: 10,
                          border: '1px solid var(--theme-elevation-300, #2a2a2a)',
                          background: 'var(--theme-elevation-100, #161616)', color: '#666',
                        }}>
                          {variants.length} variants
                        </span>
                      )}
                    </div>
                    {product.slug && (
                      <div style={{
                        fontSize: 11, color: '#555', marginTop: 2, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {product.slug}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div style={{
                    padding: '10px 8px', fontSize: 12, color: '#888',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {(product.categories as any)?.name ?? '—'}
                  </div>

                  {/* Price */}
                  <div style={{ padding: '10px 8px', fontSize: 12, fontWeight: 500 }}>
                    {hasVariants ? variantPriceRange(variants) : fmtPrice(product.regularPrice)}
                  </div>

                  {/* Sale Price */}
                  <div style={{
                    padding: '10px 8px', fontSize: 12,
                    color: !hasVariants && product.salePrice ? '#ef4444' : '#555',
                  }}>
                    {hasVariants ? '—' : fmtPrice(product.salePrice)}
                  </div>

                  {/* Stock */}
                  <div style={{ padding: '10px 8px' }}>
                    {hasVariants ? (
                      <StockBadge
                        inStock={variants.some((v) => v.variantInStock)}
                        qty={variantTotalStock(variants)}
                      />
                    ) : (
                      <StockBadge
                        inStock={Boolean(product.inStock)}
                        qty={product.stockQuantity ?? 0}
                      />
                    )}
                  </div>

                  {/* Updated */}
                  <div style={{ padding: '10px 8px', fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>
                    {fmtDate(product.updatedAt)}
                  </div>
                </div>

                {/* ── Variant sub-rows ── */}
                {hasVariants && variants.map((v, vi) => {
                  const inStock = Boolean(v.variantInStock)
                  const qty = v.variantStockQuantity ?? 0
                  const isLastVariant = vi === variants.length - 1

                  return (
                    <div
                      key={v.id ?? vi}
                      style={{
                        display: 'grid', gridTemplateColumns: VAR_COLS,
                        alignItems: 'center',
                        background: 'var(--theme-elevation-50, #0d0d0d)',
                        borderTop: '1px solid var(--theme-elevation-150, #161616)',
                        borderBottom: isLastVariant && !isLast
                          ? '2px solid var(--theme-elevation-200, #1e1e1e)'
                          : isLastVariant
                            ? 'none'
                            : 'none',
                        borderLeft: '3px solid var(--theme-elevation-300, #2a2a2a)',
                      }}
                    >
                      {/* Indent spacer with connecting line */}
                      <div style={{
                        padding: '7px 8px 7px 14px',
                        display: 'flex', alignItems: 'center',
                      }}>
                        <span style={{ color: '#333', fontSize: 12 }}>↳</span>
                      </div>

                      {/* Variant name */}
                      <div style={{
                        padding: '7px 8px', fontSize: 12, color: '#888',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {v.variantName}
                      </div>

                      {/* Regular price */}
                      <div style={{ padding: '7px 8px', fontSize: 12, fontWeight: 500, color: '#aaa' }}>
                        {fmtPrice(v.variantRegularPrice)}
                      </div>

                      {/* Sale price */}
                      <div style={{
                        padding: '7px 8px', fontSize: 12,
                        color: v.variantSalePrice ? '#ef4444' : '#555',
                      }}>
                        {fmtPrice(v.variantSalePrice)}
                      </div>

                      {/* Stock badge */}
                      <div style={{ padding: '7px 8px' }}>
                        <StockBadge inStock={inStock} qty={qty} />
                      </div>

                      {/* Updated — empty for variants */}
                      <div />
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </>
  )
}
