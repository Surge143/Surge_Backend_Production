'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '../context/CartContext'

export const CartDrawer: React.FC = () => {
  const { cart, totalItems, subtotal, loading, cartOpen, setCartOpen, removeFromCart, updateQuantity } = useCart()

  if (!cartOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)} />

      {/* Drawer */}
      <aside className="cart-drawer">
        {/* Header */}
        <div style={styles.drawerHeader}>
          <div>
            <h2 style={styles.drawerTitle}>Your Cart</h2>
            {totalItems > 0 && (
              <p style={styles.drawerSubtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            style={styles.closeBtn}
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={styles.itemsContainer} className="no-scrollbar">
          {cart.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🛒</div>
              <p style={styles.emptyText}>Your cart is empty</p>
              <p style={styles.emptySubtext}>Add some products to get started</p>
              <button
                className="btn-primary"
                style={{ marginTop: '24px', padding: '12px 24px', fontSize: '13px' }}
                onClick={() => setCartOpen(false)}
              >
                <Link href="/store" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Browse Store
                </Link>
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.product}-${item.vId}`} style={styles.cartItem}>
                {/* Image */}
                <div style={styles.itemImage}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px' }}>
                      ☕
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.name}</p>
                  {item.variantName && (
                    <p style={styles.itemVariant}>{item.variantName}</p>
                  )}
                  <p style={styles.itemPrice}>AED {(item.price * item.quantity).toFixed(2)}</p>

                  {/* Qty controls */}
                  <div style={styles.qtyRow}>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => updateQuantity(item.product, 'decrement', item.vId)}
                      disabled={loading}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => updateQuantity(item.product, 'increment', item.vId)}
                      disabled={loading || item.quantity >= 5}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      style={styles.removeBtn}
                      onClick={() => removeFromCart(item.product, item.vId)}
                      disabled={loading}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={styles.drawerFooter}>
            <div style={styles.subtotalRow}>
              <span style={{ opacity: 0.6, fontSize: '14px' }}>Subtotal</span>
              <span style={{ fontWeight: '800', fontSize: '20px' }}>AED {subtotal.toFixed(2)}</span>
            </div>
            <p style={styles.footerNote}>Shipping & taxes calculated at checkout</p>
            <Link href="/checkout" onClick={() => setCartOpen(false)}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '18px', fontSize: '15px' }}
              >
                Proceed to Checkout
              </button>
            </Link>
            <button
              style={styles.continueBtn}
              onClick={() => setCartOpen(false)}
            >
              Continue Shopping →
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  drawerHeader: {
    padding: '28px 24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  drawerTitle: {
    fontSize: '22px',
    fontWeight: '900',
    letterSpacing: '-0.3px',
  },
  drawerSubtitle: {
    fontSize: '13px',
    opacity: 0.45,
    marginTop: '4px',
  },
  closeBtn: {
    padding: '8px',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  itemsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '60px 0',
  },
  emptyIcon: {
    fontSize: '56px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    opacity: 0.45,
  },
  cartItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  itemName: {
    fontWeight: '700',
    fontSize: '15px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemVariant: {
    fontSize: '12px',
    opacity: 0.5,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--primary)',
    marginTop: '2px',
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flexShrink: 0,
    lineHeight: 1,
    fontWeight: 700,
  },
  qtyValue: {
    minWidth: '20px',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,99,99,0.7)',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: 'auto',
    padding: '4px 0',
    fontWeight: '600',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  drawerFooter: {
    padding: '20px 24px 32px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  footerNote: {
    fontSize: '12px',
    opacity: 0.4,
    textAlign: 'center',
    marginBottom: '4px',
  },
  continueBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '4px',
    transition: 'color 0.2s',
  },
}
