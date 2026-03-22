'use client'
import React, { useRef, useState, useEffect } from 'react'
import { C } from '../constants'
import { SearchIcon, StoreIcon } from './UIAtoms'

interface TopBarProps {
  counts: { new: number; shipped: number; delivered: number }
  cancelledCount: number
  search: string
  onSearch: (v: string) => void
  shopName?: string
  isAdmin?: boolean
  allShops?: any[]
  currentShopId?: string | null
  onShopChange?: (shopId: string) => void
  shopSwitching?: boolean
}

export const TopBar: React.FC<TopBarProps> = ({
  counts,
  cancelledCount,
  search,
  onSearch,
  shopName,
  isAdmin = false,
  allShops = [],
  currentShopId,
  onShopChange,
  shopSwitching = false,
}) => {
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const canSwitch = isAdmin && allShops.length > 1 && !!onShopChange

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

  const chipData = [
    { key: 'new' as const, label: 'New', color: C.new, bg: C.newBg, border: C.newBorder },
    { key: 'shipped' as const, label: 'Shipped', color: C.shipped, bg: C.shipBg, border: C.shipBorder },
    { key: 'delivered' as const, label: 'Delivered', color: C.delivered, bg: C.doneBg, border: C.doneBorder },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>
                {shopSwitching ? 'Loading…' : shopName || 'White Mantis Store'}
              </span>
              {canSwitch && (
                <span style={{ fontSize: 10, color: C.textMute, lineHeight: 1 }}>
                  {dropOpen ? '▲' : '▼'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.textMute }}>
              {canSwitch ? 'tap to switch' : 'Store Dashboard'}
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
            <div
              style={{
                padding: '8px 12px 6px',
                fontSize: 10,
                fontWeight: 600,
                color: C.textMute,
                letterSpacing: 0.5,
              }}
            >
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div
        className="topbar-search"
        style={{ position: 'relative', maxWidth: 260, minWidth: 120 }}
      >
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
