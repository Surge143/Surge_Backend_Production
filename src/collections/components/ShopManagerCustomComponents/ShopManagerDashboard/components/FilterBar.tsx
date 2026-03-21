'use client'
import React from 'react'
import { C, FILTER_PRESETS } from '../constants'

interface FilterBarProps {
  filter: string
  onFilter: (f: string) => void
}

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilter }) => {
  const filterColors: Record<string, { c: string; bg: string; border: string }> = {
    all: { c: C.textSub, bg: 'transparent', border: C.border },
    takeaway: { c: C.takeaway, bg: C.takeawayBg, border: C.takeaway },
    'dine-in': { c: C.dineIn, bg: C.dineInBg, border: C.dineIn },
    delayed: { c: C.late, bg: C.lateBg, border: C.late },
    reward: { c: C.reward, bg: C.rewardBg, border: C.reward },
    fallback: { c: C.fallback, bg: C.fallbackBg, border: C.fallback },
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 20px',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      <span
        style={{ fontSize: 11, color: C.textMute, fontWeight: 500, marginRight: 4, flexShrink: 0 }}
      >
        Filter
      </span>
      {FILTER_PRESETS.map((f) => {
        const fc = filterColors[f.key] || filterColors.all
        const isActive = filter === f.key
        return (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            style={{
              padding: '4px 12px',
              background: isActive ? fc.bg : 'transparent',
              border: `1px solid ${isActive ? fc.border : C.border}`,
              borderRadius: 20,
              color: isActive ? fc.c : C.textSub,
              fontSize: 11,
              fontWeight: isActive ? 600 : 400,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all .12s',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        )
      })}
      {filter !== 'all' && (
        <button
          onClick={() => onFilter('all')}
          style={{
            marginLeft: 2,
            padding: '4px 10px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            color: C.textMute,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ✕ clear
        </button>
      )}
    </div>
  )
}
