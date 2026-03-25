'use client'
import React from 'react'

interface Variant {
  variantRegularPrice: number
  variantSalePrice?: number | null
}

interface Props {
  cellData?: number | null
  rowData?: {
    hasVariantOptions?: boolean | null
    variants?: Variant[] | null
  }
}

function variantPriceRange(variants: Variant[]): string {
  const prices = variants
    .map((v) => v.variantSalePrice ?? v.variantRegularPrice)
    .filter((p): p is number => p != null)
  if (!prices.length) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `AED ${min.toFixed(2)}`
  return `AED ${min.toFixed(2)} – ${max.toFixed(2)}`
}

export const PriceCell: React.FC<Props> = ({ cellData, rowData }) => {
  const variants = rowData?.variants ?? []

  if (rowData?.hasVariantOptions && variants.length > 0) {
    return (
      <span style={{ fontSize: 12, fontWeight: 500 }}>
        {variantPriceRange(variants)}
      </span>
    )
  }

  if (cellData == null) {
    return <span style={{ color: 'var(--theme-elevation-500, #555)', fontSize: 12 }}>—</span>
  }

  return (
    <span style={{ fontSize: 12, fontWeight: 500 }}>
      AED {Number(cellData).toFixed(2)}
    </span>
  )
}
