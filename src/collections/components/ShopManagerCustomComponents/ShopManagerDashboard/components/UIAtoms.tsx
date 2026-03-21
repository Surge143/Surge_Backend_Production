'use client'
import React, { useState } from 'react'
import { C } from '../constants'

// ── ICON PRIMITIVES ─────────────────────────────────────────────────────────
export const EyeIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx={12} cy={12} r={3} />
  </svg>
)

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

export const CoffeeIcon = () => (
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
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>
)

// ── TAG / BADGE ──────────────────────────────────────────────────────────────
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

export const AssignTag: React.FC<{ assign: string }> = ({ assign }) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    selected: { label: 'Cust. Pick', color: C.custPick, bg: C.custPickBg },
    auto: { label: 'Auto', color: C.auto, bg: C.autoBg },
    fallback: { label: 'Fallback', color: C.fallback, bg: C.fallbackBg },
  }
  const m = map[assign] || map.auto
  return (
    <span
      style={{
        display: 'inline-block',
        marginTop: 3,
        padding: '1px 6px',
        background: m.bg,
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 600,
        color: m.color,
      }}
    >
      {m.label}
    </span>
  )
}

// ── BUTTON ATOMS ─────────────────────────────────────────────────────────────
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
        background: h && !disabled ? c : c + '15',
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

export const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 28,
        height: 28,
        background: h ? C.cancelBg : 'transparent',
        border: `1px solid ${h ? C.cancelBorder : C.border}`,
        borderRadius: 6,
        color: h ? C.cancelled : C.textMute,
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .12s',
      }}
    >
      ×
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
        background: h && !isDisabled ? c : cBg || c + '10',
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

export const PanelBtn: React.FC<{
  label: string
  active: boolean
  c: string
  onClick: () => void
}> = ({ label, active, c, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '5px 12px',
      background: active ? c + '15' : 'transparent',
      border: `1px solid ${active ? c : C.border}`,
      borderRadius: 6,
      color: active ? c : C.textSub,
      fontSize: 11,
      fontWeight: 500,
      transition: 'all .12s',
    }}
  >
    {label}
  </button>
)

export const ActionBtn: React.FC<{
  label: string
  c: string
  onClick: () => void
  danger?: boolean
}> = ({ label, c, onClick, danger }) => {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 12px',
        background: danger ? (h ? c : c + '15') : h ? c : c + '10',
        border: `1px solid ${c}`,
        borderRadius: 6,
        color: danger && !h ? '#fff' : h ? '#fff' : c,
        fontSize: 11,
        fontWeight: 600,
        transition: 'all .12s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export const SPill: React.FC<{ label: string; c: string; onClick: () => void }> = ({
  label,
  c,
  onClick,
}) => {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '3px 10px',
        background: h ? c + '15' : 'transparent',
        border: `1px solid ${c}55`,
        borderRadius: 20,
        color: c,
        fontSize: 10,
        fontWeight: 500,
        transition: 'background .1s',
      }}
    >
      {label}
    </button>
  )
}

// ── MISC LAYOUT ATOMS ────────────────────────────────────────────────────────
export const ColLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      color: C.textMute,
      fontWeight: 600,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 10,
    }}
  >
    {children}
  </div>
)

export const AlertBox: React.FC<{ children: React.ReactNode; c: string; bg: string }> = ({
  children,
  c,
  bg,
}) => (
  <div
    style={{
      marginTop: 10,
      padding: '8px 10px',
      background: bg,
      border: `1px solid ${c}44`,
      borderRadius: 7,
      fontSize: 12,
      color: c,
      fontWeight: 500,
    }}
  >
    {children}
  </div>
)

export const Toast: React.FC<{ msg: string; type: string }> = ({ msg, type }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '9px 20px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      zIndex: 100,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,.15)',
      background: type === 'err' ? C.cancelled : type === 'warn' ? C.paused : C.live,
      color: '#fff',
    }}
  >
    {msg}
  </div>
)
