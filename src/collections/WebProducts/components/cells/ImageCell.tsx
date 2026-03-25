'use client'
import React from 'react'

interface Props {
  cellData?: { url?: string; filename?: string } | number | null
}

export const ImageCell: React.FC<Props> = ({ cellData }) => {
  const url = typeof cellData === 'object' && cellData !== null ? (cellData as any).url : null

  if (!url) {
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          background: 'var(--theme-elevation-150, #1e1e1e)',
          border: '1px solid var(--theme-elevation-200, #2a2a2a)',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <img
      src={url}
      alt=""
      style={{
        width: 44,
        height: 44,
        objectFit: 'cover',
        borderRadius: 6,
        display: 'block',
        border: '1px solid var(--theme-elevation-200, #2a2a2a)',
        flexShrink: 0,
      }}
    />
  )
}
