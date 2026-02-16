'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CartItem {
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
    addItem: (item: Partial<CartItem> & { product: string; quantity?: number }) => Promise<void>
    removeItem: (productId: string, vId?: string) => Promise<void>
    updateQuantity: (productId: string, quantity: number, vId?: string, action?: 'increment' | 'decrement') => Promise<void>
    clearCart: () => Promise<void>
    loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)

    // Load cart on mount
    useEffect(() => {
        loadCart()
    }, [])

    const loadCart = async () => {
        try {
            const response = await fetch('/api/cart')
            if (response.ok) {
                const data = await response.json()
                setItems(data.items || [])
            }
        } catch (error) {
            console.error('Failed to load cart:', error)
        } finally {
            setLoading(false)
        }
    }

    const addItem = async (item: Partial<CartItem> & { product: string; quantity?: number }) => {
        try {
            const response = await fetch('/api/cart', {
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
        try {
            const response = await fetch('/api/cart', {
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

    const updateQuantity = async (productId: string, quantity: number, vId?: string, action?: 'increment' | 'decrement') => {
        if (!action && quantity <= 0) {
            removeItem(productId, vId)
            return
        }

        try {
            const response = await fetch('/api/cart', {
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
        try {
            const response = await fetch('/api/cart/clear', {
                method: 'POST',
            })

            if (response.ok) {
                setItems([])
            }
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
