'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const GUEST_CART_KEY = 'wm-guest-cart'

export interface CartItem {
    product: string
    vId?: string
    quantity: number
    name: string
    price: number
    image?: string
    variantName?: string
}

interface CartContextType {
    items: CartItem[]
    itemCount: number
    totalPrice: number
    isGuest: boolean
    addItem: (item: Partial<CartItem> & { product: string; quantity?: number }) => Promise<void>
    removeItem: (productId: string, vId?: string) => Promise<void>
    updateQuantity: (productId: string, quantity: number, vId?: string, action?: 'increment' | 'decrement') => Promise<void>
    clearCart: () => Promise<void>
    loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// ─── localStorage helpers ────────────────────────────────────────────────────
function readLocalCart(): CartItem[] {
    if (typeof window === 'undefined') return []
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]')
    } catch {
        return []
    }
}

function writeLocalCart(items: CartItem[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

function clearLocalCart() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(GUEST_CART_KEY)
}

// ─── Merge guest cart into server cart on login ──────────────────────────────
async function mergeGuestCart(guestItems: CartItem[]) {
    for (const item of guestItems) {
        try {
            await fetch('/api/website/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: item.product, vId: item.vId, quantity: item.quantity }),
            })
        } catch {
            // best-effort
        }
    }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isGuest, setIsGuest] = useState(true)
    const didMerge = useRef(false)

    useEffect(() => {
        initCart()
    }, [])

    const initCart = async () => {
        try {
            // 1. Check auth
            const meRes = await fetch('/api/users/me')
            const meData = meRes.ok ? await meRes.json() : null
            const loggedIn = !!(meData?.user)

            if (loggedIn) {
                setIsGuest(false)
                // 2. Merge any pending guest cart
                const guestItems = readLocalCart()
                if (guestItems.length > 0 && !didMerge.current) {
                    didMerge.current = true
                    await mergeGuestCart(guestItems)
                    clearLocalCart()
                }
                // 3. Load server cart
                const cartRes = await fetch('/api/website/cart')
                if (cartRes.ok) {
                    const data = await cartRes.json()
                    setItems(data.items || [])
                }
            } else {
                // Guest: load from localStorage
                setIsGuest(true)
                setItems(readLocalCart())
            }
        } catch (error) {
            console.error('Failed to init cart:', error)
            setItems(readLocalCart()) // fallback to local
        } finally {
            setLoading(false)
        }
    }

    // ─── Guest add ────────────────────────────────────────────────────────────
    const addItemLocal = (item: Partial<CartItem> & { product: string; quantity?: number }) => {
        const qty = item.quantity || 1
        setItems(prev => {
            const existing = prev.findIndex(
                i => i.product === item.product && (i.vId || '') === (item.vId || '')
            )
            let next: CartItem[]
            if (existing >= 0) {
                next = prev.map((i, idx) =>
                    idx === existing
                        ? { ...i, quantity: Math.min(5, i.quantity + qty) }
                        : i
                )
            } else {
                const newItem: CartItem = {
                    product: item.product,
                    vId: item.vId || '',
                    quantity: Math.min(5, qty),
                    name: item.name || 'Product',
                    price: item.price || 0,
                    image: item.image || '',
                    variantName: item.variantName || '',
                }
                next = [...prev, newItem]
            }
            writeLocalCart(next)
            return next
        })
    }

    const removeItemLocal = (productId: string, vId?: string) => {
        setItems(prev => {
            const next = prev.filter(
                i => !(i.product === productId && (i.vId || '') === (vId || ''))
            )
            writeLocalCart(next)
            return next
        })
    }

    const updateQuantityLocal = (
        productId: string,
        quantity: number,
        vId?: string,
        action?: 'increment' | 'decrement'
    ) => {
        setItems(prev => {
            const next = prev.map(i => {
                if (i.product !== productId || (i.vId || '') !== (vId || '')) return i
                let newQty = i.quantity
                if (action === 'increment') newQty = Math.min(5, i.quantity + 1)
                else if (action === 'decrement') newQty = Math.max(1, i.quantity - 1)
                else newQty = Math.max(1, Math.min(5, quantity))
                return { ...i, quantity: newQty }
            })
            writeLocalCart(next)
            return next
        })
    }

    // ─── Server add ───────────────────────────────────────────────────────────
    const addItem = async (item: Partial<CartItem> & { product: string; quantity?: number }) => {
        if (isGuest) {
            addItemLocal(item)
            return
        }
        try {
            const response = await fetch('/api/website/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            })
            if (response.ok) {
                const data = await response.json()
                setItems(data.items || [])
            }
        } catch (error) {
            console.error('Failed to add item:', error)
        }
    }

    const removeItem = async (productId: string, vId?: string) => {
        if (isGuest) {
            removeItemLocal(productId, vId)
            return
        }
        try {
            const response = await fetch('/api/website/cart', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: productId, vId }),
            })
            if (response.ok) {
                const data = await response.json()
                setItems(data.items || [])
            }
        } catch (error) {
            console.error('Failed to remove item:', error)
        }
    }

    const updateQuantity = async (
        productId: string,
        quantity: number,
        vId?: string,
        action?: 'increment' | 'decrement'
    ) => {
        if (!action && quantity <= 0) {
            removeItem(productId, vId)
            return
        }
        if (isGuest) {
            updateQuantityLocal(productId, quantity, vId, action)
            return
        }
        try {
            const response = await fetch('/api/website/cart', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: productId, vId, quantity, action }),
            })
            if (response.ok) {
                const data = await response.json()
                setItems(data.items || [])
            }
        } catch (error) {
            console.error('Failed to update quantity:', error)
        }
    }

    const clearCart = async () => {
        if (isGuest) {
            clearLocalCart()
            setItems([])
            return
        }
        try {
            const response = await fetch('/api/website/cart/clear', { method: 'POST' })
            if (response.ok) setItems([])
        } catch (error) {
            console.error('Failed to clear cart:', error)
        }
    }

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                totalPrice,
                isGuest,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                loading,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
