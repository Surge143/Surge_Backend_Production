'use client'
import React, { useState } from 'react'
import { C } from '../constants'

interface CancelledSectionProps {
  cancelled: any[]
}

export const CancelledSection: React.FC<CancelledSectionProps> = ({ cancelled }) => {
  const [expanded, setExpanded] = useState<string | null>(null)

  const statusChipColor = (status: string) => {
    if (status === 'refunded') return { c: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' }
    if (status === 'refund-initiated') return { c: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    return { c: C.cancelled, bg: C.cancelBg, border: C.cancelBorder }
  }

  return (
    <div>
      {/* Section header */}
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
          CANCELLED / REFUNDED
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

      {/* Column headers */}
      <div
        className="std-cancel-grid"
        style={{
          padding: '6px 20px',
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {['ORDER', 'TIME', 'CUSTOMER', 'TYPE', 'ITEMS', 'AMOUNT', 'STATUS'].map((h, i) => (
          <span
            key={i}
            style={{ fontSize: 10, color: C.textMute, letterSpacing: 0.8, fontWeight: 600 }}
          >
            {h}
          </span>
        ))}
      </div>

      {cancelled.length === 0 && (
        <div style={{ padding: '16px 20px', color: C.textMute, fontSize: 12 }}>
          — no cancellations this session —
        </div>
      )}

      {cancelled.map((o) => {
        const chip = statusChipColor(o.raw?.deliveryStatus || 'cancelled')
        const isOpen = expanded === o.id

        return (
          <div key={o.id}>
            <div
              className="crow std-cancel-grid"
              onClick={() => setExpanded((p) => (p === o.id ? null : o.id))}
              style={{
                alignItems: 'center',
                padding: '9px 20px',
                borderBottom: `1px solid ${C.cancelBorder}`,
                background: C.surface,
                opacity: 0.82,
                cursor: 'pointer',
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
              <div>
                <div style={{ color: C.textSub, fontSize: 13 }}>{o.customer}</div>
                {o.email && (
                  <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>{o.email}</div>
                )}
              </div>
              <div>
                {o.type === 'delivery' ? (
                  <span
                    style={{
                      padding: '2px 7px',
                      background: C.shipBg,
                      border: `1px solid ${C.shipBorder}`,
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.shipped,
                    }}
                  >
                    Delivery
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '2px 7px',
                      background: C.newBg,
                      border: `1px solid ${C.newBorder}`,
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.new,
                    }}
                  >
                    Pickup
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.textMute }}>
                {o.items.length} item{o.items.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.textSub }}>
                AED {Number(o.total).toFixed(2)}
              </div>
              <div>
                <span
                  style={{
                    padding: '2px 8px',
                    background: chip.bg,
                    border: `1px solid ${chip.border}`,
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    color: chip.c,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {o.raw?.deliveryStatus === 'refunded'
                    ? 'Refunded'
                    : o.raw?.deliveryStatus === 'refund-initiated'
                      ? 'Refund Initiated'
                      : 'Cancelled'}
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div
                className="slip"
                style={{
                  padding: '12px 24px 14px',
                  background: C.cancelBg,
                  borderBottom: `1px solid ${C.cancelBorder}`,
                  borderLeft: `3px solid ${C.cancelled}`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.textMute,
                        fontWeight: 600,
                        letterSpacing: 0.8,
                        marginBottom: 6,
                      }}
                    >
                      CUSTOMER
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{o.customer}</div>
                    {o.phone && (
                      <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{o.phone}</div>
                    )}
                    {o.address && (
                      <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>{o.address}</div>
                    )}
                    {o.raw?.refundReason && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: C.cancelled,
                          fontStyle: 'italic',
                        }}
                      >
                        Reason: {o.raw.refundReason}
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.textMute,
                        fontWeight: 600,
                        letterSpacing: 0.8,
                        marginBottom: 6,
                      }}
                    >
                      ITEMS
                    </div>
                    {o.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          padding: '3px 0',
                          borderBottom:
                            i < o.items.length - 1 ? `1px solid ${C.cancelBorder}` : 'none',
                        }}
                      >
                        <span>
                          {item.name}
                          {item.variant ? ` (${item.variant})` : ''} ×{item.qty}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          AED {Number(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: 8,
                        textAlign: 'right',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.cancelled,
                      }}
                    >
                      Total: AED {Number(o.total).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
