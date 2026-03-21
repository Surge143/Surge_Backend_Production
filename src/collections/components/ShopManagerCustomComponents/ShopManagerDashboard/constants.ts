// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const C = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderMid: '#cbd5e1',
  text: '#0f172a',
  textSub: '#475569',
  textMute: '#94a3b8',
  textFaint: '#cbd5e1',
  new: '#2563eb',
  newBg: '#eff6ff',
  newBorder: '#bfdbfe',
  prep: '#d97706',
  prepBg: '#fffbeb',
  prepBorder: '#fde68a',
  ready: '#16a34a',
  readyBg: '#f0fdf4',
  readyBorder: '#bbf7d0',
  cancelled: '#dc2626',
  cancelBg: '#fef2f2',
  cancelBorder: '#fecaca',
  takeaway: '#0891b2',
  takeawayBg: '#ecfeff',
  dineIn: '#4f46e5',
  dineInBg: '#eef2ff',
  late: '#dc2626',
  lateBg: '#fef2f2',
  reward: '#d97706',
  rewardBg: '#fffbeb',
  rewardConflict: '#7c3aed',
  rewardConflictBg: '#f5f3ff',
  custPick: '#7c3aed',
  custPickBg: '#f5f3ff',
  auto: '#0284c7',
  autoBg: '#e0f2fe',
  fallback: '#ea580c',
  fallbackBg: '#fff7ed',
  live: '#16a34a',
  paused: '#d97706',
  emergency: '#dc2626',
}

export const SECTIONS = [
  { key: 'new', label: 'New Orders', color: C.new, bg: C.newBg, border: C.newBorder },
  { key: 'prep', label: 'In Preparation', color: C.prep, bg: C.prepBg, border: C.prepBorder },
  { key: 'ready', label: 'Ready for Pickup', color: C.ready, bg: C.readyBg, border: C.readyBorder },
] as const

export const FILTER_PRESETS = [
  { key: 'all', label: 'All' },
  { key: 'takeaway', label: 'Takeaway' },
  { key: 'dine-in', label: 'Dine-in' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'reward', label: 'Reward' },
  { key: 'fallback', label: 'Fallback' },
]

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
  button{cursor:pointer;font-family:inherit}
  input,select,textarea{font-family:inherit}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}.blink{animation:blink 2.5s step-end infinite}
  @keyframes slip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.slip{animation:slip .15s ease}
  @keyframes peekIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.peekIn{animation:peekIn .12s ease}
  @keyframes slideR{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}.slideR{animation:slideR .16s ease}
  .hrow:hover{background:#f8fafc !important}
  .crow:hover{background:#fef2f2 !important}
`

// ── Derived status helpers ──────────────────────────────────────────────────
/** Map a raw Payload order doc → dashboard section key: 'new' | 'prep' | 'ready' */
export function getOrderSection(order: any): 'new' | 'prep' | 'ready' | null {
  if (order.orderAcceptance === 'pending') return 'new'
  if (order.orderAcceptance !== 'accepted') return null
  const status = order.orderType === 'dine-in' ? order.appOrderStatusDine : order.appOrderStatus
  if (status === 'preparing') return 'prep'
  if (status === 'ready') return 'ready'
  if (status === 'pending') return 'new'
  return null
}

/** Format a Payload order doc for the dashboard */
export function formatOrder(o: any) {
  const slot = o.slot
  const slotTime = slot
    ? typeof slot === 'object' && slot.slot
      ? new Date(slot.slot).toLocaleTimeString('en-AE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : String(slot)
    : null

  const baristaId = typeof o.barista === 'object' ? o.barista?.id : o.barista

  const items: string[] = (o.items || []).map((item: any) => {
    const product = typeof item.product === 'object' ? item.product : null
    const name = product?.name || 'Item'
    const qty = item.quantity > 1 ? ` ×${item.quantity}` : ''
    const customs: string[] = Object.values(item.customizations || {}).filter(Boolean) as string[]
    return `${name}${qty}${customs.length ? ` — ${customs.join(', ')}` : ''}`
  })

  return {
    id: String(o.id),
    no: `#${String(o.id).slice(-4).toUpperCase()}`,
    customer: o.user?.name || o.email || 'Guest',
    type: o.orderType === 'dine-in' ? 'dine-in' : 'takeaway',
    status: getOrderSection(o) || 'new',
    baristaId: baristaId ? String(baristaId) : null,
    slot: slotTime,
    slotId: typeof o.slot === 'object' ? o.slot?.id : o.slot,
    time: new Date(o.createdAt).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    items,
    reward: Boolean(o.stampRewards?.length || o.coinsUsed),
    delayed: false, // computed separately if needed
    raw: o,
  }
}
