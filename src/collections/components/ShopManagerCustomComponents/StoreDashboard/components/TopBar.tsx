'use client'
import React from 'react'
import { C } from '../constants'
import { SearchIcon, StoreIcon } from './UIAtoms'

interface TopBarProps {
  counts: { new: number; shipped: number }
  search: string
  onSearch: (v: string) => void
}

export const TopBar: React.FC<TopBarProps> = ({ counts, search, onSearch }) => {
  const chipData = [
    { key: 'new' as const, label: 'New', color: C.new, bg: C.newBg, border: C.newBorder },
    {
      key: 'shipped' as const,
      label: 'Shipped',
      color: C.shipped,
      bg: C.shipBg,
      border: C.shipBorder,
    },
  ]

  return (
    <div
      className="topbar"
      style={{
        padding: '10px 20px',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        minWidth: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
        <div
          style={{
            width: 30,
            height: 30,
            background: C.new,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <StoreIcon />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
            Store Dashboard
          </span>
        </div>
      </div>

      {/* Count chips */}
      {chipData.map((s) => (
        <div
          key={s.key}
          className="topbar-count-chip"
          style={{
            padding: '3px 10px',
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            color: s.color,
            flexShrink: 0,
          }}
        >
          {s.label} {counts[s.key]}
        </div>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div className="topbar-search" style={{ position: 'relative', maxWidth: 260, minWidth: 120 }}>
        <SearchIcon
          style={{
            position: 'absolute',
            left: 9,
            top: '50%',
            transform: 'translateY(-50%)',
            color: C.textMute,
          }}
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search order or customer…"
          style={{
            width: '100%',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '7px 10px 7px 30px',
            color: C.text,
            fontSize: 12,
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = C.new)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: C.textMute,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}