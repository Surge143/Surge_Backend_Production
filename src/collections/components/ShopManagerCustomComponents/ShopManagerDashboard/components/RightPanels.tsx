'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { SPill } from './UIAtoms'

interface SlotsPanelProps {
  slots: any[]
  onAct: (slotId: string, action: string) => void
}

export const SlotsPanel: React.FC<SlotsPanelProps> = ({ slots, onAct }) => (
  <div>
    <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10, lineHeight: 1.6 }}>
      Takeaway slots — manage capacity and availability.
    </div>
    {slots.length === 0 && (
      <div style={{ padding: '24px', textAlign: 'center', color: C.textFaint, fontSize: 12 }}>
        No slots configured.
      </div>
    )}
    {slots.map((s) => {
      const pct = s.maxCapacity > 0 ? s.currentLoad / s.maxCapacity : 0
      const barColor = pct >= 1 ? C.cancelled : pct >= 0.7 ? C.paused : C.ready
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
          ? 'Now'
          : '—'

      return (
        <div
          key={s.id}
          style={{
            marginBottom: 8,
            padding: '10px 12px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            opacity: !isActive ? 0.55 : 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>{slotLabel}</span>
            <span
              style={{
                padding: '2px 8px',
                background: stateBg,
                border: `1px solid ${(stateColor || C.textMute) + '44'}`,
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 600,
                color: stateColor,
              }}
            >
              {state}
            </span>
          </div>
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
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {isActive && (
              <SPill label="Disable" c={C.cancelled} onClick={() => onAct(s.id, 'disable')} />
            )}
            {!isActive && (
              <SPill label="Enable" c={C.ready} onClick={() => onAct(s.id, 'enable')} />
            )}
            {isActive && (
              <SPill label="−2 cap" c={C.textSub} onClick={() => onAct(s.id, 'reduce')} />
            )}
            {isActive && (
              <SPill label="+2 cap" c={C.auto} onClick={() => onAct(s.id, 'increase')} />
            )}
          </div>
        </div>
      )
    })}
  </div>
)

interface BaristasProps {
  baristas: any[]
  orders: any[]
}

export const BaristasPanel: React.FC<BaristasProps> = ({ baristas, orders }) => (
  <div>
    {baristas.length === 0 && (
      <div style={{ padding: '24px', textAlign: 'center', color: C.textFaint, fontSize: 12 }}>
        No baristas found.
      </div>
    )}
    {baristas.map((b) => {
      const bOrders = orders.filter((o) => String(o.baristaId) === String(b.id))
      return (
        <div
          key={b.id}
          style={{
            marginBottom: 8,
            padding: '12px',
            background: C.bg,
            border: `1px solid ${C.readyBorder}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: C.ready, fontWeight: 600 }}>
                active
              </div>
            </div>
            <span
              style={{
                padding: '3px 10px',
                background: C.readyBg,
                border: `1px solid ${C.readyBorder}`,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: C.ready,
              }}
            >
              {bOrders.length} orders
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Active Orders', bOrders.filter((o) => o.status !== 'ready').length, C.new],
              ['Ready', bOrders.filter((o) => o.status === 'ready').length, C.ready],
            ].map(([l, v, color]) => (
              <div
                key={String(l)}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: String(color), lineHeight: 1 }}>
                  {v}
                </div>
                <div style={{ fontSize: 10, color: C.textMute, marginTop: 3, fontWeight: 500 }}>
                  {l}
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
          {[
            ['Active baristas', baristas.length],
            ['Total live orders', orders.length],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ fontSize: 12 }}>
              <span style={{ color: C.textMute }}>{l} </span>
              <span style={{ color: C.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)
