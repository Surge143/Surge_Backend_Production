'use client'
import React, { useRef, useState, useEffect } from 'react'
import { C } from '../constants'
import { SearchIcon, CoffeeIcon, ActionBtn, PanelBtn } from './UIAtoms'

interface TopBarProps {
  storeStatus: 'live' | 'paused' | 'emergency'
  counts: { new: number; queued: number; prep: number; ready: number }
  cancelledCount: number
  search: string
  onSearch: (v: string) => void
  rightPanel: string | null
  onPanelToggle: (panel: string) => void
  onGoLive: () => void
  onPause: () => void
  shopName?: string
  allShops?: any[]
  currentShopId?: string | null
  onShopChange?: (shopId: string) => void
  shopSwitching?: boolean
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
  shopName,

  allShops = [],
  currentShopId,
  onShopChange,
  shopSwitching = false,
}) => {
  const statusColor = { live: C.live, paused: C.paused, emergency: C.emergency }[storeStatus]
  const statusBg = { live: 'var(--smd-live-bg)', paused: 'var(--smd-paused-bg)', emergency: 'var(--smd-emergency-bg)' }[storeStatus]
  const statusBorder = { live: 'var(--smd-live-border)', paused: 'var(--smd-paused-border)', emergency: 'var(--smd-emergency-border)' }[storeStatus]

  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const canSwitch = allShops.length > 1 && !!onShopChange

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

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
      {/* Brand — clickable shop switcher for admins */}
      <div style={{ position: 'relative', marginRight: 4 }} ref={dropRef}>
        <div
          onClick={() => canSwitch && setDropOpen((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: canSwitch ? 'pointer' : 'default',
            padding: canSwitch ? '4px 8px 4px 4px' : undefined,
            borderRadius: 8,
            border: canSwitch ? `1px solid ${dropOpen ? C.new : 'transparent'}` : 'none',
            background: dropOpen ? C.newBg : 'transparent',
            transition: 'all .12s',
          }}
        >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
                {shopSwitching ? 'Loading…' : (shopName || 'White Mantis')}
              </span>
              {canSwitch && (
                <span style={{ fontSize: 10, color: C.textMute, lineHeight: 1 }}>
                  {dropOpen ? '▲' : '▼'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.textMute }}>
              {canSwitch ? 'tap to switch shop' : 'Shop Dashboard'}
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {dropOpen && canSwitch && (
          <div
            className="peekIn"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 999,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,.12)',
              minWidth: 220,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 600, color: C.textMute, letterSpacing: 0.5 }}>
              SELECT SHOP
            </div>
            {allShops.map((s: any) => {
              const id = String(s.id)
              const label = s.address?.street || s.name || `Shop ${id}`
              const isSelected = id === currentShopId
              return (
                <div
                  key={id}
                  className="hrow"
                  onClick={() => {
                    onShopChange!(id)
                    setDropOpen(false)
                  }}
                  style={{
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? C.new : C.text,
                    background: isSelected ? C.newBg : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  <span>{label}</span>
                  {isSelected && <span style={{ fontSize: 11, color: C.new }}>✓</span>}
                </div>
              )
            })}
          </div>
        )}
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

      {/* Count chips — hidden on tablet via .topbar-count-chip */}
      {[
        { key: 'new', label: 'New', color: C.new, bg: C.newBg, border: C.newBorder },
        { key: 'prep', label: 'Prep', color: C.prep, bg: C.prepBg, border: C.prepBorder },
        { key: 'ready', label: 'Ready', color: C.ready, bg: C.readyBg, border: C.readyBorder },
      ].map((s) => (
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
          {s.label} {counts[s.key as keyof typeof counts]}
        </div>
      ))}
      {cancelledCount > 0 && (
        <div
          className="topbar-count-chip"
          style={{
            padding: '3px 10px',
            background: C.cancelBg,
            border: `1px solid ${C.cancelBorder}`,
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            color: C.cancelled,
            flexShrink: 0,
          }}
        >
          Cancelled {cancelledCount}
        </div>
      )}

      {/* Search */}
      <div className="topbar-search" style={{ position: 'relative', flex: 1, maxWidth: 260, marginLeft: 4, minWidth: 120 }}>
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
      <div className="topbar-panels" style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
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
      <div className="topbar-controls" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {storeStatus !== 'live' && <ActionBtn label="Go Live" c={C.live} onClick={onGoLive} />}
        {storeStatus === 'live' && <ActionBtn label="Pause" c={C.paused} onClick={onPause} />}
      </div>
    </div>
  )
}
