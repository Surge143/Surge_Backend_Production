'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { SPill } from './UIAtoms'

interface SlotsPanelProps {
  slots: any[]
  orders: any[]
  onAct: (slotId: string, action: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Pending',
  queued: 'Queued',
  prep: 'Preparing',
  ready: 'Ready',
}

const STATUS_COLOR: Record<string, string> = {
  new: C.new,
  queued: C.queued,
  prep: C.prep,
  ready: C.ready,
}

export const SlotsPanel: React.FC<SlotsPanelProps> = ({ slots, orders, onAct }) => {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  return (
    <div>
      <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10, lineHeight: 1.6 }}>
        Takeaway slots — manage capacity and availability.
      </div>
      {slots.filter((s) => s.timeSelection !== 'now').length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: C.textFaint, fontSize: 12 }}>
          No slots configured.
        </div>
      )}
      {slots.filter((s) => s.timeSelection !== 'now').map((s) => {
        const pct = s.maxCapacity > 0 ? s.currentLoad / s.maxCapacity : 0
        const barColor = pct >= 1 ? C.cancelled : pct >= 0.7 ? C.prep : C.ready
        const isActive = s.isActive !== false
        const state = !isActive ? 'Disabled' : pct >= 1 ? 'Full' : 'Open'
        const stateColor = { Open: C.ready, Full: C.cancelled, Disabled: C.textMute }[state]!
        const stateBg = { Open: C.readyBg, Full: C.cancelBg, Disabled: C.bg }[state]!

        const slotLabel = s.slot
          ? new Date(s.slot).toLocaleTimeString('en-AE', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : s.timeSelection === 'now'
            ? 'Immediate'
            : '—'

        // All orders assigned to this slot
        const slotOrders = orders.filter((o) => String(o.slotId) === String(s.id))
        const isExpanded = expandedSlot === String(s.id)

        return (
          <div
            key={s.id}
            style={{
              marginBottom: 8,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              opacity: !isActive ? 0.55 : 1,
              overflow: 'hidden',
            }}
          >
            {/* ── Slot header ── */}
            <div style={{ padding: '10px 12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{slotLabel}</span>
                  {slotOrders.length > 0 && (
                    <span
                      style={{
                        padding: '1px 7px',
                        background: C.prepBg,
                        border: `1px solid ${C.prepBorder}`,
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.prep,
                      }}
                    >
                      {slotOrders.length} active
                    </span>
                  )}
                </div>
                <span
                  onClick={() => slotOrders.length > 0 && setExpandedSlot(isExpanded ? null : String(s.id))}
                  style={{
                    padding: '2px 8px',
                    background: stateBg,
                    border: `1px solid ${state === 'Disabled' ? C.border : stateColor}`,
                    opacity: state === 'Disabled' ? 0.6 : 1,
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    color: stateColor,
                    cursor: slotOrders.length > 0 ? 'pointer' : 'default',
                  }}
                >
                  {state}
                </span>
              </div>

              {/* Capacity bar */}
              <div
                style={{
                  height: 5,
                  background: C.border,
                  borderRadius: 3,
                  marginBottom: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(pct * 100, 100)}%`,
                    background: barColor,
                    borderRadius: 3,
                    transition: 'width .3s',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: C.textMute, marginBottom: 8 }}>
                {s.currentLoad || 0} / {s.maxCapacity} booked
              </div>

              {/* Action pills */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {isActive && (
                  <SPill label="Disable" c={C.cancelled} onClick={() => onAct(s.id, 'disable')} />
                )}
                {!isActive && (
                  <SPill label="Enable" c={C.ready} onClick={() => onAct(s.id, 'enable')} />
                )}
              </div>
            </div>

            {/* ── Expanded orders list ── */}
            {isExpanded && (
              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {slotOrders.map((o) => {
                  const statusColor = STATUS_COLOR[o.status] ?? C.textMute
                  const statusLabel = STATUS_LABEL[o.status] ?? o.status
                  return (
                    <div
                      key={o.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '7px 10px',
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{o.no}</div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textMute,
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 130,
                          }}
                        >
                          {o.customer}
                        </div>
                        <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>
                          {o.time} · {o.type}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: `${statusColor}18`,
                          border: `1px solid ${statusColor}55`,
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 600,
                          color: statusColor,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface BaristasProps {
  baristas: any[]
  orders: any[]
}

export const BaristasPanel: React.FC<BaristasProps> = ({ baristas, orders }) => (
  <div>
    <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10, lineHeight: 1.6 }}>
      Live order load per barista — pending &amp; preparing only.
    </div>
    {baristas.length === 0 && (
      <div style={{ padding: '24px', textAlign: 'center', color: C.textFaint, fontSize: 12 }}>
        No baristas found.
      </div>
    )}
    {baristas.map((b) => {
      const bOrders = orders.filter((o) => String(o.baristaId) === String(b.id))
      const pendingCount  = bOrders.filter((o) => o.status === 'new' || o.status === 'queued').length
      const preparingCount = bOrders.filter((o) => o.status === 'prep').length
      const readyCount    = bOrders.filter((o) => o.status === 'ready').length
      const activeLoad    = pendingCount + preparingCount

      // Badge colour: red if heavy load, amber if moderate, green if light
      const loadColor  = activeLoad >= 5 ? C.cancelled : activeLoad >= 3 ? C.prep : C.ready
      const loadBg     = activeLoad >= 5 ? C.cancelBg  : activeLoad >= 3 ? C.prepBg : C.readyBg
      const loadBorder = activeLoad >= 5 ? C.cancelBorder : activeLoad >= 3 ? C.prepBorder : C.readyBorder

      return (
        <div
          key={b.id}
          style={{
            marginBottom: 8,
            padding: '12px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
            <span
              style={{
                padding: '3px 10px',
                background: loadBg,
                border: `1px solid ${loadBorder}`,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: loadColor,
              }}
            >
              {activeLoad} active
            </span>
          </div>

          {/* 3-stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {([
              ['Pending', pendingCount,  C.queued,    C.queuedBg,  C.queuedBorder],
              ['Preparing', preparingCount, C.prep,   C.prepBg,    C.prepBorder],
              ['Ready',    readyCount,   C.ready,     C.readyBg,   C.readyBorder],
            ] as const).map(([label, count, color, bg, border]) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: 9, color: C.textMute, marginTop: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })}

    {baristas.length > 0 && (
      <div
        style={{
          marginTop: 4,
          padding: '10px 12px',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 11, color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
          SHIFT TOTALS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {([
            ['Baristas', baristas.length],
            ['Pending',  orders.filter((o) => o.status === 'new' || o.status === 'queued').length],
            ['Preparing', orders.filter((o) => o.status === 'prep').length],
            ['Ready',    orders.filter((o) => o.status === 'ready').length],
          ] as const).map(([l, v]) => (
            <div key={l} style={{ fontSize: 12 }}>
              <span style={{ color: C.textMute }}>{l} </span>
              <span style={{ color: C.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)
