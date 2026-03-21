'use client'
import React from 'react'
import { C } from '../constants'
import { Tag, AssignTag, ABtn, EyeIcon } from './UIAtoms'

interface OrderRowProps {
  order: any
  sectionColor: string
  sectionBg: string
  advLabel: string
  advColor: string
  isOpen: boolean
  onToggle: () => void
  onAdvance: () => void
  onPeekEnter: (e: React.MouseEvent, id: string) => void
  onPeekLeave: () => void
  barista: any | null
  loading: boolean
}

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  sectionColor,
  sectionBg,
  advLabel,
  advColor,
  isOpen,
  onToggle,
  onAdvance,
  onPeekEnter,
  onPeekLeave,
  barista,
  loading,
}) => {
  const leftBorderColor = order.delayed ? C.late : isOpen ? sectionColor : 'transparent'
  const rowBg = order.delayed ? '#fef2f2' : C.surface

  return (
    <div
      className="hrow order-grid"
      onClick={onToggle}
      style={{
        alignItems: 'center',
        padding: '10px 20px',
        background: rowBg,
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${leftBorderColor}`,
        borderRight: `3px solid ${leftBorderColor}`,
        cursor: 'pointer',
        transition: 'border-color .12s',
      }}
    >
      {/* Order no */}
      <div style={{ fontWeight: 700, fontSize: 13 }}>{order.no}</div>

      {/* Time */}
      <div style={{ color: C.textMute, fontSize: 12 }}>{order.time}</div>

      {/* Customer */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{order.customer}</div>
        <AssignTag assign="auto" />
      </div>

      {/* Barista */}
      <div>
        <div style={{ color: C.textSub, fontSize: 12, fontWeight: 500 }}>
          {barista?.name || 'Unassigned'}
        </div>
        <div style={{ fontSize: 10, marginTop: 2 }}>
          {barista ? (
            <span style={{ color: C.ready, fontWeight: 600 }}>active</span>
          ) : (
            <span style={{ color: C.textMute }}>—</span>
          )}
        </div>
      </div>

      {/* Ref / slot */}
      <div>
        {order.type === 'takeaway' ? (
          <>
            <div style={{ fontSize: 10, color: C.textMute, fontWeight: 500 }}>SLOT</div>
            <div style={{ fontWeight: 700, color: C.takeaway, fontSize: 13, marginTop: 1 }}>
              {order.slot || 'Immediate'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: C.textMute, fontWeight: 500 }}>DINE-IN</div>
            <div style={{ fontWeight: 700, color: C.dineIn, fontSize: 13, marginTop: 1 }}>
              {order.no}
            </div>
          </>
        )}
      </div>

      {/* Items + peek */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: 12, color: C.textMute, fontWeight: 500 }}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </span>
        <button
          onMouseEnter={(e) => onPeekEnter(e, order.id)}
          onMouseLeave={onPeekLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: C.textMute,
            fontSize: 11,
            fontWeight: 500,
          }}
          onMouseOver={(e) => {
            ;(e.currentTarget as any).style.borderColor = sectionColor
            ;(e.currentTarget as any).style.color = sectionColor
            ;(e.currentTarget as any).style.background = sectionBg
          }}
          onMouseOut={(e) => {
            ;(e.currentTarget as any).style.borderColor = C.border
            ;(e.currentTarget as any).style.color = C.textMute
            ;(e.currentTarget as any).style.background = C.bg
          }}
        >
          <EyeIcon /> Peek
        </button>
      </div>

      {/* Flags */}
      <div className="col-flags" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {order.type === 'takeaway' && !order.delayed && (
          <Tag c={C.takeaway} bg={C.takeawayBg}>
            Takeaway
          </Tag>
        )}
        {order.type === 'dine-in' && !order.delayed && (
          <Tag c={C.dineIn} bg={C.dineInBg}>
            Dine-in
          </Tag>
        )}
        {order.delayed && (
          <Tag c={C.late} bg={C.lateBg}>
            Late
          </Tag>
        )}
        {order.reward && (
          <Tag c={C.reward} bg={C.rewardBg}>
            ★ Reward
          </Tag>
        )}
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <ABtn
          label={loading ? '…' : advLabel}
          c={advColor}
          onClick={onAdvance}
          disabled={loading}
        />
      </div>
    </div>
  )
}
