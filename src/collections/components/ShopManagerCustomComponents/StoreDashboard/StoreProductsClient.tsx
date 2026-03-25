'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ConfirmationModal, useModal } from '@payloadcms/ui'

// ── Types ───────────────────────────────────────────────────────────────────

interface SubFreq {
  duration: number
  interval: 'year' | 'month' | 'week' | 'day'
}

interface MediaImg {
  url?: string | null         // original full-size image — always use this
  thumbnailURL?: string | null // DO NOT use — admin-only thumbnail
}

interface Variant {
  id?: string | null
  variantName: string
  variantRegularPrice: number
  variantSalePrice?: number | null
  variantInStock?: boolean | null
  variantStockQuantity?: number | null
  variantImage?: MediaImg | null
  hasVariantSub?: boolean | null
  subscriptionDiscount?: number | null
  subFreq?: SubFreq[] | null
}

interface Product {
  id: string | number
  name: string
  tagline?: string
  slug?: string | null
  hasVariantOptions?: boolean | null
  regularPrice?: number | null
  salePrice?: number | null
  inStock?: boolean | null
  stockQuantity?: number | null
  variants?: Variant[] | null
  categories?: { id: string | number; name: string } | null
  productImage?: MediaImg | null
  _status?: string | null
  updatedAt?: string
  createdAt?: string
  hasSimpleSub?: boolean | null
  subscriptionDiscount?: number | null
  subFreq?: SubFreq[] | null
}

interface Props {
  initialProducts: Product[]
}

type SortKey = 'name' | 'stockQuantity' | 'regularPrice' | 'inStock' | 'slug' | 'categories' | 'updatedAt'
type SortDir = 'asc' | 'desc'

// ── Helpers ─────────────────────────────────────────────────────────────────

function noVal(label: string) {
  return (
    <span style={{ color: '#4a4a4a', fontStyle: 'italic' }}>{`<No ${label}>`}</span>
  )
}

function SubBadge({ discount, freqs }: { discount?: number | null; freqs?: SubFreq[] | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Top row: icon + label + discount pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: 'var(--theme-elevation-100)', border: '1px solid rgba(99,102,241,0.5)', color: '#6366f1',
          whiteSpace: 'nowrap',
        }}>
          ↻ Sub
        </span>
        {discount != null && (
          <span style={{
            padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            background: 'var(--theme-elevation-100)', border: '1px solid rgba(22,163,74,0.5)', color: '#16a34a',
            whiteSpace: 'nowrap',
          }}>
            {discount}% off
          </span>
        )}
      </div>
      {/* Frequency pills */}
      {freqs && freqs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {freqs.map((f, i) => (
            <span key={i} style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
              background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-200)', color: '#818cf8',
              whiteSpace: 'nowrap',
            }}>
              {f.duration} {f.interval}{f.duration > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function variantPriceRange(variants: Variant[]) {
  const prices = variants.map((v) => v.variantSalePrice ?? v.variantRegularPrice).filter((p): p is number => p != null)
  if (!prices.length) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `AED ${min.toFixed(2)}`
  return `AED ${min.toFixed(2)} – ${max.toFixed(2)}`
}

function variantTotalStock(variants: Variant[]) {
  return variants.reduce((s, v) => s + (v.variantInStock ? (v.variantStockQuantity ?? 0) : 0), 0)
}

// ── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .spl-row { transition: background 0.08s; }
  .spl-row:hover { background: var(--theme-elevation-100) !important; }
  .spl-row.spl-selected { background: var(--theme-elevation-150) !important; }
  .spl-row.spl-selected:hover { background: var(--theme-elevation-200) !important; }
  .spl-th { cursor: pointer; user-select: none; }
  .spl-th:hover { color: var(--theme-elevation-700) !important; }
  .spl-link { color: var(--theme-text); text-decoration: underline; text-underline-offset: 2px; }
  .spl-link:hover { color: var(--theme-text); opacity: 0.7; }
  .spl-var-row { transition: background 0.08s; }
  .spl-var-row:hover { background: var(--theme-elevation-100) !important; }
  .spl-qty-input { width: 64px; background: var(--theme-elevation-0); border: 1px solid var(--theme-elevation-250); border-radius: 3px; padding: 3px 6px; color: var(--theme-text); font-size: 12px; outline: none; }
  .spl-qty-input:focus { border-color: rgba(99,102,241,0.7); }
  .spl-edit-btn { background: var(--theme-elevation-100); border: 1px solid rgba(99,102,241,0.4); border-radius: 4px; color: #6366f1; cursor: pointer; font-size: 13px; padding: 3px 7px; line-height: 1; transition: all 0.15s; }
  .spl-edit-btn:hover { background: var(--theme-elevation-150); border-color: rgba(99,102,241,0.8); color: #818cf8; }
  .spl-save-btn { background: var(--theme-elevation-100); border: 1px solid rgba(22,163,74,0.5); border-radius: 3px; color: #16a34a; cursor: pointer; font-size: 11px; padding: 2px 7px; font-weight: 600; }
  .spl-save-btn:hover { background: var(--theme-elevation-150); }
  .spl-cancel-btn { background: transparent; border: 1px solid var(--theme-elevation-250); border-radius: 3px; color: var(--theme-elevation-400); cursor: pointer; font-size: 11px; padding: 2px 7px; }
  .spl-cancel-btn:hover { border-color: var(--theme-elevation-350); color: var(--theme-elevation-600); }
`

// Grid columns: checkbox | image | name | price | in-stock | stock-qty | subscription | categories | updated | actions
const GRID = '36px 56px 1fr 130px 110px 180px 150px 130px 100px 70px'
const GRID_VAR = '36px 56px 1fr 130px 110px 180px 150px 130px 100px 70px'

// ── Sub-components ───────────────────────────────────────────────────────────

const BoolBadge: React.FC<{ value: boolean }> = ({ value }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 3,
      fontSize: 12,
      border: '1px solid var(--theme-elevation-150)',
      background: 'var(--theme-elevation-100)',
      color: 'var(--theme-elevation-600)',
      fontFamily: 'monospace',
    }}
  >
    {value ? 'true' : 'false'}
  </span>
)

const SortIcon: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 5, gap: 1, verticalAlign: 'middle', lineHeight: 1 }}>
    <span style={{ fontSize: 7, color: active && dir === 'asc' ? '#fff' : 'var(--theme-elevation-250)' }}>▲</span>
    <span style={{ fontSize: 7, color: active && dir === 'desc' ? '#fff' : 'var(--theme-elevation-250)' }}>▼</span>
  </span>
)

const StatusDot: React.FC<{ status?: string | null }> = ({ status }) => {
  const published = status === 'published'
  return (
    <span
      title={status ?? 'draft'}
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: published ? '#22c55e' : '#f59e0b',
        flexShrink: 0,
      }}
    />
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export const StoreProductsClient: React.FC<Props> = ({ initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outstock'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'simple' | 'variant'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string | number>>(new Set())
  const { openModal } = useModal()

  const DELETE_MODAL = 'products-dashboard-delete-confirm'

  const deleteProduct = async (id: string | number) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/web-products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    } catch {
      // silent — row stays in place
    } finally {
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      setPendingDeleteId(null)
    }
  }

  // ── Stock inline edit ───────────────────────────────────────────────────────
  const [editingStock, setEditingStock] = useState<{
    productId: string | number
    variantId?: string | null
    qty: string
    inStock: boolean
  } | null>(null)
  const [savingStock, setSavingStock] = useState(false)

  const startEditStock = (
    productId: string | number,
    qty: number | null,
    inStock: boolean,
    variantId?: string | null,
  ) => {
    setEditingStock({ productId, variantId: variantId ?? null, qty: String(qty ?? 0), inStock })
  }

  const saveStock = async () => {
    if (!editingStock) return
    setSavingStock(true)
    const { productId, variantId, qty, inStock } = editingStock
    try {
      let body: Record<string, any>
      if (variantId) {
        const product = products.find((p) => p.id === productId)
        const updatedVariants = (product?.variants ?? []).map((v) =>
          v.id === variantId
            ? { ...v, variantStockQuantity: Number(qty), variantInStock: inStock }
            : v,
        )
        body = { variants: updatedVariants }
      } else {
        body = { stockQuantity: Number(qty), inStock }
      }
      const res = await fetch(`/api/web-products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setProducts((prev) => prev.map((p) => {
        if (p.id !== productId) return p
        if (variantId) {
          return {
            ...p,
            variants: (p.variants ?? []).map((v) =>
              v.id === variantId
                ? { ...v, variantStockQuantity: Number(qty), variantInStock: inStock }
                : v,
            ),
          }
        }
        return { ...p, stockQuantity: Number(qty), inStock }
      }))
    } catch { /* silent */ } finally {
      setSavingStock(false)
      setEditingStock(null)
    }
  }

  const handleDeleteClick = (id: string | number) => {
    setPendingDeleteId(id)
    openModal(DELETE_MODAL)
  }

  const handleDeleteSelected = () => {
    setPendingDeleteId(null) // null = bulk
    openModal(DELETE_MODAL)
  }

  const handleConfirm = async () => {
    if (pendingDeleteId != null) {
      await deleteProduct(pendingDeleteId)
    } else {
      await Promise.all(Array.from(selectedIds).map((id) => deleteProduct(id)))
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        const hit =
          p.name.toLowerCase().includes(q) ||
          (p.tagline ?? '').toLowerCase().includes(q) ||
          (p.slug ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      if (typeFilter === 'simple' && p.hasVariantOptions) return false
      if (typeFilter === 'variant' && !p.hasVariantOptions) return false
      if (statusFilter === 'published' && p._status !== 'published') return false
      if (statusFilter === 'draft' && p._status === 'published') return false
      if (stockFilter === 'instock') {
        if (p.hasVariantOptions) { if (!(p.variants ?? []).some((v) => v.variantInStock)) return false }
        else { if (!p.inStock) return false }
      }
      if (stockFilter === 'outstock') {
        if (p.hasVariantOptions) { if ((p.variants ?? []).some((v) => v.variantInStock)) return false }
        else { if (p.inStock) return false }
      }
      return true
    })

    list = [...list].sort((a, b) => {
      let av: string | number, bv: string | number
      switch (sortKey) {
        case 'name':         av = a.name;                                    bv = b.name; break
        case 'stockQuantity':av = a.stockQuantity ?? -1;                     bv = b.stockQuantity ?? -1; break
        case 'regularPrice': av = a.regularPrice ?? -1;                      bv = b.regularPrice ?? -1; break
        case 'inStock':      av = a.inStock ? 1 : 0;                         bv = b.inStock ? 1 : 0; break
        case 'slug':         av = a.slug ?? '';                              bv = b.slug ?? ''; break
        case 'categories':   av = (a.categories as any)?.name ?? '';         bv = (b.categories as any)?.name ?? ''; break
        case 'updatedAt':    av = a.updatedAt ?? '';                         bv = b.updatedAt ?? ''; break
        default:             av = a.name;                                    bv = b.name
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [products, search, sortKey, sortDir, stockFilter, typeFilter, statusFilter])

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))
  const someSelected = filtered.some((p) => selectedIds.has(p.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((p) => p.id)))
  }
  const toggleOne = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const columns: { key: SortKey | null; label: string }[] = [
    { key: null,           label: '' },
    { key: 'name',         label: 'Product Name' },
    { key: 'regularPrice', label: 'Regular Price' },
    { key: 'inStock',      label: 'In Stock' },
    { key: 'stockQuantity',label: 'Stock Quantity' },
    { key: null,           label: 'Subscription' },
    { key: 'categories',   label: 'Categories' },
    { key: 'updatedAt',    label: 'Updated At' },
  ]

  return (
    <div
      style={{
        fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
        background: 'var(--theme-elevation-0)',
        color: 'var(--theme-text)',
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 13,
        width: '100%',
      }}
    >
      <style>{STYLES}</style>

      {/* ── Toolbar ── */}
      <div
        style={{
          padding: '8px 16px',
          background: 'var(--theme-elevation-50)',
          borderBottom: '1px solid var(--theme-elevation-100)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/* Title + count */}
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.1 }}>Store Products</span>
        <span
          style={{
            padding: '1px 8px',
            background: 'var(--theme-elevation-100)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 10,
            fontSize: 11,
            color: 'var(--theme-elevation-500)',
          }}
        >
          {filtered.length}
        </span>

        {selectedIds.size > 0 && (
          <>
            <span style={{ fontSize: 12, color: 'var(--theme-text)', marginLeft: 4 }}>
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '3px 10px',
                border: '1px solid #5a1a1a',
                background: '#2a0e0e',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              Delete Selected
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Add Product */}
        <Link
          href="/admin/collections/web-products/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            background: '#16a34a',
            border: '1px solid #15803d',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Product
        </Link>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', 'published', 'draft'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              style={{
                padding: '3px 10px',
                border: `1px solid ${statusFilter === k ? 'var(--theme-elevation-250)' : 'var(--theme-elevation-150)'}`,
                background: statusFilter === k ? 'var(--theme-elevation-100)' : 'transparent',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                color: statusFilter === k ? 'var(--theme-text)' : 'var(--theme-elevation-350)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {k === 'all' ? 'All Status' : k}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', 'simple', 'variant'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              style={{
                padding: '3px 10px',
                border: `1px solid ${typeFilter === k ? 'var(--theme-elevation-250)' : 'var(--theme-elevation-150)'}`,
                background: typeFilter === k ? 'var(--theme-elevation-100)' : 'transparent',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                color: typeFilter === k ? 'var(--theme-text)' : 'var(--theme-elevation-350)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {k === 'all' ? 'All Types' : k}
            </button>
          ))}
        </div>

        {/* Stock filter */}
        <div style={{ display: 'flex', gap: 3 }}>
          {([
            { k: 'all', label: 'All Stock' },
            { k: 'instock', label: 'In Stock' },
            { k: 'outstock', label: 'Out of Stock' },
          ] as const).map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setStockFilter(k)}
              style={{
                padding: '3px 10px',
                border: `1px solid ${stockFilter === k ? 'var(--theme-elevation-250)' : 'var(--theme-elevation-150)'}`,
                background: stockFilter === k ? 'var(--theme-elevation-100)' : 'transparent',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                color: stockFilter === k ? 'var(--theme-text)' : 'var(--theme-elevation-350)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 220 }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="var(--theme-elevation-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%',
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 4,
              padding: '6px 28px',
              color: 'var(--theme-text)',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--theme-elevation-250)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--theme-elevation-150)')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--theme-elevation-300)', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1,
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            alignItems: 'center',
            padding: '0 16px',
            background: 'var(--theme-elevation-0)',
            borderBottom: '1px solid var(--theme-elevation-100)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            minWidth: 900,
          }}
        >
          {/* Select-all checkbox */}
          <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
              style={{ cursor: 'pointer', accentColor: '#6b8aff' }}
            />
          </div>

          {columns.map((col, i) => (
            <div
              key={i}
              className={col.key ? 'spl-th' : ''}
              onClick={col.key ? () => handleSort(col.key!) : undefined}
              style={{
                padding: '10px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--theme-elevation-350)',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {col.label}
              {col.key && <SortIcon active={sortKey === col.key} dir={sortDir} />}
            </div>
          ))}
          {/* Actions header */}
          <div style={{ padding: '10px 8px', fontSize: 11, fontWeight: 600, color: 'var(--theme-elevation-350)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Actions
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--theme-elevation-250)', fontSize: 13 }}>
            No products found
          </div>
        )}

        {/* Product rows */}
        {filtered.map((product, rowIdx) => {
          const isSelected = selectedIds.has(product.id)
          const hasVariants = Boolean(product.hasVariantOptions) && (product.variants?.length ?? 0) > 0
          const variants = product.variants ?? []
          const catName = typeof product.categories === 'object' && product.categories
            ? ((product.categories as any).title ?? (product.categories as any).name) as string | undefined
            : undefined

          return (
            <React.Fragment key={product.id}>
              {/* ── Product row ── */}
              <div
                className={`spl-row${isSelected ? ' spl-selected' : ''}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  padding: '0 16px',
                  borderBottom: hasVariants ? 'none' : '1px solid var(--theme-elevation-100)',
                  background: isSelected ? '#111d2e' : rowIdx % 2 === 0 ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-50)',
                  minWidth: 900,
                }}
              >
                {/* Checkbox */}
                <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(product.id)}
                    style={{ cursor: 'pointer', accentColor: '#6b8aff' }}
                  />
                </div>

                {/* Image — uses full url, never thumbnailURL */}
                <div style={{ padding: '8px 8px 8px 0', display: 'flex', alignItems: 'center' }}>
                  {product.productImage?.url ? (
                    <img
                      src={product.productImage.url}
                      alt={product.name}
                      style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4, display: 'block', border: '1px solid var(--theme-elevation-100)' }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, background: 'var(--theme-elevation-100)', borderRadius: 4, border: '1px solid var(--theme-elevation-100)' }} />
                  )}
                </div>

                {/* Product Name */}
                <div style={{ padding: '10px 8px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={product._status} />
                  <a
                    href={`/admin/collections/web-products/${product.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="spl-link"
                    style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {product.name}
                  </a>
                  {hasVariants && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        border: '1px solid var(--theme-elevation-150)',
                        background: 'var(--theme-elevation-100)',
                        color: 'var(--theme-elevation-400)',
                      }}
                    >
                      {variants.length} variants
                    </span>
                  )}
                </div>

                {/* Regular Price */}
                <div style={{ padding: '10px 8px', color: 'var(--theme-elevation-600)' }}>
                  {hasVariants
                    ? <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>
                    : product.regularPrice != null
                      ? `AED ${Number(product.regularPrice).toFixed(2)}`
                      : noVal('Regular Price')}
                </div>

                {/* In Stock */}
                <div style={{ padding: '10px 8px' }}>
                  {hasVariants ? (
                    <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>
                  ) : editingStock?.productId === product.id && !editingStock.variantId ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingStock.inStock}
                        onChange={(e) => setEditingStock((s) => s ? { ...s, inStock: e.target.checked } : s)}
                        style={{ accentColor: '#6b8aff', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--theme-elevation-600)' }}>{editingStock.inStock ? 'In Stock' : 'Out'}</span>
                    </label>
                  ) : (
                    <BoolBadge value={Boolean(product.inStock)} />
                  )}
                </div>

                {/* Stock Quantity */}
                <div style={{ padding: '10px 8px', color: 'var(--theme-elevation-600)' }}>
                  {hasVariants ? (
                    <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>
                  ) : editingStock?.productId === product.id && !editingStock.variantId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        className="spl-qty-input"
                        value={editingStock.qty}
                        onChange={(e) => setEditingStock((s) => s ? { ...s, qty: e.target.value } : s)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveStock(); if (e.key === 'Escape') setEditingStock(null) }}
                        autoFocus
                      />
                      <button className="spl-save-btn" onClick={saveStock} disabled={savingStock}>{savingStock ? '…' : '✓'}</button>
                      <button className="spl-cancel-btn" onClick={() => setEditingStock(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>{product.stockQuantity != null ? product.stockQuantity : noVal('Stock Quantity')}</span>
                      <button
                        className="spl-edit-btn"
                        title="Edit stock"
                        onClick={() => startEditStock(product.id, product.stockQuantity ?? 0, Boolean(product.inStock))}
                      >✎</button>
                    </div>
                  )}
                </div>

                {/* Subscription */}
                <div style={{ padding: '10px 8px' }}>
                  {hasVariants
                    ? (variants.some((v) => v.hasVariantSub)
                        ? <span style={{ fontSize: 10, color: '#818cf8' }}>↻ See variants</span>
                        : <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>)
                    : product.hasSimpleSub
                      ? <SubBadge discount={product.subscriptionDiscount} freqs={product.subFreq} />
                      : <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>}
                </div>

                {/* Categories */}
                <div style={{ padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--theme-elevation-600)' }}>
                  {catName || noVal('Categories')}
                </div>

                {/* Updated At */}
                <div style={{ padding: '10px 8px', color: 'var(--theme-elevation-350)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtDate(product.updatedAt) || noVal('Updated At')}
                </div>

                {/* Actions */}
                <div style={{ padding: '10px 8px', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => handleDeleteClick(product.id)}
                    disabled={deletingIds.has(product.id)}
                    title="Delete product"
                    style={{
                      padding: '3px 8px', fontSize: 11,
                      background: 'transparent', border: '1px solid var(--theme-elevation-150)',
                      borderRadius: 3, color: 'var(--theme-elevation-350)', cursor: 'pointer',
                      lineHeight: 1, opacity: deletingIds.has(product.id) ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--theme-elevation-150)'; e.currentTarget.style.color = 'var(--theme-elevation-350)' }}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* ── Variant sub-rows ── */}
              {hasVariants && variants.map((variant, vIdx) => {
                const isLastVariant = vIdx === variants.length - 1
                const varBg = rowIdx % 2 === 0 ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-50)'
                return (
                  <div
                    key={variant.id ?? vIdx}
                    className="spl-var-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID_VAR,
                      alignItems: 'center',
                      padding: '0 16px',
                      borderTop: '1px solid var(--theme-elevation-100)',
                      borderBottom: isLastVariant ? '2px solid var(--theme-elevation-150)' : 'none',
                      borderLeft: '3px solid var(--theme-elevation-150)',
                      background: varBg,
                      minWidth: 900,
                    }}
                  >
                    {/* Checkbox placeholder */}
                    <div />

                    {/* Variant image with ↳ indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px 6px 0' }}>
                      <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11, flexShrink: 0 }}>↳</span>
                      {variant.variantImage?.url ? (
                        <img
                          src={variant.variantImage.url}
                          alt={variant.variantName}
                          style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 3, display: 'block', border: '1px solid var(--theme-elevation-100)' }}
                        />
                      ) : (
                        <div style={{ width: 32, height: 32, background: 'var(--theme-elevation-100)', borderRadius: 3, border: '1px solid var(--theme-elevation-100)', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Variant name */}
                    <div style={{ padding: '7px 8px', display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--theme-elevation-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {variant.variantName}g
                      </span>
                    </div>

                    {/* Regular Price */}
                    <div style={{ padding: '7px 8px', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
                      {variant.variantRegularPrice != null
                        ? `AED ${Number(variant.variantRegularPrice).toFixed(2)}`
                        : noVal('Regular Price')}
                    </div>

                    {/* In Stock */}
                    <div style={{ padding: '7px 8px' }}>
                      {editingStock?.productId === product.id && editingStock.variantId === variant.id ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editingStock.inStock}
                            onChange={(e) => setEditingStock((s) => s ? { ...s, inStock: e.target.checked } : s)}
                            style={{ accentColor: '#6b8aff', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 11, color: 'var(--theme-elevation-600)' }}>{editingStock.inStock ? 'In Stock' : 'Out'}</span>
                        </label>
                      ) : (
                        <BoolBadge value={Boolean(variant.variantInStock)} />
                      )}
                    </div>

                    {/* Stock Qty */}
                    <div style={{ padding: '7px 8px', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
                      {editingStock?.productId === product.id && editingStock.variantId === variant.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min={0}
                            className="spl-qty-input"
                            value={editingStock.qty}
                            onChange={(e) => setEditingStock((s) => s ? { ...s, qty: e.target.value } : s)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveStock(); if (e.key === 'Escape') setEditingStock(null) }}
                            autoFocus
                          />
                          <button className="spl-save-btn" onClick={saveStock} disabled={savingStock}>{savingStock ? '…' : '✓'}</button>
                          <button className="spl-cancel-btn" onClick={() => setEditingStock(null)}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>{variant.variantStockQuantity != null ? variant.variantStockQuantity : noVal('Stock Quantity')}</span>
                          <button
                            className="spl-edit-btn"
                            title="Edit stock"
                            onClick={() => startEditStock(product.id, variant.variantStockQuantity ?? 0, Boolean(variant.variantInStock), variant.id)}
                          >✎</button>
                        </div>
                      )}
                    </div>

                    {/* Subscription */}
                    <div style={{ padding: '7px 8px' }}>
                      {variant.hasVariantSub
                        ? <SubBadge discount={variant.subscriptionDiscount} freqs={variant.subFreq} />
                        : <span style={{ color: 'var(--theme-elevation-250)', fontSize: 11 }}>—</span>}
                    </div>

                    {/* Categories, Updated, Actions — empty for variants */}
                    <div />
                    <div />
                    <div />
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>

      <ConfirmationModal
        modalSlug={DELETE_MODAL}
        heading={pendingDeleteId != null ? 'Delete Product' : `Delete ${selectedIds.size} Products`}
        body={
          pendingDeleteId != null
            ? `Are you sure you want to permanently delete "${products.find((p) => p.id === pendingDeleteId)?.name}"? This cannot be undone.`
            : `Are you sure you want to permanently delete ${selectedIds.size} selected product${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
        }
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
        onConfirm={handleConfirm}
      />
    </div>
  )
}
