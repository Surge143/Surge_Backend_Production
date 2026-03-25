'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { C, SECTIONS, GLOBAL_STYLES, formatOrder } from './constants'
import { TopBar } from './components/TopBar'
import { FilterBar } from './components/FilterBar'
import { OrderRow } from './components/OrderRow'
import { Toast } from './components/UIAtoms'

interface Props {
  initialOrders: any[]     // placed + shipped (active)
  initialDelivered: any[]  // delivered
  initialCancelled: any[]  // cancelled / refund-initiated / refunded
  shopDoc: any | null
  isAdmin?: boolean
  allShops?: any[]
}

export const StoreDashboardClient: React.FC<Props> = ({
  initialOrders,
  initialDelivered,
  initialCancelled,
  shopDoc,
  isAdmin = false,
  allShops = [],
}) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>(() => initialOrders.map(formatOrder))
  const [, setDelivered] = useState<any[]>(() => initialDelivered.map(formatOrder))
  const [, setCancelled] = useState<any[]>(() => initialCancelled.map(formatOrder))

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const [currentShopId, setCurrentShopId] = useState<string | null>(
    shopDoc?.id ? String(shopDoc.id) : null,
  )
  const [currentShopDoc, setCurrentShopDoc] = useState<any>(shopDoc)
  const [shopSwitching, setShopSwitching] = useState(false)

  // ── Toast helper ───────────────────────────────────────────────────────────
  const notify = useCallback((msg: string, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }, [])

  // ── Loading helpers ────────────────────────────────────────────────────────
  const setLoading = (id: string, v: boolean) =>
    setLoadingIds((p) => ({ ...p, [id]: v }))

  // ── Shop switcher (admin only) ─────────────────────────────────────────────
  const handleShopSwitch = useCallback(
    async (newShopId: string) => {
      if (newShopId === currentShopId) return
      setShopSwitching(true)
      try {
        const res = await fetch(`/api/store-manager/dashboard-data?shopId=${newShopId}`)
        if (!res.ok) throw new Error('Failed to load shop data')
        const data = await res.json()
        setOrders(data.orders.map(formatOrder))
        setDelivered(data.delivered.map(formatOrder))
        setCancelled(data.cancelled.map(formatOrder))
        setCurrentShopId(newShopId)
        const shopResult = allShops.find((s: any) => String(s.id) === newShopId)
        setCurrentShopDoc(shopResult || null)
        setExpanded(null)
        setSearch('')
        setFilter('all')
      } catch (e: any) {
        notify(e.message || 'Failed to switch shop', 'err')
      } finally {
        setShopSwitching(false)
      }
    },
    [currentShopId, allShops, notify],
  )

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io()

    socket.on('web-order-created', (raw: any) => {
      if (raw.paymentStatus !== 'completed') return
      const formatted = formatOrder(raw)
      setOrders((prev) => {
        if (prev.find((o) => o.id === formatted.id)) return prev
        return [formatted, ...prev]
      })
      notify('🔔 New store order received!', 'ok')
    })

    socket.on('web-order-updated', (raw: any) => {
      const formatted = formatOrder(raw)
      const ds = raw.deliveryStatus

      if (ds === 'placed' || ds === 'shipped') {
        // Active order — update or add
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === formatted.id)
          if (exists) return prev.map((o) => (o.id === formatted.id ? formatted : o))
          return [formatted, ...prev]
        })
        // Remove from delivered/cancelled if it somehow moved back
        setDelivered((prev) => prev.filter((o) => o.id !== formatted.id))
        setCancelled((prev) => prev.filter((o) => o.id !== formatted.id))
      } else if (ds === 'delivered') {
        setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
        setDelivered((prev) => {
          if (prev.find((o) => o.id === formatted.id))
            return prev.map((o) => (o.id === formatted.id ? formatted : o))
          return [formatted, ...prev]
        })
        setCancelled((prev) => prev.filter((o) => o.id !== formatted.id))
      } else if (ds === 'cancelled' || ds === 'refund-initiated' || ds === 'refunded') {
        setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
        setDelivered((prev) => prev.filter((o) => o.id !== formatted.id))
        setCancelled((prev) => {
          if (prev.find((o) => o.id === formatted.id))
            return prev.map((o) => (o.id === formatted.id ? formatted : o))
          return [formatted, ...prev]
        })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [notify])

  // ── Filtering ──────────────────────────────────────────────────────────────
  const applyFilter = (o: any) => {
    if (search) {
      const q = search.toLowerCase().replace(/^#/, '')
      const invoiceId = (o.raw?.invoiceId || '').toLowerCase()
      const rawId = String(o.raw?.id || '')
      if (
        !invoiceId.includes(q) &&
        !rawId.includes(q) &&
        !o.customer.toLowerCase().includes(q)
      ) return false
    }
    if (filter === 'all') return true
    if (filter === 'delivery') return o.type === 'delivery'
    if (filter === 'pickup') return o.type === 'pickup'
    if (filter === 'subscription') return o.reward === true
    return true
  }

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleShip = async (order: any, deliverByDate: string) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/store-manager/update-web-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          deliveryStatus: 'shipped',
          deliveringBy: new Date(`${deliverByDate}T23:59:59`).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
      const { order: updated } = await res.json()
      const formatted = formatOrder(updated)
      setOrders((prev) => prev.map((o) => (o.id === formatted.id ? formatted : o)))
      notify('Order marked as shipped')
    } catch (e: any) {
      notify(e.message || 'Error updating order', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  const handleMarkReady = async (order: any) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/store-manager/update-web-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          deliveryStatus: 'shipped',
          isPickupReady: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
      const { order: updated } = await res.json()
      const formatted = formatOrder(updated)
      setOrders((prev) => prev.map((o) => (o.id === formatted.id ? formatted : o)))
      notify('Pickup marked as ready')
    } catch (e: any) {
      notify(e.message || 'Error updating order', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  const handlePickedUp = async (order: any, pickedUpDate: string) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/store-manager/update-web-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          deliveryStatus: 'delivered',
          pickedUpDate: new Date(`${pickedUpDate}T12:00:00`).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
      const { order: updated } = await res.json()
      const formatted = formatOrder(updated)
      setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
      setDelivered((prev) => [formatted, ...prev])
      if (expanded === order.id) setExpanded(null)
      notify('Order picked up')
    } catch (e: any) {
      notify(e.message || 'Error updating order', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  const handleDeliver = async (order: any, deliveredOnDate: string) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/store-manager/update-web-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          deliveryStatus: 'delivered',
          deliveredOn: deliveredOnDate ? new Date(deliveredOnDate).toISOString() : new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
      const { order: updated } = await res.json()
      const formatted = formatOrder(updated)
      setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
      setDelivered((prev) => [formatted, ...prev])
      if (expanded === order.id) setExpanded(null)
      notify('Order delivered')
    } catch (e: any) {
      notify(e.message || 'Error updating order', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  const handleRefund = async (order: any, reason: string) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/store-manager/refund-web-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: reason || 'Manager action' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Refund failed')
      }
      const { order: updated } = await res.json()
      const formatted = formatOrder(updated)
      setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
      setCancelled((prev) => [formatted, ...prev])
      if (expanded === order.id) setExpanded(null)
      notify('Refund initiated', 'warn')
    } catch (e: any) {
      notify(e.message || 'Error initiating refund', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────
  const counts = {
    new: orders.filter((o) => o.status === 'new').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
  }

  const shopName = currentShopDoc?.name || 'Store Dashboard'

  return (
    <div
      className="std-root"
      style={{
        fontFamily: "'Inter','DM Sans',system-ui,sans-serif",
        background: C.bg,
        color: C.text,
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 13,
        width: '100%',
        minWidth: 0,
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      <TopBar
        counts={counts}
        search={search}
        onSearch={setSearch}
        shopName={shopName}
        isAdmin={isAdmin}
        allShops={allShops}
        currentShopId={currentShopId}
        onShopChange={handleShopSwitch}
        shopSwitching={shopSwitching}
      />

      <FilterBar filter={filter} onFilter={setFilter} />

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minWidth: 0 }}>
        {SECTIONS.map((sec) => {
          // Pull the right list per section
          const sectionOrders = orders.filter((o) => o.status === sec.key && applyFilter(o))

          return (
            <div key={sec.key}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px 8px',
                  background: sec.bg,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  borderBottom: `1px solid ${sec.border}`,
                  borderTop: `1px solid ${sec.border}`,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 16,
                    background: sec.color,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: sec.color,
                    letterSpacing: 0.5,
                  }}
                >
                  {sec.label.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: '1px 8px',
                    background: sec.color,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {sectionOrders.length}
                </span>
              </div>

              {/* Column headers */}
              <div
                className="std-order-grid"
                style={{
                  padding: '6px 20px',
                  background: C.bg,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {['ORDER', 'TIME', 'CUSTOMER', 'TYPE', 'ITEMS', 'AMOUNT', 'ACTIONS'].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        color: C.textMute,
                        letterSpacing: 0.8,
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </span>
                  ),
                )}
              </div>

              {sectionOrders.length === 0 && (
                <div style={{ padding: '14px 20px', color: C.textMute, fontSize: 12 }}>
                  — no orders —
                </div>
              )}

              {sectionOrders.map((order) => {
                const isOpen = expanded === order.id
                const loading = !!loadingIds[order.id]

                return (
                  <OrderRow
                    key={order.id}
                    order={order}
                    sectionKey={sec.key}
                    sectionColor={sec.color}
                    sectionBg={sec.bg}
                    isOpen={isOpen}
                    onToggle={() => setExpanded((prev) => (prev === order.id ? null : order.id))}
                    loading={loading}
                    onShip={(deliverByDate) => handleShip(order, deliverByDate)}
                    onMarkReady={() => handleMarkReady(order)}
                    onDeliver={(date) => handleDeliver(order, date)}
                    onPickedUp={(date) => handlePickedUp(order, date)}
                    onRefund={(reason: string) => handleRefund(order, reason)}
                  />
                )
              })}
            </div>
          )
        })}

      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
