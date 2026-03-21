// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Neutral colours use CSS custom properties so the dark-mode override in
// GLOBAL_STYLES (html[data-theme="dark"] .smd-root) switches them automatically.
// Brand/status colours stay as hex — they don't change between themes.
export const C = {
  // ── Neutrals (CSS vars — switch in dark mode) ──
  bg: 'var(--smd-bg)',
  surface: 'var(--smd-surface)',
  surfaceHover: 'var(--smd-surface-hover)',
  border: 'var(--smd-border)',
  borderMid: 'var(--smd-border-mid)',
  text: 'var(--smd-text)',
  textSub: 'var(--smd-text-sub)',
  textMute: 'var(--smd-text-mute)',
  textFaint: 'var(--smd-text-faint)',
  // ── Status tints (CSS vars — switch in dark mode) ──
  newBg: 'var(--smd-new-bg)',
  newBorder: 'var(--smd-new-border)',
  prepBg: 'var(--smd-prep-bg)',
  prepBorder: 'var(--smd-prep-border)',
  readyBg: 'var(--smd-ready-bg)',
  readyBorder: 'var(--smd-ready-border)',
  queuedBg: 'var(--smd-queued-bg)',
  queuedBorder: 'var(--smd-queued-border)',
  cancelBg: 'var(--smd-cancel-bg)',
  cancelBorder: 'var(--smd-cancel-border)',
  takeawayBg: 'var(--smd-takeaway-bg)',
  dineInBg: 'var(--smd-dine-in-bg)',
  lateBg: 'var(--smd-late-bg)',
  rewardBg: 'var(--smd-reward-bg)',
  rewardConflictBg: 'var(--smd-reward-conflict-bg)',
  custPickBg: 'var(--smd-cust-pick-bg)',
  autoBg: 'var(--smd-auto-bg)',
  fallbackBg: 'var(--smd-fallback-bg)',
  // ── Brand / status colours (hex — constant across themes) ──
  new: '#2563eb',
  queued: '#7c3aed',
  prep: '#d97706',
  ready: '#16a34a',
  cancelled: '#dc2626',
  takeaway: '#0891b2',
  dineIn: '#4f46e5',
  late: '#dc2626',
  reward: '#d97706',
  rewardConflict: '#7c3aed',
  custPick: '#7c3aed',
  auto: '#0284c7',
  fallback: '#ea580c',
  live: '#16a34a',
  paused: '#d97706',
  emergency: '#dc2626',
}

export const SECTIONS = [
  { key: 'new', label: 'New Orders', color: C.new, bg: C.newBg, border: C.newBorder },
  { key: 'queued', label: 'Accepted — Waiting to start Preparation', color: C.queued, bg: C.queuedBg, border: C.queuedBorder },
  { key: 'prep', label: 'In Preparation', color: C.prep, bg: C.prepBg, border: C.prepBorder },
  { key: 'ready', label: 'Ready for Pickup', color: C.ready, bg: C.readyBg, border: C.readyBorder },
] as const

export const FILTER_PRESETS = [
  { key: 'all', label: 'All' },
  { key: 'takeaway', label: 'Takeaway' },
  { key: 'dine-in', label: 'Dine-in' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'slot', label: 'Slot' },
  { key: 'now', label: 'Immediate' },
]

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── Keyframe animations ── */
  @keyframes smd-blink{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes smd-slip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes smd-peekIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes smd-slideR{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}

  /* ════════════════════════════════════════════════════════
     LIGHT MODE — CSS custom properties on .smd-root
  ════════════════════════════════════════════════════════ */
  .smd-root {
    /* Neutrals */
    --smd-bg: #f8fafc;
    --smd-surface: #ffffff;
    --smd-surface-hover: #f1f5f9;
    --smd-border: #e2e8f0;
    --smd-border-mid: #cbd5e1;
    --smd-text: #0f172a;
    --smd-text-sub: #475569;
    --smd-text-mute: #94a3b8;
    --smd-text-faint: #cbd5e1;
    --smd-text-mute-raw: #94a3b8;
    /* Status tints */
    --smd-new-bg: #eff6ff;
    --smd-new-border: #bfdbfe;
    --smd-prep-bg: #fffbeb;
    --smd-prep-border: #fde68a;
    --smd-ready-bg: #f0fdf4;
    --smd-ready-border: #bbf7d0;
    --smd-queued-bg: #f5f3ff;
    --smd-queued-border: #c4b5fd;
    --smd-cancel-bg: #fef2f2;
    --smd-cancel-border: #fecaca;
    --smd-takeaway-bg: #ecfeff;
    --smd-dine-in-bg: #eef2ff;
    --smd-late-bg: #fef2f2;
    --smd-reward-bg: #fffbeb;
    --smd-reward-conflict-bg: #f5f3ff;
    --smd-cust-pick-bg: #f5f3ff;
    --smd-auto-bg: #e0f2fe;
    --smd-fallback-bg: #fff7ed;
    /* Store status chips */
    --smd-live-bg: #f0fdf4;
    --smd-live-border: #bbf7d0;
    --smd-paused-bg: #fffbeb;
    --smd-paused-border: #fde68a;
    --smd-emergency-bg: #fef2f2;
    --smd-emergency-border: #fecaca;
  }

  /* ════════════════════════════════════════════════════════
     DARK MODE — overrides when PayloadCMS sets data-theme="dark"
  ════════════════════════════════════════════════════════ */
  html[data-theme="dark"] .smd-root {
    /* Neutrals — true black, no blue tint */
    --smd-bg: #0a0a0a;
    --smd-surface: #141414;
    --smd-surface-hover: #1f1f1f;
    --smd-border: #2a2a2a;
    --smd-border-mid: #383838;
    --smd-text: #f0f0f0;
    --smd-text-sub: #b0b0b0;
    --smd-text-mute: #666666;
    --smd-text-faint: #333333;
    --smd-text-mute-raw: #666666;
    /* Status tints — desaturated dark for black bg */
    --smd-new-bg: #0d1a2e;
    --smd-new-border: #1d4ed8;
    --smd-prep-bg: #1e1200;
    --smd-prep-border: #b45309;
    --smd-ready-bg: #081a0f;
    --smd-ready-border: #166534;
    --smd-queued-bg: #160b2e;
    --smd-queued-border: #6d28d9;
    --smd-cancel-bg: #1e0808;
    --smd-cancel-border: #991b1b;
    --smd-takeaway-bg: #061520;
    --smd-dine-in-bg: #0e0d22;
    --smd-late-bg: #1e0808;
    --smd-reward-bg: #1e1200;
    --smd-reward-conflict-bg: #160b2e;
    --smd-cust-pick-bg: #160b2e;
    --smd-auto-bg: #061520;
    --smd-fallback-bg: #1e0a00;
    /* Store status chips */
    --smd-live-bg: #081a0f;
    --smd-live-border: #166534;
    --smd-paused-bg: #1e1200;
    --smd-paused-border: #b45309;
    --smd-emergency-bg: #1e0808;
    --smd-emergency-border: #991b1b;
  }

  /* ── All rules scoped to .smd-root — never touches the Payload sidebar ── */
  .smd-root, .smd-root *{box-sizing:border-box;margin:0;padding:0}
  .smd-root ::-webkit-scrollbar{width:4px;height:4px}
  .smd-root ::-webkit-scrollbar-track{background:transparent}
  .smd-root ::-webkit-scrollbar-thumb{background:var(--smd-border-mid);border-radius:4px}
  .smd-root button{cursor:pointer;font-family:'Inter','DM Sans',system-ui,sans-serif}
  .smd-root input,.smd-root select,.smd-root textarea{font-family:'Inter','DM Sans',system-ui,sans-serif}

  .smd-root .blink{animation:smd-blink 2.5s step-end infinite}
  .smd-root .slip{animation:smd-slip .15s ease}
  .smd-root .peekIn{animation:smd-peekIn .12s ease}
  .smd-root .slideR{animation:smd-slideR .16s ease}

  .smd-root .hrow:hover{background:var(--smd-surface-hover)!important}
  .smd-root .crow:hover{background:var(--smd-cancel-bg)!important}

  /* ── Responsive grid columns ── */
  .smd-root .order-grid{display:grid;grid-template-columns:90px 68px 175px 140px 110px 1fr 110px 175px}
  .smd-root .cancel-grid{display:grid;grid-template-columns:90px 68px 175px 140px 110px 1fr 140px 110px}
  @media(max-width:1200px){
    .smd-root .order-grid{grid-template-columns:75px 58px 145px 115px 90px 1fr 90px 145px}
    .smd-root .cancel-grid{grid-template-columns:75px 58px 145px 115px 90px 1fr 115px 90px}
  }
  @media(max-width:900px){
    .smd-root .order-grid{grid-template-columns:65px 52px 125px 100px 78px 1fr 130px}
    .smd-root .order-grid>.col-flags{display:none!important}
    .smd-root .cancel-grid{grid-template-columns:65px 52px 125px 100px 78px 1fr 110px 85px}
    .smd-root .smd-hide{display:none!important}
    .smd-root .topbar-search{min-width:80px!important;max-width:180px!important}
  }

  /* ── TopBar responsive ── */
  .smd-root .topbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  @media(max-width:900px){
    .smd-root .topbar{gap:5px;padding:8px 12px!important}
    .smd-root .topbar-count-chip{display:none!important}
  }
  @media(max-width:680px){
    .smd-root .topbar{gap:4px}
    .smd-root .topbar-search{order:10;flex:1 1 100%!important;max-width:100%!important}
    .smd-root .topbar-panels{margin-left:0!important}
    .smd-root .topbar-controls{flex-wrap:wrap}
  }
`

// ── Derived status helpers ──────────────────────────────────────────────────
/** Map a raw Payload order doc → dashboard section key */
export function getOrderSection(order: any): 'new' | 'queued' | 'prep' | 'ready' | null {
  if (order.orderAcceptance === 'pending') return 'new'
  if (order.orderAcceptance !== 'accepted') return null
  const status = order.orderType === 'dine-in' ? order.appOrderStatusDine : order.appOrderStatus
  if (status === 'preparing') return 'prep'
  if (status === 'ready') return 'ready'
  if (status === 'pending') return 'queued'
  return null
}

/** Format a Payload order doc for the dashboard */
export function formatOrder(o: any) {
  // ── Slot time ──────────────────────────────────────────────────────────────
  // The order has its own `timeSelection` ('now' | 'custom'), and optionally a
  // populated `slot` doc. The slot doc also has `timeSelection` and a `slot`
  // date field (only present when slot.timeSelection === 'custom').
  let slotTime: string | null = null
  const slotDoc = typeof o.slot === 'object' && o.slot !== null ? o.slot : null

  if (o.timeSelection === 'now') {
    slotTime = 'Immediate'
  } else if (slotDoc) {
    if (slotDoc.timeSelection === 'now') {
      slotTime = 'Immediate'
    } else if (slotDoc.slot) {
      // slotDoc.slot is an ISO date string (time-only picker stores full ISO)
      try {
        slotTime = new Date(slotDoc.slot).toLocaleTimeString('en-AE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      } catch {
        slotTime = String(slotDoc.slot)
      }
    }
  }

  // ── Barista ────────────────────────────────────────────────────────────────
  const baristaId = typeof o.barista === 'object' ? o.barista?.id : o.barista

  // ── Customer name ──────────────────────────────────────────────────────────
  // Users collection uses firstName + lastName (no single `name` field)
  const user = o.user
  let customerName = 'Guest'
  if (user && typeof user === 'object') {
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    customerName = full || user.email || user.name || 'Guest'
  } else if (o.email) {
    customerName = o.email
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  // customizations is an array of { sectionTitle, label, price } objects
  const items = (o.items || []).map((item: any) => {
    const product = typeof item.product === 'object' ? item.product : null
    const name = product?.name || 'Item'
    const qty: number = item.quantity || 1
    const customs: Array<{ sectionTitle: string; label: string; price: number }> =
      Array.isArray(item.customizations)
        ? item.customizations.filter((c: any) => c && typeof c === 'object' && c.label)
        : []
    return { name, qty, customs }
  })

  return {
    id: String(o.id),
    no: `#${String(o.id).slice(-4).toUpperCase()}`,
    customer: customerName,
    type: o.orderType === 'dine-in' ? 'dine-in' : 'takeaway',
    status: getOrderSection(o) || 'new',
    baristaId: baristaId ? String(baristaId) : null,
    slot: slotTime,
    slotId: slotDoc?.id ?? (typeof o.slot === 'string' ? o.slot : null),
    time: new Date(o.createdAt).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    items,
    reward: Boolean(o.stampRewards?.length || o.coinsUsed),
    delayed: false,
    raw: o,
  }
}
