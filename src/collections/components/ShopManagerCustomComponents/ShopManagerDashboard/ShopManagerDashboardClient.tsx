'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { C, SECTIONS, GLOBAL_STYLES, formatOrder, getOrderSection } from './constants'
import { TopBar } from './components/TopBar'
import { FilterBar } from './components/FilterBar'
import { OrderSection } from './components/OrderSection'
import { CancelledSection, PeekTooltip } from './components/CancelledAndPeek'
import { SlotsPanel, BaristasPanel } from './components/RightPanels'
import { Toast } from './components/UIAtoms'

interface Props {
  initialOrders: any[]
  initialCancelled: any[]
  initialSlots: any[]
  initialBaristas: any[]
  shopDoc: any | null
  isAdmin?: boolean
  allShops?: any[]
}

export const ShopManagerDashboardClient: React.FC<Props> = ({
  initialOrders,
  initialCancelled,
  initialSlots,
  initialBaristas,
  shopDoc,
  isAdmin = false,
  allShops = [],
}) => {
  const [orders, setOrders] = useState<any[]>(() => initialOrders.map(formatOrder))
  const [cancelled, setCancelled] = useState<any[]>(() => initialCancelled.map(formatOrder))
  const [slots, setSlots] = useState<any[]>(initialSlots)
  const [baristas] = useState<any[]>(initialBaristas)
  const [storeStatus, setStoreStatus] = useState<'live' | 'paused' | 'emergency'>(
    shopDoc?.isShopOpen ? 'live' : 'paused',
  )
  const [expanded, setExpanded] = useState<string | null>(null)
  const [peek, setPeek] = useState<{ id: string; x: number; y: number } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [rightPanel, setRightPanel] = useState<string | null>(null)
  const [selectedBaristas, setSelectedBaristas] = useState<Record<string, string>>({})
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [currentShopId, setCurrentShopId] = useState<string | null>(
    shopDoc?.id ? String(shopDoc.id) : null,
  )
  const [currentShopDoc, setCurrentShopDoc] = useState<any>(shopDoc)
  const [shopSwitching, setShopSwitching] = useState(false)

  const shopId = currentShopId

  // ── Toast helper ──────────────────────────────────────────────────────────
  const notify = useCallback((msg: string, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2400)
  }, [])

  // ── Shop switcher (admin only) ─────────────────────────────────────────────
  const handleShopSwitch = useCallback(
    async (newShopId: string) => {
      if (newShopId === currentShopId) return
      setShopSwitching(true)
      try {
        const res = await fetch(`/api/shop-manager/dashboard-data?shopId=${newShopId}`)
        if (!res.ok) throw new Error('Failed to load shop data')
        const data = await res.json()
        setOrders(data.orders.map(formatOrder))
        setCancelled(data.cancelled.map(formatOrder))
        setSlots(data.slots)
        setCurrentShopId(newShopId)
        setCurrentShopDoc(data.shop)
        setStoreStatus(data.shop?.isShopOpen ? 'live' : 'paused')
        setExpanded(null)
        setSearch('')
        setFilter('all')
      } catch (e: any) {
        notify(e.message || 'Failed to switch shop', 'err')
      } finally {
        setShopSwitching(false)
      }
    },
    [currentShopId, notify],
  )

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io()

    const matchesShop = (raw: any) => {
      if (!currentShopId) return true
      const rawShopId =
        typeof raw.shop === 'object' && raw.shop !== null ? String(raw.shop.id) : String(raw.shop)
      return rawShopId === currentShopId
    }

    socket.on('order-created', (raw: any) => {
      if (raw.paymentStatus !== 'paid' || !matchesShop(raw)) return
      const formatted = formatOrder(raw)
      setOrders((prev) => {
        if (prev.find((o) => o.id === formatted.id)) return prev
        return [formatted, ...prev]
      })
      notify('🔔 New order received!', 'ok')
    })

    socket.on('order-updated', (raw: any) => {
      if (!matchesShop(raw)) return
      const formatted = formatOrder(raw)
      const sec = getOrderSection(raw)
      if (!sec || raw.paymentStatus !== 'paid') {
        if (
          raw.appOrderStatus === 'cancelled' ||
          raw.appOrderStatusDine === 'cancelled' ||
          raw.orderAcceptance === 'rejected'
        ) {
          setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
          setCancelled((prev) => {
            if (prev.find((o) => o.id === formatted.id)) return prev
            return [formatted, ...prev]
          })
        } else {
          setOrders((prev) => prev.filter((o) => o.id !== formatted.id))
        }
      } else {
        setOrders((prev) => prev.map((o) => (o.id === formatted.id ? formatted : o)))
      }
    })

    socket.on('slot-updated', (slot: any) => {
      setSlots((prev) => prev.map((s) => (String(s.id) === String(slot.id) ? slot : s)))
    })

    socket.on('shop-status-updated', (shop: any) => {
      if (currentShopId && String(shop.id) !== currentShopId) return
      setStoreStatus(shop.isShopOpen ? 'live' : 'paused')
    })

    return () => {
      socket.disconnect()
    }
  }, [notify, currentShopId])

  // ── Filtering ─────────────────────────────────────────────────────────────
  const applyFilter = (o: any) => {
    if (search) {
      const q = search.toLowerCase()
      if (!o.no.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q)) return false
    }
    if (filter === 'all') return true
    if (filter === 'takeaway') return o.type === 'takeaway'
    if (filter === 'dine-in') return o.type === 'dine-in'
    if (filter === 'delayed') return o.delayed
    if (filter === 'slot') return o.slot !== null && o.slot !== 'Immediate'
    if (filter === 'now') return o.slot === 'Immediate'
    return true
  }

  // ── API helpers ───────────────────────────────────────────────────────────
  const setLoading = (id: string, v: boolean) => setLoadingIds((p) => ({ ...p, [id]: v }))

  const patchOrder = async (orderId: string, data: any) => {
    setLoading(orderId, true)
    try {
      const res = await fetch('/api/shop-manager/update-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...data }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Update failed')
      }
    } catch (e: any) {
      notify(e.message || 'Error updating order', 'err')
    } finally {
      setLoading(orderId, false)
    }
  }

  const handleAdvance = async (order: any) => {
    const nextStatus =
      order.status === 'queued' ? 'preparing' : order.status === 'prep' ? 'ready' : 'completed'
    const field = order.type === 'dine-in' ? 'appOrderStatusDine' : 'appOrderStatus'
    await patchOrder(order.id, { [field]: nextStatus })

    if (nextStatus === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      notify('Order completed ✓')
    } else {
      setOrders((prev) => prev.map((o) => (o.id !== order.id ? o : { ...o, status: nextStatus })))
      notify('Order advanced')
    }
  }

const handleAccept = async (order: any) => {
    const baristaId = selectedBaristas[order.id]
    await patchOrder(order.id, {
      orderAcceptance: 'accepted',
      appOrderStatus: 'preparing',
      appOrderStatusDine: 'preparing',
      ...(baristaId ? { barista: Number(baristaId) } : {}),
    })
    setOrders((prev) =>
      prev.map((o) =>
        o.id !== order.id
          ? o
          : {
              ...o,
              status: 'prep',
              baristaId: baristaId || o.baristaId,
            },
      ),
    )
    notify('Order accepted ✓')
  }

  const handleReject = async (order: any) => {
    setLoading(order.id, true)
    try {
      const res = await fetch('/api/shop-manager/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: 'Rejected by manager' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Reject failed')
      }
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      setCancelled((prev) => [{ ...order, cancelReason: 'Rejected by manager' }, ...prev])
      if (expanded === order.id) setExpanded(null)
      notify('Order rejected & refund initiated', 'warn')
    } catch (e: any) {
      notify(e.message || 'Error rejecting order', 'err')
    } finally {
      setLoading(order.id, false)
    }
  }

  const handleRestore = async (id: string) => {
    const o = cancelled.find((x) => x.id === id)
    if (!o) return
    await patchOrder(id, {
      orderAcceptance: 'pending',
      appOrderStatus: 'pending',
      appOrderStatusDine: 'pending',
    })
    setCancelled((prev) => prev.filter((x) => x.id !== id))
    setOrders((prev) => [{ ...o, status: 'new' }, ...prev])
    notify('Order restored')
  }

  const handleSlotAct = async (slotId: string, action: string) => {
    const slot = slots.find((s) => String(s.id) === String(slotId))
    if (!slot) return
    let data: any = {}
    if (action === 'disable') data = { isActive: false }
    if (action === 'enable') data = { isActive: true }
    if (action === 'reduce') data = { maxCapacity: Math.max(1, (slot.maxCapacity || 1) - 2) }
    if (action === 'increase') data = { maxCapacity: (slot.maxCapacity || 0) + 2 }

    const res = await fetch('/api/shop-manager/update-slot', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, ...data }),
    })
    if (res.ok) {
      const { slot: updated } = await res.json()
      setSlots((prev) => prev.map((s) => (String(s.id) === String(slotId) ? updated : s)))
      notify(`Slot ${action}d`)
    } else {
      notify('Slot update failed', 'err')
    }
  }

  const handleStoreStatus = async (status: 'live' | 'paused' | 'emergency') => {
    if (!shopId) {
      setStoreStatus(status)
      return
    }
    // Emergency is a UI-only concept — just close the shop
    const isOpen = status === 'live'
    setStoreStatus(status)
    const res = await fetch('/api/shop-manager/update-shop', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, isShopOpen: isOpen }),
    })
    if (!res.ok) notify('Store status update failed', 'err')
    else {
      const msgs = {
        live: 'Store is live 🟢',
        paused: 'Store paused ⏸',
        emergency: 'Emergency stop! 🔴',
      }
      notify(msgs[status], status === 'live' ? 'ok' : 'warn')
    }
  }

  const peekHandlers = {
    onEnter: (e: React.MouseEvent, id: string) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setPeek({ id, x: r.left, y: r.bottom + 6 })
    },
    onLeave: () => setPeek(null),
  }

  const counts = { new: 0, queued: 0, prep: 0, ready: 0 }
  orders.forEach((o) => {
    if (o.status in counts) (counts as any)[o.status]++
  })

  const peekOrder = peek ? orders.find((o) => o.id === peek.id) : null

  return (
    <div
      className="smd-root"
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
        storeStatus={storeStatus}
        counts={counts}
        cancelledCount={cancelled.length}
        search={search}
        onSearch={setSearch}
        rightPanel={rightPanel}
        onPanelToggle={(p) => setRightPanel((prev) => (prev === p ? null : p))}
        onGoLive={() => handleStoreStatus('live')}
        onPause={() => handleStoreStatus('paused')}
        shopName={currentShopDoc?.address?.street || 'White Mantis'}
        isAdmin={isAdmin}
        allShops={allShops}
        currentShopId={currentShopId}
        onShopChange={handleShopSwitch}
        shopSwitching={shopSwitching}
      />

      <FilterBar filter={filter} onFilter={setFilter} />

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main scroll */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative', minWidth: 0 }}>
          {SECTIONS.map((sec) => (
            <OrderSection
              key={sec.key}
              section={sec}
              orders={orders.filter((o) => o.status === sec.key && applyFilter(o))}
              baristas={baristas}
              expanded={expanded}
              selectedBaristas={selectedBaristas}
              loadingIds={loadingIds}
              peekHandlers={peekHandlers}
              onToggleExpand={(id) => setExpanded((prev) => (prev === id ? null : id))}
              onAdvance={handleAdvance}
              onAccept={handleAccept}
              onReject={handleReject}
              onBaristaChange={(orderId, bId) =>
                setSelectedBaristas((p) => ({ ...p, [orderId]: bId }))
              }
            />
          ))}

          <CancelledSection cancelled={cancelled} baristas={baristas} onRestore={handleRestore} />
        </div>

        {/* Right panel */}
        {rightPanel && (
          <div
            className="slideR"
            style={{
              width: 260,
              background: C.surface,
              borderLeft: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              boxShadow: '-4px 0 16px rgba(0,0,0,.04)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {rightPanel === 'slots' ? 'Slot Management' : 'Barista Status'}
              </span>
              <button
                onClick={() => setRightPanel(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textMute,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {rightPanel === 'slots' && <SlotsPanel slots={slots} orders={orders} onAct={handleSlotAct} />}
              {rightPanel === 'baristas' && <BaristasPanel baristas={baristas} orders={orders} />}
            </div>
          </div>
        )}
      </div>

      {/* Peek tooltip */}
      {peekOrder && peek && <PeekTooltip order={peekOrder} x={peek.x} y={peek.y} />}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
