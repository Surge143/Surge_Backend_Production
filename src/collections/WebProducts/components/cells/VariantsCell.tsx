'use client'
import React from 'react'

interface Variant {
  id?: string | null
  variantName: string
  variantRegularPrice: number
  variantSalePrice?: number | null
  variantInStock?: boolean | null
  variantStockQuantity?: number | null
}

interface Props {
  cellData?: Variant[] | null
  rowData?: {
    hasVariantOptions?: boolean | null
    variants?: Variant[] | null
  }
}

export const VariantsCell: React.FC<Props> = ({ cellData, rowData }) => {
  const variants: Variant[] = (cellData ?? rowData?.variants ?? []) as Variant[]

  if (!rowData?.hasVariantOptions || !variants.length) {
    return <span style={{ color: 'var(--theme-elevation-500, #555)', fontSize: 12 }}>—</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 340 }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 90px 90px 50px',
          gap: '0 8px',
          paddingBottom: 4,
          borderBottom: '1px solid var(--theme-elevation-150, #1e1e1e)',
          marginBottom: 2,
        }}
      >
        {['Variant', 'Price', 'Sale', 'Stock', 'Qty'].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: 'var(--theme-elevation-500, #555)',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Variant rows */}
      {variants.map((v, i) => {
        const inStock = Boolean(v.variantInStock)
        const qty = v.variantStockQuantity ?? 0
        const isLow = inStock && qty <= 5

        return (
          <div
            key={v.id ?? i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 90px 90px 50px',
              gap: '0 8px',
              alignItems: 'center',
              padding: '2px 0',
            }}
          >
            {/* Name */}
            <span
              style={{
                fontSize: 12,
                color: 'var(--theme-elevation-800, #ccc)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ color: 'var(--theme-elevation-400, #444)', fontSize: 11 }}>↳</span>
              {v.variantName}
            </span>

            {/* Regular price */}
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              AED {Number(v.variantRegularPrice).toFixed(2)}
            </span>

            {/* Sale price */}
            <span
              style={{
                fontSize: 12,
                color: v.variantSalePrice ? '#ef4444' : 'var(--theme-elevation-500, #555)',
              }}
            >
              {v.variantSalePrice ? `AED ${Number(v.variantSalePrice).toFixed(2)}` : '—'}
            </span>

            {/* Stock badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: !inStock ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e',
                background: !inStock ? '#ef444415' : isLow ? '#f59e0b15' : '#22c55e15',
                border: `1px solid ${!inStock ? '#ef444430' : isLow ? '#f59e0b30' : '#22c55e30'}`,
              }}
            >
              {!inStock ? 'Out' : isLow ? 'Low' : 'In'}
            </span>

            {/* Qty */}
            <span
              style={{
                fontSize: 12,
                color: !inStock
                  ? 'var(--theme-elevation-500, #555)'
                  : isLow
                    ? '#f59e0b'
                    : 'var(--theme-elevation-800, #ccc)',
              }}
            >
              {qty}
            </span>
          </div>
        )
      })}
    </div>
  )
}
