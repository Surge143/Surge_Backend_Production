'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { ColLabel, AlertBox } from './UIAtoms'

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
      borderLeft: `3px solid ${sectionColor}`,
    }}
  >
    <div style={{ padding: '16px 20px' }}>
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
        <div style={{ marginTop: 14 }}>
          <ColLabel>Special Request</ColLabel>
          <AlertBox c={C.auto} bg={C.autoBg}>
            {order.raw.specialInstructions}
          </AlertBox>
        </div>
      )}
    </div>
  </div>
)

const CANCEL_REASONS = [
  'Customer requested cancellation',
  'Out of stock',
  'Item quality issue',
  'Payment issue',
  'Duplicate order',
  'Other',
]

interface ExpandedPanelProps {
  order: any
  sectionColor: string
  sectionBg: string
  advLabel: string
  advColor: string
  onAdvance: () => void
  onCancel?: (reason: string) => void
  loading?: boolean
}

export const OrderExpandedPanel: React.FC<ExpandedPanelProps> = ({
  order,
  sectionColor,
  sectionBg,
  advLabel,
  advColor,
  onAdvance,
  onCancel,
  loading,
}) => {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  return (
  <div
    className="slip"
    style={{
      background: C.bg,
      borderBottom: `2px solid ${sectionColor}`,
      borderLeft: `3px solid ${sectionColor}`,
    }}
  >
    <div style={{ padding: '16px 20px' }}>
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
        <div style={{ marginTop: 14 }}>
          <ColLabel>Special Request</ColLabel>
          <AlertBox c={C.auto} bg={C.autoBg}>
            {order.raw.specialInstructions}
          </AlertBox>
        </div>
      )}

      {/* Cancel order — shown for queued / slot-queue / prep / ready sections */}
      {onCancel && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          {!cancelOpen ? (
            <button
              onClick={() => setCancelOpen(true)}
              style={{
                padding: '5px 14px',
                background: 'none',
                border: `1px solid ${C.cancelled}`,
                borderRadius: 6,
                color: C.cancelled,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✕ Cancel Order
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: 0.4 }}>
                CANCEL REASON
              </div>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  padding: '6px 10px',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: cancelReason ? C.text : C.textMute,
                  fontSize: 12,
                  outline: 'none',
                  maxWidth: 280,
                }}
              >
                <option value="">Select a reason…</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { setCancelOpen(false); setCancelReason('') }}
                  style={{
                    padding: '5px 14px',
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    color: C.textMute,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  disabled={!cancelReason || loading}
                  onClick={() => {
                    if (!cancelReason) return
                    onCancel(cancelReason)
                    setCancelOpen(false)
                    setCancelReason('')
                  }}
                  style={{
                    padding: '5px 16px',
                    background: cancelReason ? C.cancelled : C.cancelled + '40',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: cancelReason && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? '…' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  )
}
