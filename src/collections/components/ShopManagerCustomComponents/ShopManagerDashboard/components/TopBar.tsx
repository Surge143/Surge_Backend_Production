'use client'
import React from 'react'
import { C } from '../constants'
import { SearchIcon, CoffeeIcon, ActionBtn, PanelBtn } from './UIAtoms'

interface TopBarProps {
  storeStatus: 'live' | 'paused' | 'emergency'
  counts: { new: number; prep: number; ready: number }
  cancelledCount: number
  search: string
  onSearch: (v: string) => void
  rightPanel: string | null
  onPanelToggle: (panel: string) => void
  onGoLive: () => void
  onPause: () => void
  onEmergency: () => void
  shopName?: string
}

export const TopBar: React.FC<TopBarProps> = ({
  storeStatus,
  counts,
  cancelledCount,
  search,
  onSearch,
  rightPanel,
  onPanelToggle,
  onGoLive,
  onPause,
  onEmergency,
  shopName,
}) => {
  const statusColor = { live: C.live, paused: C.paused, emergency: C.emergency }[storeStatus]
  const statusBg = { live: '#f0fdf4', paused: '#fffbeb', emergency: '#fef2f2' }[storeStatus]
  const statusBorder = { live: '#bbf7d0', paused: '#fde68a', emergency: '#fecaca' }[storeStatus]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
        <div
          style={{
            width: 30,
            height: 30,
            background: C.prep,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CoffeeIcon />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
            {shopName || 'White Mantis'}
          </div>
          <div style={{ fontSize: 10, color: C.textMute }}>Shop Dashboard</div>
        </div>
      </div>

      {/* Store status chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: statusBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: 20,
          marginRight: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
            display: 'inline-block',
          }}
          className="blink"
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, letterSpacing: 0.5 }}>
          {storeStatus.toUpperCase()}
        </span>
      </div>

      {/* Count chips */}
      {[
        { key: 'new', label: 'New', color: C.new, bg: C.newBg, border: C.newBorder },
        { key: 'prep', label: 'Prep', color: C.prep, bg: C.prepBg, border: C.prepBorder },
        { key: 'ready', label: 'Ready', color: C.ready, bg: C.readyBg, border: C.readyBorder },
      ].map((s) => (
        <div
          key={s.key}
          style={{
            padding: '3px 10px',
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            color: s.color,
          }}
        >
          {s.label} {counts[s.key as keyof typeof counts]}
        </div>
      ))}
      {cancelledCount > 0 && (
        <div
          style={{
            padding: '3px 10px',
            background: C.cancelBg,
            border: `1px solid ${C.cancelBorder}`,
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            color: C.cancelled,
          }}
        >
          Cancelled {cancelledCount}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 260, marginLeft: 4 }}>
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

      {/* Panel toggles */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        <PanelBtn
          label="Slots"
          active={rightPanel === 'slots'}
          c={C.ready}
          onClick={() => onPanelToggle('slots')}
        />
        <PanelBtn
          label="Staff"
          active={rightPanel === 'baristas'}
          c="#7c3aed"
          onClick={() => onPanelToggle('baristas')}
        />
      </div>

      <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />

      {/* Store controls */}
      <div style={{ display: 'flex', gap: 4 }}>
        {storeStatus !== 'live' && <ActionBtn label="Go Live" c={C.live} onClick={onGoLive} />}
        {storeStatus === 'live' && <ActionBtn label="Pause" c={C.paused} onClick={onPause} />}
        {storeStatus !== 'emergency' && (
          <ActionBtn label="Emergency" c={C.emergency} onClick={onEmergency} danger />
        )}
        {storeStatus === 'emergency' && <ActionBtn label="Resume" c={C.live} onClick={onGoLive} />}
      </div>
    </div>
  )
}
