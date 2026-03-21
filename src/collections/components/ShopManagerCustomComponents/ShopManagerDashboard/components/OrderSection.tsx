'use client'
import React from 'react'
import { C } from '../constants'
import { OrderRow } from './OrderRow'
import { OrderExpandedPanel, NewOrderExpandedPanel } from './ExpandedPanels'

interface OrderSectionProps {
  section: { key: string; label: string; color: string; bg: string; border: string }
  orders: any[]
  baristas: any[]
  expanded: string | null
  selectedBaristas: Record<string, string>
  loadingIds: Record<string, boolean>
  peekHandlers: {
    onEnter: (e: React.MouseEvent, id: string) => void
    onLeave: () => void
  }
  onToggleExpand: (id: string) => void
  onAdvance: (order: any) => void
  onAccept: (order: any) => void
  onReject: (order: any) => void
  onBaristaChange: (orderId: string, baristaId: string) => void
}

export const OrderSection: React.FC<OrderSectionProps> = ({
  section,
  orders,
  baristas,
  expanded,
  selectedBaristas,
  loadingIds,
  peekHandlers,
  onToggleExpand,
  onAdvance,
  onAccept,
  onReject,
  onBaristaChange,
}) => {
  const advLabel =
    section.key === 'new' ? 'Start Prep' : section.key === 'prep' ? 'Mark Ready' : 'Complete'
  const advColor = section.key === 'new' ? C.new : section.key === 'prep' ? C.prep : C.ready

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px 8px',
          background: section.bg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${section.border}`,
          borderTop: `1px solid ${section.border}`,
        }}
      >
        <div
          style={{
            width: 4,
            height: 16,
            background: section.color,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 12, color: section.color, letterSpacing: 0.5 }}>
          {section.label.toUpperCase()}
        </span>
        <span
          style={{
            padding: '1px 8px',
            background: section.color,
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {orders.length}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="order-grid"
        style={{
          padding: '6px 20px',
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {['ORDER', 'TIME', 'CUSTOMER', 'BARISTA', 'REF', 'ITEMS', 'FLAGS', 'ACTION'].map((h, i) => (
          <span
            key={i}
            className={h === 'FLAGS' ? 'col-flags' : undefined}
            style={{ fontSize: 10, color: C.textMute, letterSpacing: 0.8, fontWeight: 600 }}
          >
            {h}
          </span>
        ))}
      </div>

      {orders.length === 0 && (
        <div style={{ padding: '16px 20px', color: C.textFaint, fontSize: 12 }}>— no orders —</div>
      )}

      {orders.map((order) => {
        const b = baristas.find((x) => String(x.id) === String(order.baristaId))
        const isOpen = expanded === order.id
        const loading = !!loadingIds[order.id]

        return (
          <div key={order.id}>
            <OrderRow
              order={order}
              sectionColor={section.color}
              sectionBg={section.bg}
              advLabel={advLabel}
              advColor={advColor}
              isOpen={isOpen}
              onToggle={() => onToggleExpand(order.id)}
              onAdvance={() => (section.key === 'new' ? onAccept(order) : onAdvance(order))}
              onPeekEnter={peekHandlers.onEnter}
              onPeekLeave={peekHandlers.onLeave}
              barista={b}
              loading={loading}
            />

            {isOpen && section.key === 'new' && (
              <NewOrderExpandedPanel
                order={order}
                sectionColor={section.color}
                sectionBg={section.bg}
                baristas={baristas}
                selectedBaristaId={selectedBaristas[order.id]}
                onBaristaChange={(id) => onBaristaChange(order.id, id)}
                onAccept={() => onAccept(order)}
                onReject={() => onReject(order)}
                loading={loading}
              />
            )}

            {isOpen && section.key !== 'new' && (
              <OrderExpandedPanel
                order={order}
                sectionColor={section.color}
                sectionBg={section.bg}
                advLabel={advLabel}
                advColor={advColor}
                onAdvance={() => onAdvance(order)}
                loading={loading}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
