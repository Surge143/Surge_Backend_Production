'use client'
import React, { useState } from 'react'
import { C } from '../constants'
import { ABtn, Tag } from './UIAtoms'

const REFUND_REASONS = [
  'Customer requested cancellation',
  'Out of stock',
  'Item damaged / quality issue',
  'Wrong item shipped',
  'Delivery not possible',
  'Duplicate order',
  'Payment issue',
  'Other',
]

interface OrderRowProps {
  order: any
  sectionKey: string
  sectionColor: string
  sectionBg: string
  isOpen: boolean
  onToggle: () => void
  loading: boolean
  onShip?: (deliverByDate: string) => void
  onMarkReady?: () => void
  onDeliver?: (deliveredOnDate: string) => void
  onPickedUp?: (pickedUpDate: string) => void
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
  onMarkReady,
  onDeliver,
  onPickedUp,
  onRefund,
}) => {
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  // Separate state for the in-panel cancel form (shipped section) — avoids hiding the expanded panel
  const [panelCancelOpen, setPanelCancelOpen] = useState(false)
  const [panelCancelReason, setPanelCancelReason] = useState('')
  const [shipOpen, setShipOpen] = useState(false)
  const [deliverByDate, setDeliverByDate] = useState('')
  const [pickupOpen, setPickupOpen] = useState(false)
  const [pickedUpDate, setPickedUpDate] = useState('')
  const [deliverOpen, setDeliverOpen] = useState(false)
  const [deliveredOnDate, setDeliveredOnDate] = useState('')

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

  console.log(order)

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
        <div style={{ fontWeight: 700, fontSize: 13, color: sectionColor }}>{order.id}</div>

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
        </div>

        {/* Items count */}
        <div style={{ fontSize: 12, color: C.textMute }}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </div>

        {/* Amount */}
        <div style={{ fontWeight: 600, fontSize: 13 }}>AED {Number(order.total).toFixed(2)}</div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}
          onClick={(e) => e.stopPropagation()}
        >
          {sectionKey === 'new' && (
            <>
              {/* ── Delivery: Ship with deliver-by date popover ── */}
              {order.type === 'delivery' && (
                <div style={{ position: 'relative' }}>
                  <ABtn
                    label={loading ? '…' : 'Ship'}
                    c={C.shipped}
                    onClick={() => {
                      setShipOpen((p) => !p)
                      setRefundOpen(false)
                    }}
                    disabled={loading}
                  />
                  {shipOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 50,
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                        minWidth: 200,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textMute,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                          marginBottom: 6,
                        }}
                      >
                        DELIVERING BY DATE
                      </div>
                      <input
                        type="date"
                        value={deliverByDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDeliverByDate(e.target.value)}
                        style={{
                          width: '100%',
                          background: C.bg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '6px 8px',
                          color: deliverByDate ? C.text : C.textMute,
                          fontSize: 12,
                          outline: 'none',
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setShipOpen(false)
                            setDeliverByDate('')
                          }}
                          style={{
                            flex: 1,
                            padding: '5px 0',
                            background: 'none',
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.textMute,
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!deliverByDate) return
                            if (onShip) onShip(deliverByDate)
                            setShipOpen(false)
                            setDeliverByDate('')
                          }}
                          disabled={!deliverByDate || loading}
                          style={{
                            flex: 1,
                            padding: '5px 0',
                            background: deliverByDate ? C.shipped : C.shipped + '40',
                            border: 'none',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: deliverByDate && !loading ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {loading ? '…' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* ── Pickup: Mark Ready button ── */}
              {order.type === 'pickup' && (
                <ABtn
                  label={loading ? '…' : 'Mark Ready'}
                  c={C.new}
                  onClick={() => {
                    if (onMarkReady) onMarkReady()
                    setRefundOpen(false)
                  }}
                  disabled={loading}
                />
              )}
              <div style={{ position: 'relative' }}>
                <ABtn
                  label="Cancel & Refund"
                  c={C.cancelled}
                  onClick={() => {
                    setRefundOpen((p) => !p)
                    setShipOpen(false)
                  }}
                  disabled={loading}
                />
                {refundOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      zIndex: 50,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: 12,
                      boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                      minWidth: 220,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textMute,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      REFUND REASON
                    </div>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      style={{
                        width: '100%',
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        color: refundReason ? C.text : C.textMute,
                        fontSize: 12,
                        outline: 'none',
                        marginBottom: 8,
                      }}
                    >
                      <option value="">Select a reason…</option>
                      {REFUND_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          setRefundOpen(false)
                          setRefundReason('')
                        }}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          background: 'none',
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          color: C.textMute,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!refundReason) return
                          handleRefundSubmit()
                        }}
                        disabled={!refundReason || loading}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          background: refundReason ? C.cancelled : C.cancelled + '40',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: refundReason && !loading ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {loading ? '…' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* ── Shipped/delivery: mark delivered with date popover ── */}
          {sectionKey === 'shipped' && order.type === 'delivery' && (
            <div style={{ position: 'relative' }}>
              <ABtn
                label={loading ? '…' : 'Delivered'}
                c={C.new}
                onClick={() => setDeliverOpen((p) => !p)}
                disabled={loading}
              />
              {deliverOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 50,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMute,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    DELIVERED ON DATE
                  </div>
                  <input
                    type="date"
                    value={deliveredOnDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeliveredOnDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: deliveredOnDate ? C.text : C.textMute,
                      fontSize: 12,
                      outline: 'none',
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setDeliverOpen(false)
                        setDeliveredOnDate('')
                      }}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        background: 'none',
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.textMute,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!deliveredOnDate) return
                        onDeliver && onDeliver(deliveredOnDate)
                        setDeliverOpen(false)
                        setDeliveredOnDate('')
                      }}
                      disabled={!deliveredOnDate || loading}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        background: deliveredOnDate ? C.new : C.new + '40',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: deliveredOnDate && !loading ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {loading ? '…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ── Shipped/pickup: mark picked up with date popover ── */}
          {sectionKey === 'shipped' && order.type === 'pickup' && (
            <div style={{ position: 'relative' }}>
              <ABtn
                label={loading ? '…' : 'Picked Up'}
                c={C.new}
                onClick={() => setPickupOpen((p) => !p)}
                disabled={loading}
              />
              {pickupOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 50,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMute,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    PICKED UP DATE
                  </div>
                  <input
                    type="date"
                    value={pickedUpDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickedUpDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: pickedUpDate ? C.text : C.textMute,
                      fontSize: 12,
                      outline: 'none',
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setPickupOpen(false)
                        setPickedUpDate('')
                      }}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        background: 'none',
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.textMute,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!pickedUpDate) return
                        if (onPickedUp) onPickedUp(pickedUpDate)
                        setPickupOpen(false)
                        setPickedUpDate('')
                      }}
                      disabled={!pickedUpDate || loading}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        background: pickedUpDate ? C.new : C.new + '40',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: pickedUpDate && !loading ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {loading ? '…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          {/* ── Order info strip ── */}
          <div
            style={{
              display: 'flex',
              gap: 28,
              flexWrap: 'wrap',
              padding: '8px 12px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              marginBottom: 14,
              fontSize: 11,
            }}
          >
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Order ID: </span>
              <span style={{ fontWeight: 700 }}>{order.no}</span>
            </div>
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Date: </span>
              {order.raw?.createdAt
                ? new Date(order.raw.createdAt).toLocaleDateString('en-AE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </div>
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Time: </span>
              {order.time}
            </div>
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Type: </span>
              {order.type === 'delivery' ? 'Delivery' : 'Pickup'}
            </div>
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Origin: </span>
              One-time
            </div>
            <div>
              <span style={{ color: C.textMute, fontWeight: 600 }}>Payment: </span>
              {order.raw?.paymentStatus || '—'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Customer & Shipping Address */}
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
                <div style={{ fontSize: 11, color: C.textSub, marginBottom: 6 }}>
                  +971 {order.phone}
                </div>
              )}

              {/* Shipping address with labels */}
              {order.shippingAddress && (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textMute,
                      fontWeight: 600,
                      letterSpacing: 0.8,
                      marginTop: 10,
                      marginBottom: 6,
                    }}
                  >
                    SHIPPING ADDRESS
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textSub,
                      padding: '8px 10px',
                      background: C.bg,
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      lineHeight: 1.8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {order.shippingAddress.name && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Name: </span>
                        {order.shippingAddress.name}
                      </div>
                    )}
                    {order.shippingAddress.line1 && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Address: </span>
                        {order.shippingAddress.line1}
                      </div>
                    )}
                    {order.shippingAddress.line2 && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Address 2: </span>
                        {order.shippingAddress.line2}
                      </div>
                    )}
                    {order.shippingAddress.city && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>City: </span>
                        {order.shippingAddress.city}
                      </div>
                    )}
                    {order.shippingAddress.emirates && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Emirate: </span>
                        {order.shippingAddress.emirates}
                      </div>
                    )}
                    {order.shippingAddress.country && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Country: </span>
                        {order.shippingAddress.country}
                      </div>
                    )}
                    {order.shippingAddress.phone && (
                      <div>
                        <span style={{ color: C.textMute, fontWeight: 600 }}>Phone: </span>
                        +971 {order.shippingAddress.phone}
                      </div>
                    )}
                  </div>
                </>
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
                  marginBottom: 6,
                }}
              >
                ORDER ITEMS
              </div>
              {/* Column headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 40px 50px 80px',
                  gap: 6,
                  padding: '4px 0',
                  borderBottom: `1px solid ${C.borderMid}`,
                  marginBottom: 4,
                }}
              >
                {['PRODUCT', 'QTY', 'UNIT', 'TOTAL'].map((h) => (
                  <span
                    key={h}
                    style={{ fontSize: 9, color: C.textMute, fontWeight: 700, letterSpacing: 0.6 }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {order.items.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 40px 50px 80px',
                    gap: 6,
                    alignItems: 'start',
                    padding: '6px 0',
                    borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  {/* Product name + variant + tagline + highlights */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                      {item.name} {item.tagline}
                    </div>
                    {item.variant && (
                      <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>
                        {item.variant}g
                      </div>
                    )}
                    {item.productHighlights && item.productHighlights.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {item.productHighlights.map((section: any, si: number) => (
                          <div key={si}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: C.textMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
                              {section.sectionTitle}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {(section.items || []).map((feat: any, fi: number) => (
                                <span
                                  key={fi}
                                  style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    color: C.textSub,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {feat.point}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Qty */}
                  <span style={{ fontSize: 12, color: C.textSub, paddingTop: 1 }}>×{item.qty}</span>
                  {/* Unit price */}
                  <span style={{ fontSize: 11, color: C.textSub, paddingTop: 2 }}>
                    AED {Number(item.price).toFixed(2)}
                  </span>
                  {/* Line total */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text, paddingTop: 1 }}>
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
                fontSize: 10,
                color: C.textMute,
                fontWeight: 600,
                letterSpacing: 0.8,
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              PAYMENT SUMMARY
            </div>
          )}
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

          {/* Cancel & Refund — inside expanded panel for shipped orders */}
          {sectionKey === 'shipped' && onRefund && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              {!panelCancelOpen ? (
                <button
                  onClick={() => setPanelCancelOpen(true)}
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
                  ✕ Cancel & Refund
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: 0.4 }}
                  >
                    CANCEL REASON
                  </div>
                  <select
                    value={panelCancelReason}
                    onChange={(e) => setPanelCancelReason(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      color: panelCancelReason ? C.text : C.textMute,
                      fontSize: 12,
                      outline: 'none',
                      maxWidth: 280,
                    }}
                  >
                    <option value="">Select a reason…</option>
                    {REFUND_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setPanelCancelOpen(false)
                        setPanelCancelReason('')
                      }}
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
                      disabled={!panelCancelReason || loading}
                      onClick={() => {
                        if (!panelCancelReason) return
                        onRefund(panelCancelReason)
                        setPanelCancelOpen(false)
                        setPanelCancelReason('')
                      }}
                      style={{
                        padding: '5px 16px',
                        background: panelCancelReason ? C.cancelled : C.cancelled + '40',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: panelCancelReason && !loading ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {loading ? '…' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}
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
