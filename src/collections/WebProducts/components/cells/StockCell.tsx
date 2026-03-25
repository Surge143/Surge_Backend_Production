'use client'
import React from 'react'

interface Variant {
  variantInStock?: boolean | null
  variantStockQuantity?: number | null
}

interface Props {
  cellData?: boolean | null
  rowData?: {
    hasVariantOptions?: boolean | null
    variants?: Variant[] | null
    stockQuantity?: number | null
  }
}

const badge = (label: string, color: string, bg: string, border: string) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
)

export const StockCell: React.FC<Props> = ({ cellData, rowData }) => {
  const variants = rowData?.variants ?? []

  // ── Variant product ──────────────────────────────────────────────────────
  if (rowData?.hasVariantOptions && variants.length > 0) {
    const total = variants.reduce(
      (s, v) => s + (v.variantInStock ? (v.variantStockQuantity ?? 0) : 0),
      0,
    )
    const anyInStock = variants.some((v) => v.variantInStock)

    if (!anyInStock) return badge('All Out of Stock', '#ef4444', '#ef444415', '#ef444430')
    if (total <= 5) return badge(`Low · ${total} total`, '#f59e0b', '#f59e0b15', '#f59e0b30')
    return badge(`${total} in stock`, '#22c55e', '#22c55e15', '#22c55e30')
  }

  // ── Simple product ───────────────────────────────────────────────────────
  const inStock = Boolean(cellData)
  const qty = rowData?.stockQuantity ?? 0

  if (!inStock) return badge('Out of Stock', '#ef4444', '#ef444415', '#ef444430')
  if (qty <= 5) return badge(`Low · ${qty}`, '#f59e0b', '#f59e0b15', '#f59e0b30')
  return badge(`In Stock · ${qty}`, '#22c55e', '#22c55e15', '#22c55e30')
}
