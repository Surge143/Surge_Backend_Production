'use client'
import React from 'react'
import { C, SECTIONS } from '../constants'
import { ABtn } from './UIAtoms'

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
      {order.items.map((item: string, i: number) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            padding: '5px 0',
            borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            alignItems: 'center',
          }}
        >
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
          <span style={{ color: C.text, fontSize: 12, lineHeight: 1.4 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

interface CancelledSectionProps {
  cancelled: any[]
  baristas: any[]
  onRestore: (id: string) => void
}

export const CancelledSection: React.FC<CancelledSectionProps> = ({
  cancelled,
  baristas,
  onRestore,
}) => (
  <div>
    <div
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
      }}
    >
      <div
        style={{ width: 4, height: 16, background: C.cancelled, borderRadius: 2, flexShrink: 0 }}
      />
      <span style={{ fontWeight: 700, fontSize: 12, color: C.cancelled, letterSpacing: 0.5 }}>
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
      <span style={{ fontSize: 11, color: C.textMute, marginLeft: 4 }}>— today&apos;s session</span>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 68px 175px 140px 110px 1fr 140px 110px',
        padding: '6px 20px',
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {['ORDER', 'TIME', 'CUSTOMER', 'BARISTA', 'REF', 'ITEMS', 'REASON', 'ACTION'].map((h, i) => (
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
          className="crow"
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 68px 175px 140px 110px 1fr 140px 110px',
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
                <div style={{ color: C.takeaway, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
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
          <div style={{ fontSize: 11, color: C.cancelled, fontStyle: 'italic', paddingRight: 8 }}>
            {o.cancelReason || '—'}
          </div>
          <div>
            <ABtn label="Restore" c={C.ready} onClick={() => onRestore(o.id)} />
          </div>
        </div>
      )
    })}
  </div>
)
