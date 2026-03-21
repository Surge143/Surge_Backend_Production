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
      {order.items.map((item: string, i: number) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '7px 0',
            borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            alignItems: 'center',
          }}
        >
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
            }}
          >
            {i + 1}
          </span>
          <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
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
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: '8px',
            color: C.textSub,
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
        <FullBtn
          label={loading ? 'Accepting…' : '✓ Accept Order'}
          c={C.ready}
          cBg={C.readyBg}
          onClick={onAccept}
          loading={loading}
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
  cancelReason: string
  onCancelReasonChange: (r: string) => void
  onAdvance: () => void
  onCancel: () => void
  loading?: boolean
}

export const OrderExpandedPanel: React.FC<ExpandedPanelProps> = ({
  order,
  sectionColor,
  sectionBg,
  advLabel,
  advColor,
  cancelReason,
  onCancelReasonChange,
  onAdvance,
  onCancel,
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
      {order.items.map((item: string, i: number) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '7px 0',
            borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
            alignItems: 'center',
          }}
        >
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
            }}
          >
            {i + 1}
          </span>
          <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
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
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: C.textMute, marginBottom: 5, fontWeight: 500 }}>
            Cancel reason (optional)
          </div>
          <select
            value={cancelReason}
            onChange={(e) => onCancelReasonChange(e.target.value)}
            style={{
              width: '100%',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: '6px 8px',
              color: C.textSub,
              fontSize: 12,
              outline: 'none',
              marginBottom: 6,
            }}
          >
            <option value="">Select reason…</option>
            <option>Customer request</option>
            <option>Out of stock</option>
            <option>Duplicate order</option>
            <option>Payment issue</option>
            <option>Manager action</option>
          </select>
          <FullBtn
            label={loading ? 'Cancelling…' : 'Cancel Order'}
            c={C.cancelled}
            cBg={C.cancelBg}
            onClick={onCancel}
            loading={loading}
          />
        </div>
      </div>
    </div>
  </div>
)
