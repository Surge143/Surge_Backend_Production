// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
// Neutral colours use CSS custom properties so the dark-mode override in
// GLOBAL_STYLES (html[data-theme="dark"] .std-root) switches them automatically.
// Brand/status colours stay as hex — they don't change between themes.
export const C = {
  // ── Neutrals (CSS vars — switch in dark mode) ──
  bg: 'var(--std-bg)',
  surface: 'var(--std-surface)',
  surfaceHover: 'var(--std-surface-hover)',
  border: 'var(--std-border)',
  borderMid: 'var(--std-border-mid)',
  text: 'var(--std-text)',
  textSub: 'var(--std-text-sub)',
  textMute: 'var(--std-text-mute)',
  // ── Status tints (CSS vars — switch in dark mode) ──
  newBg: 'var(--std-new-bg)',
  newBorder: 'var(--std-new-border)',
  shipBg: 'var(--std-ship-bg)',
  shipBorder: 'var(--std-ship-border)',
  doneBg: 'var(--std-done-bg)',
  doneBorder: 'var(--std-done-border)',
  cancelBg: 'var(--std-cancel-bg)',
  cancelBorder: 'var(--std-cancel-border)',
  // ── Brand / status colours (hex — constant across themes) ──
  new: '#2D6A2D',
  shipped: '#1A6B9A',
  delivered: '#8A8070',
  cancelled: '#C0392B',
  // helpers
  live: '#2D6A2D',
  paused: '#d97706',
  emergency: '#C0392B',
}

export const SECTIONS = [
  {
    key: 'new',
    label: 'New Orders',
    color: C.new,
    bg: C.newBg,
    border: C.newBorder,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    color: C.shipped,
    bg: C.shipBg,
    border: C.shipBorder,
  },
] as const

export const FILTER_PRESETS = [
  { key: 'all', label: 'All' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'subscription', label: 'Subscription' },
]

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── Keyframe animations ── */
  @keyframes std-blink{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes std-slip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes std-slideR{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes std-peekIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}

  /* ════════════════════════════════════════════════════════
     LIGHT MODE — CSS custom properties on .std-root
  ════════════════════════════════════════════════════════ */
  .std-root {
    /* Neutrals */
    --std-bg: #ffffff;
    --std-surface: #ffffff;
    --std-surface-hover: #f1f5f9;
    --std-border: #D4C9B0;
    --std-border-mid: #BFB49A;
    --std-text: #1A1A14;
    --std-text-sub: #8A8070;
    --std-text-mute: #B0A898;
    /* Status tints */
    --std-new-bg: #EAF4EA;
    --std-new-border: #b8ddb8;
    --std-ship-bg: #E4F2FA;
    --std-ship-border: #a8d4ee;
    --std-done-bg: #F0EDE8;
    --std-done-border: #D4C9B0;
    --std-cancel-bg: #FDECEB;
    --std-cancel-border: #f0b8b4;
  }

  /* ════════════════════════════════════════════════════════
     DARK MODE — overrides when PayloadCMS sets data-theme="dark"
  ════════════════════════════════════════════════════════ */
  html[data-theme="dark"] .std-root {
    /* Neutrals — true black */
    --std-bg: #0a0a0a;
    --std-surface: #141414;
    --std-surface-hover: #1f1f1f;
    --std-border: #2a2a2a;
    --std-border-mid: #383838;
    --std-text: #f0f0f0;
    --std-text-sub: #b0b0b0;
    --std-text-mute: #666666;
    /* Status tints — desaturated dark */
    --std-new-bg: #0a1a0a;
    --std-new-border: #1a4a1a;
    --std-ship-bg: #081520;
    --std-ship-border: #1a4a6a;
    --std-done-bg: #181614;
    --std-done-border: #383228;
    --std-cancel-bg: #1e0a08;
    --std-cancel-border: #6a1a14;
  }

  /* ── All rules scoped to .std-root — never touches the Payload sidebar ── */
  .std-root, .std-root *{box-sizing:border-box;margin:0;padding:0}
  .std-root ::-webkit-scrollbar{width:4px;height:4px}
  .std-root ::-webkit-scrollbar-track{background:transparent}
  .std-root ::-webkit-scrollbar-thumb{background:var(--std-border-mid);border-radius:4px}
  .std-root button{cursor:pointer;font-family:'Inter','DM Sans',system-ui,sans-serif}
  .std-root input,.std-root select,.std-root textarea{font-family:'Inter','DM Sans',system-ui,sans-serif}

  .std-root .blink{animation:std-blink 2.5s step-end infinite}
  .std-root .slip{animation:std-slip .15s ease}
  .std-root .peekIn{animation:std-peekIn .12s ease}
  .std-root .slideR{animation:std-slideR .16s ease}

  .std-root .hrow:hover{background:var(--std-surface-hover)!important}
  .std-root .crow:hover{background:var(--std-cancel-bg)!important}

  /* ── Responsive grid columns ── */
  .std-root .std-order-grid{display:grid;grid-template-columns:90px 70px 200px 120px 100px 0.9fr 180px}
  .std-root .std-cancel-grid{display:grid;grid-template-columns:90px 70px 200px 120px 100px 0.9fr 160px}
  @media(max-width:1200px){
    .std-root .std-order-grid{grid-template-columns:80px 60px 160px 100px 85px 0.9fr 160px}
    .std-root .std-cancel-grid{grid-template-columns:80px 60px 160px 100px 85px 0.9fr 140px}
  }
  @media(max-width:900px){
    .std-root .std-order-grid{grid-template-columns:70px 55px 140px 90px 75px 1fr 130px}
    .std-root .std-cancel-grid{grid-template-columns:70px 55px 140px 90px 75px 1fr 120px}
    .std-root .std-hide{display:none!important}
    .std-root .topbar-search{min-width:80px!important;max-width:180px!important}
  }

  /* ── TopBar responsive ── */
  .std-root .topbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  @media(max-width:900px){
    .std-root .topbar{gap:5px;padding:8px 12px!important}
    .std-root .topbar-count-chip{display:none!important}
  }
  @media(max-width:680px){
    .std-root .topbar{gap:4px}
    .std-root .topbar-search{order:10;flex:1 1 100%!important;max-width:100%!important}
  }
`

/** Format a raw web-order Payload doc for the dashboard */
export function formatOrder(o: any) {
  // ── Order number ───────────────────────────────────────────────────────────
  const no = o.invoiceId ? `#${o.invoiceId}` : `#ORD-${String(o.id)}`

  // ── Customer name ──────────────────────────────────────────────────────────
  let customer = 'Guest'
  const addr = o.shippingAddress
  if (addr?.addressFirstName || addr?.addressLastName) {
    customer = [addr.addressFirstName, addr.addressLastName].filter(Boolean).join(' ').trim()
  } else if (o.user && typeof o.user === 'object') {
    const u = o.user
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
    customer = full || u.email || 'Guest'
  } else if (o.email) {
    customer = o.email
  }

  // ── Phone & address ────────────────────────────────────────────────────────
  const phone = addr?.phoneNumber || ''
  const shippingAddress = addr
    ? {
        name: [addr.addressFirstName, addr.addressLastName].filter(Boolean).join(' ').trim() || null,
        line1: addr.addressLine1 || null,
        line2: addr.addressLine2 || null,
        city: addr.city || null,
        emirates: addr.emirates || null,
        country: addr.addressCountry || 'United Arab Emirates',
        phone: addr.phoneNumber || null,
      }
    : null
  // Kept for the summary row display
  const addressLine = [addr?.addressLine1, addr?.city, addr?.emirates].filter(Boolean).join(', ')

  // ── Type & status ──────────────────────────────────────────────────────────
  const type: 'delivery' | 'pickup' = o.deliveryOption === 'delivery' ? 'delivery' : 'pickup'

  const statusMap: Record<string, string> = {
    placed: 'new',
    shipped: 'shipped',
    delivered: 'delivered',
  }
  const status = statusMap[o.deliveryStatus] || 'cancelled'

  // ── Slot display ───────────────────────────────────────────────────────────
  const slot = type === 'pickup' ? 'Pickup' : 'Delivery'

  // ── Items ──────────────────────────────────────────────────────────────────
  const items = (o.items || []).map((item: any) => {
    const productDoc = typeof item.product === 'object' && item.product !== null ? item.product : null
    return {
      name: item.productName || productDoc?.name || 'Unnamed product',
      variant: item.variantName || '',
      tagline: productDoc?.tagline || productDoc?.shortDescription || '',
      qty: item.quantity || 1,
      price: item.price || 0,
    }
  })

  // ── Financials ─────────────────────────────────────────────────────────────
  const total = o.financials?.total || 0

  // ── Time ──────────────────────────────────────────────────────────────────
  const time = new Date(o.createdAt).toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  // ── Reward (subscription origin) ──────────────────────────────────────────
  const reward = Boolean(o.origin === 'subscription')

  return {
    id: String(o.id),
    no,
    customer,
    email: o.email || '',
    phone,
    address: addressLine,
    shippingAddress,
    type,
    origin: o.origin || 'one-time',
    status,
    slot,
    time,
    items,
    total,
    reward,
    isPickupReady: Boolean(o.isPickupReady),
    delayed: false,
    raw: o,
  }
}
