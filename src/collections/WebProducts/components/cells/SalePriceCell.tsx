'use client'
import React from 'react'

interface Props {
  cellData?: number | null
  rowData?: {
    hasVariantOptions?: boolean | null
  }
}

export const SalePriceCell: React.FC<Props> = ({ cellData, rowData }) => {
  // Variant products handle their own sale prices per-variant
  if (rowData?.hasVariantOptions) {
    return <span style={{ color: 'var(--theme-elevation-500, #555)', fontSize: 12 }}>—</span>
  }

  if (!cellData) {
    return <span style={{ color: 'var(--theme-elevation-500, #555)', fontSize: 12 }}>—</span>
  }

  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: '#ef4444' }}>
      AED {Number(cellData).toFixed(2)}
    </span>
  )
}
