'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { ABtn, Tag } from './UIAtoms'

interface OrderRowProps {
  order: any
  sectionKey: string
  sectionColor: string
  sectionBg: string
  isOpen: boolean
  onToggle: () => void
  loading: boolean
  onShip?: () => void
  onDeliver?: () => void
  onRefund?: (reason: string) => void
}

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  sectionKey,
  sectionColor,
  sectionBg,
  isOpen,
  onToggle,
  loading,
  onShip,
  onDeliver,
  onRefund,
}) => {
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')

  const leftBorderColor = isOpen ? sectionColor : 'transparent'

  const handleRefundSubmit = () => {
    if (onRefund) {
      onRefund(refundReason || 'Manager action')
      setRefundOpen(false)
      setRefundReason('')
    }
  }

  const statusLabel: Record<string, string> = {
    new: 'New',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  return (
    <>
      <div
        className="hrow std-order-grid"
        onClick={onToggle}
        style={{
          alignItems: 'center',
          padding: '10px 20px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          borderLeft: `3px solid ${leftBorderColor}`,
          cursor: 'pointer',
          transition: 'border-color .12s',
        }}
      >
        {/* Order no */}
        <div style={{ fontWeight: 700, fontSize: 13, color: sectionColor }}>{order.no}</div>

        {/* Time */}
        <div style={{ color: C.textMute, fontSize: 12 }}>{order.time}</div>

        {/* Customer */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{order.customer}</div>
          {order.email && (
            <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>{order.email}</div>
          )}
        </div>

        {/* Type (delivery/pickup badge) */}
        <div>
          {order.type === 'delivery' ? (
            <Tag c={C.shipped} bg={C.shipBg}>
              Delivery
            </Tag>
          ) : (
            <Tag c={C.new} bg={C.newBg}>
              Pickup
            </Tag>
          )}
          {order.reward && (
            <div style={{ marginTop: 3 }}>
              <Tag c="#7c3aed" bg="#f5f3ff">
                Subscription
              </Tag>
            </div>
          )}
        </div>

        {/* Items count */}
        <div style={{ fontSize: 12, color: C.textMute }}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </div>

        {/* Amount */}
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          AED {Number(order.total).toFixed(2)}
        </div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}
          onClick={(e) => e.stopPropagation()}
        >
          {sectionKey === 'new' && (
            <>
              <ABtn
                label={loading ? '…' : 'Ship'}
                c={C.shipped}
                onClick={() => onShip && onShip()}
                disabled={loading}
              />
              <ABtn
                label="Cancel & Refund"
                c={C.cancelled}
                onClick={() => setRefundOpen((p) => !p)}
                disabled={loading}
              />
            </>
          )}
          {sectionKey === 'shipped' && (
            <ABtn
              label={loading ? '…' : 'Delivered'}
              c={C.new}
              onClick={() => onDeliver && onDeliver()}
              disabled={loading}
            />
          )}
          {(sectionKey === 'delivered' || sectionKey === 'cancelled') && (
            <span
              style={{
                padding: '3px 10px',
                background: sectionBg,
                border: `1px solid ${sectionColor}44`,
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                color: sectionColor,
                whiteSpace: 'nowrap',
              }}
            >
              {statusLabel[sectionKey] || sectionKey}
            </span>
          )}
        </div>
      </div>

      {/* Refund reason input (shown inline below row) */}
      {refundOpen && sectionKey === 'new' && (
        <div
          className="slip"
          style={{
            padding: '10px 20px 12px 20px',
            background: C.cancelBg,
            borderBottom: `1px solid ${C.cancelBorder}`,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: C.cancelled, fontWeight: 600, flexShrink: 0 }}>
            Refund reason:
          </span>
          <input
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="e.g. Customer request, out of stock…"
            style={{
              flex: 1,
              padding: '6px 10px',
              border: `1px solid ${C.cancelBorder}`,
              borderRadius: 6,
              fontSize: 12,
              background: C.surface,
              color: C.text,
              outline: 'none',
            }}
          />
          <button
            onClick={handleRefundSubmit}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: C.cancelled,
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {loading ? '…' : 'Confirm Refund'}
          </button>
          <button
            onClick={() => setRefundOpen(false)}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.textMute,
              fontSize: 12,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Expanded detail panel */}
      {isOpen && !refundOpen && (
        <div
          className="slip"
          style={{
            padding: '14px 24px 16px',
            background: sectionBg,
            borderBottom: `1px solid ${C.border}`,
            borderLeft: `3px solid ${sectionColor}`,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Customer & Address */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMute,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                CUSTOMER DETAILS
              </div>
              <div style={{ fontSize: 12, color: C.text, marginBottom: 3 }}>
                <strong>{order.customer}</strong>
              </div>
              {order.email && (
                <div style={{ fontSize: 11, color: C.textSub, marginBottom: 2 }}>{order.email}</div>
              )}
              {order.phone && (
                <div style={{ fontSize: 11, color: C.textSub, marginBottom: 2 }}>{order.phone}</div>
              )}
              {order.address && (
                <div
                  style={{
                    fontSize: 11,
                    color: C.textSub,
                    marginTop: 6,
                    padding: '6px 8px',
                    background: C.surface,
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    lineHeight: 1.5,
                  }}
                >
                  {order.address}
                </div>
              )}
            </div>

            {/* Right: Items */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMute,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                ORDER ITEMS
              </div>
              {order.items.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '5px 0',
                    borderBottom:
                      i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    {item.variant && (
                      <span style={{ color: C.textMute, marginLeft: 4 }}>({item.variant})</span>
                    )}
                    <span style={{ color: C.textMute, marginLeft: 6 }}>×{item.qty}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    AED {Number(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financials */}
          {order.raw?.financials && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                background: C.surface,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: C.textMute }}>Subtotal: </span>
                <span style={{ fontWeight: 600 }}>
                  AED {Number(order.raw.financials.subtotal || 0).toFixed(2)}
                </span>
              </div>
              {order.raw.financials.shippingCharge > 0 && (
                <div>
                  <span style={{ color: C.textMute }}>Shipping: </span>
                  <span style={{ fontWeight: 600 }}>
                    AED {Number(order.raw.financials.shippingCharge).toFixed(2)}
                  </span>
                </div>
              )}
              {order.raw.financials.taxAmount > 0 && (
                <div>
                  <span style={{ color: C.textMute }}>Tax: </span>
                  <span style={{ fontWeight: 600 }}>
                    AED {Number(order.raw.financials.taxAmount).toFixed(2)}
                  </span>
                </div>
              )}
              {order.raw.financials.couponDiscount > 0 && (
                <div>
                  <span style={{ color: C.textMute }}>Discount: </span>
                  <span style={{ fontWeight: 600, color: C.new }}>
                    -AED {Number(order.raw.financials.couponDiscount).toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ color: C.textMute }}>Total: </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: sectionColor }}>
                  AED {Number(order.raw.financials.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Refund status */}
          {order.raw?.paymentStatus === 'refund-initiated' && (
            <div
              style={{
                marginTop: 10,
                padding: '7px 12px',
                background: C.cancelBg,
                border: `1px solid ${C.cancelBorder}`,
                borderRadius: 6,
                fontSize: 11,
                color: C.cancelled,
                fontWeight: 500,
              }}
            >
              Refund initiated{order.raw?.refundReason ? ` — ${order.raw.refundReason}` : ''}
            </div>
          )}
          {order.raw?.paymentStatus === 'refunded' && (
            <div
              style={{
                marginTop: 10,
                padding: '7px 12px',
                background: C.cancelBg,
                border: `1px solid ${C.cancelBorder}`,
                borderRadius: 6,
                fontSize: 11,
                color: C.cancelled,
                fontWeight: 500,
              }}
            >
              Refunded
            </div>
          )}
        </div>
      )}
    </>
  )
}
