'use client'
import React from 'react'
import { C, SECTIONS } from '../constants'

interface PeekTooltipProps {
  order: any
  x: number
  y: number
}

export const PeekTooltip: React.FC<PeekTooltipProps> = ({ order, x, y }) => {
  const sec = SECTIONS.find((s) => s.key === order.status) || SECTIONS[0]
  return (
    <div
      className="peekIn"
      style={{
        position: 'fixed',
        top: y,
        left: Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 270),
        zIndex: 99,
        background: C.surface,
        border: `1px solid ${C.borderMid}`,
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 220,
        maxWidth: 280,
        boxShadow: '0 10px 40px rgba(0,0,0,.12)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: C.textMute,
          fontWeight: 600,
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        ORDER ITEMS · {order.no}
      </div>
      {order.items.map((item: any, i: number) => {
        const label =
          typeof item === 'string' ? item : `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}`
        const customs: any[] = typeof item === 'object' ? item.customs || [] : []
        return (
          <div
            key={i}
            style={{
              padding: '5px 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: sec.color,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>
                {label}
              </span>
            </div>
            {customs.length > 0 && (
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, paddingLeft: 28 }}
              >
                {customs.map((c: any, ci: number) => (
                  <span
                    key={ci}
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      color: C.textSub,
                    }}
                  >
                    {c.sectionTitle}: {c.label}
                    {c.price > 0 ? ` +${c.price}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface CancelledSectionProps {
  cancelled: any[]
  baristas: any[]
}

export const CancelledSection: React.FC<CancelledSectionProps> = ({ cancelled, baristas }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div>
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px 8px',
          background: C.cancelBg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${C.cancelBorder}`,
          borderTop: `1px solid ${C.cancelBorder}`,
          cursor: 'pointer',
        }}
      >
        <div
          style={{ width: 4, height: 16, background: C.cancelled, borderRadius: 2, flexShrink: 0 }}
        />
        <span
          style={{ fontWeight: 700, fontSize: 12, color: C.cancelled, letterSpacing: 0.5, flex: 1 }}
        >
          CANCELLED / REJECTED
        </span>
        <span
          style={{
            padding: '1px 8px',
            background: C.cancelled,
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {cancelled.length}
        </span>
        <span style={{ fontSize: 11, color: C.textMute, marginLeft: 4 }}>
          — today&apos;s session
        </span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: C.cancelled,
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            marginLeft: 8,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {!isCollapsed && (
        <>
          <div
            className="cancel-grid"
            style={{
              padding: '6px 20px',
              background: C.bg,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {['ORDER', 'TIME', 'CUSTOMER', 'BARISTA', 'REF', 'ITEMS', 'REASON'].map((h, i) => (
              <span
                key={i}
                style={{ fontSize: 10, color: C.textMute, letterSpacing: 0.8, fontWeight: 600 }}
              >
                {h}
              </span>
            ))}
          </div>

          {cancelled.length === 0 && (
            <div style={{ padding: '16px 20px', color: C.textFaint, fontSize: 12 }}>
              — no cancellations this session —
            </div>
          )}

          {cancelled.map((o) => {
            const b = baristas.find((x) => String(x.id) === String(o.baristaId))
            return (
              <div
                key={o.id}
                className="crow cancel-grid"
                style={{
                  alignItems: 'center',
                  padding: '9px 20px',
                  borderBottom: `1px solid ${C.cancelBorder}`,
                  background: C.surface,
                  opacity: 0.75,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: C.textMute,
                    fontSize: 13,
                    textDecoration: 'line-through',
                  }}
                >
                  {o.no}
                </div>
                <div style={{ color: C.textMute, fontSize: 12 }}>{o.time}</div>
                <div style={{ color: C.textSub, fontSize: 13 }}>{o.customer}</div>
                <div style={{ color: C.textMute, fontSize: 12 }}>{b?.name || '—'}</div>
                <div>
                  {o.type === 'takeaway' ? (
                    <>
                      <div style={{ fontSize: 10, color: C.textMute }}>SLOT</div>
                      <div
                        style={{ color: C.takeaway, fontSize: 13, fontWeight: 600, marginTop: 1 }}
                      >
                        {o.slot || 'Now'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 10, color: C.textMute }}>DINE-IN</div>
                      <div style={{ color: C.dineIn, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {o.no}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.textMute }}>
                  {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                </div>
                <div
                  style={{ fontSize: 11, color: C.cancelled, fontStyle: 'italic', paddingRight: 8 }}
                >
                  {o.cancelReason || '—'}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
