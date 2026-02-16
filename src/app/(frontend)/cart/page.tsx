'use client'

import { useCart } from '../components/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import styles from './cart.module.css'

export default function CartPage() {
    const { items, itemCount, totalPrice, updateQuantity, removeItem, loading } = useCart()

    if (loading) {
        return (
            <div className={styles.container}>
                <div className="container">
                    <div className={styles.loading}>Loading cart...</div>
                </div>
            </div>
        )
    }

    if (itemCount === 0) {
        return (
            <div className={styles.container}>
                <div className="container">
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Add some products to get started</p>
                        <Link href="/products" className="btn btn-primary btn-lg">
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className="container">
                <h1 className={styles.title}>Shopping Cart</h1>

                <div className={styles.cartLayout}>
                    {/* Cart Items */}
                    <div className={styles.items}>
                        {items.map((item) => (
                            <div key={`${item.product}-${item.vId || ''}`} className={styles.item}>
                                <div className={styles.itemImage}>
                                    {item.image && (
                                        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                                    )}
                                </div>

                                <div className={styles.itemDetails}>
                                    <h3>{item.name}</h3>
                                    {item.variantName && (
                                        <p className={styles.variant}>{item.variantName}</p>
                                    )}
                                    <p className={styles.price}>AED {item.price.toFixed(2)}</p>
                                </div>

                                <div className={styles.itemActions}>
                                    <div className={styles.quantity}>
                                        <button
                                            onClick={() => updateQuantity(item.product, item.quantity - 1, item.vId, 'decrement')}
                                            className={styles.qtyBtn}
                                        >
                                            −
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product, item.quantity + 1, item.vId, 'increment')}
                                            className={styles.qtyBtn}
                                            disabled={item.quantity >= 5}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.product, item.vId)}
                                        className={styles.removeBtn}
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className={styles.itemTotal}>
                                    AED {(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Summary */}
                    <div className={styles.summary}>
                        <h3>Order Summary</h3>

                        <div className={styles.summaryRow}>
                            <span>Subtotal ({itemCount} items)</span>
                            <span>AED {totalPrice.toFixed(2)}</span>
                        </div>

                        <div className={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>Calculated at checkout</span>
                        </div>

                        <div className={styles.summaryDivider}></div>

                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span>AED {totalPrice.toFixed(2)}</span>
                        </div>

                        <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            Proceed to Checkout
                        </Link>

                        <Link href="/products" className={styles.continueShopping}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
