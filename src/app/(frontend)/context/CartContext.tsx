'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export interface CartItem {
  product: number | string
  vId: string
  name: string
  variantName: string
  price: number
  image: string
  quantity: number
  tagline?: string
}

interface MixedCartError {
  currentOrigin: 'cafe' | 'store'
  pendingProductId: number | string
  pendingVId: string
  pendingQuantity: number
}

interface CartContextType {
  cart: CartItem[]
  totalItems: number
  subtotal: number
  loading: boolean
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (productId: number | string, vId?: string, quantity?: number) => Promise<void>
  removeFromCart: (productId: number | string, vId?: string) => Promise<void>
  updateQuantity: (productId: number | string, action: 'increment' | 'decrement', vId?: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
  // Mixed-cart state — set when user tries to mix cafe+store items
  mixedCartError: MixedCartError | null
  resolveMixedCart: (replace: boolean) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mixedCartError, setMixedCartError] = useState<MixedCartError | null>(null)
  const hasFetched = useRef(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/website/cart', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
      } else {
        setCart([])
      }
    } catch {
      setCart([])
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchCart()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCart()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchCart])

  const refreshCart = useCallback(async () => {
    await fetchCart()
  }, [fetchCart])

  // ── Core add to cart — handles MIXED_CART response ──────────────────────
  const doAddToCart = useCallback(async (
    productId: number | string,
    vId = '',
    quantity = 1,
  ) => {
    setLoading(true)
    try {
      const res = await fetch('/api/website/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product: productId, vId, quantity }),
      })
      const data = await res.json()

      if (res.status === 401) {
        // Not authenticated — redirect to login
        window.location.href = '/login'
        return
      }

      if (!res.ok) {
        if (data.error === 'MIXED_CART') {
          // Surface a replacement dialog instead of throwing
          setMixedCartError({
            currentOrigin: data.currentOrigin,
            pendingProductId: productId,
            pendingVId: vId,
            pendingQuantity: quantity,
          })
          return
        }
        throw new Error(data.error || 'Failed to add to cart')
      }

      setCart(data.items || [])
      setCartOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const addToCart = useCallback(async (
    productId: number | string,
    vId = '',
    quantity = 1,
  ) => {
    await doAddToCart(productId, vId, quantity)
  }, [doAddToCart])

  // ── Called when user chooses "Replace" or "Keep" in the mixed-cart dialog ──
  const resolveMixedCart = useCallback(async (replace: boolean) => {
    if (!mixedCartError) return
    const { pendingProductId, pendingVId, pendingQuantity } = mixedCartError
    setMixedCartError(null)

    if (!replace) return // user chose to keep existing cart

    // Clear the existing cart then add the new item
    setLoading(true)
    try {
      await fetch('/api/app/cart', { method: 'DELETE', credentials: 'include' }).catch(() => {})
      await fetch('/api/website/cart/clear', { method: 'POST', credentials: 'include' })
      const res = await fetch('/api/website/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product: pendingProductId, vId: pendingVId, quantity: pendingQuantity }),
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
        setCartOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [mixedCartError])

  const removeFromCart = useCallback(async (productId: number | string, vId = '') => {
    setLoading(true)
    try {
      const res = await fetch('/api/website/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product: productId, vId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuantity = useCallback(async (
    productId: number | string,
    action: 'increment' | 'decrement',
    vId = '',
  ) => {
    setLoading(true)
    try {
      const res = await fetch('/api/website/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product: productId, vId, action }),
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCart = useCallback(() => {
    fetch('/api/website/cart/clear', { method: 'POST', credentials: 'include' }).catch(() => {})
    setCart([])
  }, [])

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart, totalItems, subtotal, loading, cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQuantity, clearCart, refreshCart,
      mixedCartError, resolveMixedCart,
    }}>
      {children}

      {/* ── Global Mixed-Cart Dialog ── */}
      {mixedCartError && (
        <div style={dialogStyles.overlay}>
          <div className="glass animate-up" style={dialogStyles.dialog}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>
              {mixedCartError.currentOrigin === 'cafe' ? '☕' : '🛍️'}
            </div>
            <h3 style={dialogStyles.title}>Replace Cart?</h3>
            <p style={dialogStyles.body}>
              Your cart has{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {mixedCartError.currentOrigin === 'cafe' ? 'Cafe' : 'Store'}
              </strong>{' '}
              items. Adding this item will start a new cart from the{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {mixedCartError.currentOrigin === 'cafe' ? 'Store' : 'Cafe'}
              </strong>
              . Do you want to clear your current cart?
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn-outline"
                style={{ flex: 1, padding: '14px' }}
                onClick={() => resolveMixedCart(false)}
              >
                Keep {mixedCartError.currentOrigin === 'cafe' ? 'Cafe' : 'Store'} Cart
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '14px' }}
                onClick={() => resolveMixedCart(true)}
              >
                Replace Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

const dialogStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
  },
  dialog: {
    maxWidth: '420px', width: '100%', padding: '36px', borderRadius: '24px',
  },
  title: {
    fontSize: '22px', fontWeight: '900', textAlign: 'center', marginBottom: '12px',
  },
  body: {
    fontSize: '15px', opacity: 0.7, textAlign: 'center', lineHeight: '1.6',
  },
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
