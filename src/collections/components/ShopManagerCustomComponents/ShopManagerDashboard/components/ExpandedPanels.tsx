'use client'
import React from 'react'
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
    </div>
  </div>
)
