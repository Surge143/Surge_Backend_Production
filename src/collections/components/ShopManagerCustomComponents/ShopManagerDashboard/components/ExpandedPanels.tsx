'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { ColLabel, AlertBox, FullBtn } from './UIAtoms'

interface NewOrderPanelProps {
  order: any
  sectionColor: string
  sectionBg: string
  baristas: any[]
  selectedBaristaId?: string
  onBaristaChange: (id: string) => void
  onAccept: () => void
  onReject: () => void
  loading?: boolean
}

export const NewOrderExpandedPanel: React.FC<NewOrderPanelProps> = ({
  order,
  sectionColor,
  sectionBg,
  baristas,
  selectedBaristaId,
  onBaristaChange,
  onAccept,
  onReject,
  loading,
}) => (
  <div
    className="slip"
    style={{
      background: C.bg,
      borderBottom: `2px solid ${sectionColor}`,
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      borderLeft: `3px solid ${sectionColor}`,
    }}
  >
    <div style={{ padding: '16px 20px', borderRight: `1px solid ${C.border}` }}>
      <ColLabel>Order Items</ColLabel>
      {order.items.map((item: any, i: number) => {
        const isObj = typeof item === 'object' && item !== null
        const name = isObj ? `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}` : item
        const customs: any[] = isObj ? (item.customs || []) : []
        return (
          <div
            key={i}
            style={{
              padding: '8px 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: sectionColor,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{name}</div>
                {customs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                    {customs.map((c: any, ci: number) => (
                      <span
                        key={ci}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          background: C.surface,
                          border: `1px solid ${C.borderMid}`,
                          borderRadius: 6,
                          color: C.textSub,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: C.textMute, fontWeight: 400 }}>{c.sectionTitle}:</span>{' '}
                        {c.label}
                        {c.price > 0 && (
                          <span style={{ color: C.prep, marginLeft: 3, fontWeight: 600 }}>+{c.price}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      {order.reward && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.reward, fontWeight: 500 }}>
          ★ This is a reward order
        </div>
      )}
      {order.raw?.specialInstructions && (
        <AlertBox c={C.auto} bg={C.autoBg}>
          📝 {order.raw.specialInstructions}
        </AlertBox>
      )}
    </div>
    <div style={{ padding: '16px 20px' }}>
      <ColLabel>Assign &amp; Accept</ColLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, color: C.textMute, fontWeight: 500 }}>Assign Barista</label>
        <select
          value={selectedBaristaId || ''}
          onChange={(e) => onBaristaChange(e.target.value)}
          style={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${!selectedBaristaId ? C.cancelled : C.border}`,
            borderRadius: 7,
            padding: '8px',
            color: selectedBaristaId ? C.textSub : C.cancelled,
            fontSize: 12,
            outline: 'none',
            marginBottom: 4,
          }}
        >
          <option value="">Select barista…</option>
          {baristas.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.name}
            </option>
          ))}
        </select>
        {!selectedBaristaId && (
          <div style={{ fontSize: 11, color: C.cancelled, fontWeight: 500, marginTop: -2 }}>
            ⚠ Select a barista to accept this order
          </div>
        )}
        <FullBtn
          label={loading ? 'Accepting…' : '✓ Accept Order'}
          c={selectedBaristaId ? C.ready : C.textMute}
          cBg={selectedBaristaId ? C.readyBg : C.bg}
          onClick={selectedBaristaId ? onAccept : undefined}
          loading={loading}
          disabled={!selectedBaristaId}
        />
        <FullBtn
          label={loading ? 'Rejecting…' : '✕ Reject Order'}
          c={C.cancelled}
          cBg={C.cancelBg}
          onClick={onReject}
          loading={loading}
        />
      </div>
    </div>
  </div>
)

interface ExpandedPanelProps {
  order: any
  sectionColor: string
  sectionBg: string
  advLabel: string
  advColor: string
  onAdvance: () => void
  loading?: boolean
}

export const OrderExpandedPanel: React.FC<ExpandedPanelProps> = ({
  order,
  sectionColor,
  sectionBg,
  advLabel,
  advColor,
  onAdvance,
  loading,
}) => (
  <div
    className="slip"
    style={{
      background: C.bg,
      borderBottom: `2px solid ${sectionColor}`,
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      borderLeft: `3px solid ${sectionColor}`,
    }}
  >
    <div style={{ padding: '16px 20px', borderRight: `1px solid ${C.border}` }}>
      <ColLabel>Order Items</ColLabel>
      {order.items.map((item: any, i: number) => {
        const isObj = typeof item === 'object' && item !== null
        const name = isObj ? `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}` : item
        const customs: any[] = isObj ? (item.customs || []) : []
        return (
          <div
            key={i}
            style={{
              padding: '8px 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: sectionColor,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{name}</div>
                {customs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                    {customs.map((c: any, ci: number) => (
                      <span
                        key={ci}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          background: C.surface,
                          border: `1px solid ${C.borderMid}`,
                          borderRadius: 6,
                          color: C.textSub,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: C.textMute, fontWeight: 400 }}>{c.sectionTitle}:</span>{' '}
                        {c.label}
                        {c.price > 0 && (
                          <span style={{ color: C.prep, marginLeft: 3, fontWeight: 600 }}>+{c.price}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      {order.delayed && (
        <AlertBox c={C.late} bg={C.lateBg}>
          ⚠ This order is delayed
        </AlertBox>
      )}
      {order.reward && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.reward, fontWeight: 500 }}>
          ★ Reward order
        </div>
      )}
      {order.raw?.specialInstructions && (
        <AlertBox c={C.auto} bg={C.autoBg}>
          📝 {order.raw.specialInstructions}
        </AlertBox>
      )}
    </div>
    <div style={{ padding: '16px 20px' }}>
      <ColLabel>Actions</ColLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FullBtn
          label={loading ? 'Updating…' : advLabel}
          c={advColor}
          cBg={sectionBg}
          onClick={onAdvance}
          loading={loading}
        />
      </div>
    </div>
  </div>
)
