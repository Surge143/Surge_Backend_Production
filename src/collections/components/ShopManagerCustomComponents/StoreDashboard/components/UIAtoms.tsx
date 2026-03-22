'use client'
import React, { useState } from 'react'
import { C } from '../constants'

// ── ICON PRIMITIVES ──────────────────────────────────────────────────────────
export const SearchIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <circle cx={11} cy={11} r={8} />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

export const StoreIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

// ── TAG / BADGE ───────────────────────────────────────────────────────────────
export const Tag: React.FC<{ children: React.ReactNode; c: string; bg: string }> = ({
  children,
  c,
  bg,
}) => (
  <span
    style={{
      padding: '2px 7px',
      background: bg,
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 600,
      color: c,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
)

// ── BUTTON ATOMS ──────────────────────────────────────────────────────────────
export const ABtn: React.FC<{
  label: string
  c: string
  onClick: () => void
  disabled?: boolean
}> = ({ label, c, onClick, disabled }) => {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={disabled}
      style={{
        padding: '5px 12px',
        background: h && !disabled ? c : c + '18',
        border: `1px solid ${c}`,
        borderRadius: 6,
        color: h && !disabled ? '#fff' : c,
        fontSize: 11,
        fontWeight: 600,
        transition: 'all .12s',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

export const FullBtn: React.FC<{
  label: string
  c: string
  cBg?: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
}> = ({ label, c, cBg, onClick, loading, disabled }) => {
  const [h, setH] = useState(false)
  const isDisabled = loading || disabled
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={isDisabled}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: h && !isDisabled ? c : cBg || c + '12',
        border: `1px solid ${c}`,
        borderRadius: 7,
        color: h && !isDisabled ? '#fff' : c,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'left',
        transition: 'all .12s',
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Updating…' : label}
    </button>
  )
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
export const Toast: React.FC<{ msg: string; type: string }> = ({ msg, type }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 20,
      right: 24,
      padding: '10px 20px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      zIndex: 9999,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,.18)',
      background:
        type === 'err' ? C.cancelled : type === 'warn' ? '#b45309' : C.new,
      color: '#fff',
      animation: 'std-slip .15s ease',
    }}
  >
    {msg}
  </div>
)
