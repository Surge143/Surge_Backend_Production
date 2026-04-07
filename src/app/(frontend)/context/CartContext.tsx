'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
  customizations?: any
  type: 'store' | 'app'
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string, variant?: string) => void
  updateQuantity: (id: string, quantity: number, variant?: string) => void
  clearCart: () => void
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('wm-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Failed to parse cart', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('wm-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.id === item.id &&
          i.variant === item.variant &&
          JSON.stringify(i.customizations) === JSON.stringify(item.customizations),
      )
      if (existingIndex > -1) {
        const nextCart = [...prev]
        nextCart[existingIndex].quantity += item.quantity
        return nextCart
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (id: string, variant?: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.variant === variant)))
  }

  const updateQuantity = (id: string, quantity: number, variant?: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id && i.variant === variant ? { ...i, quantity } : i)),
    )
  }

  const clearCart = () => setCart([])

  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
