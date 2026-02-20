'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from '@stripe/react-stripe-js'
import styles from '../../app.module.css'
import pageStyles from './cart.module.css'
import { useAppCart } from '../../_components/AppShell'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const STRIPE_ELEMENT_STYLE = {
    style: {
        base: {
            fontSize: '16px',
            color: '#f0f4f8',
            fontFamily: 'Inter, sans-serif',
            '::placeholder': { color: '#6b7a8d' },
        },
    },
}

interface CartItem {
    id: string | number
    name: string
    variantName?: string
    price: number
    quantity: number
    productId: string | number
    vId?: string | number
    relationTo?: 'shop-menu' | 'web-products'
    image?: string
    tagline?: string
    customizations?: { sectionTitle: string; label: string; price: number }[]
}

function PaymentSheet({
    subtotal,
    total,
    onClose,
    onSubmit
}: {
    subtotal: number;
    total: number;
    onClose: () => void;
    onSubmit: (paymentMethodId: string) => Promise<void>
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setProcessing(true)
        setError(null)

        try {
            const cardEl = elements.getElement(CardNumberElement)
            if (!cardEl) throw new Error('Card element not found')

            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardEl,
            })

            if (pmError) throw new Error(pmError.message)
            await onSubmit(paymentMethod.id)
        } catch (err: any) {
            setError(err.message)
            setProcessing(false)
        }
    }

    return (
        <div className={styles.sheetOverlay} onClick={onClose}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                <div className={styles.sheetHandle} />
                <h2 className={styles.sheetTitle}>Payment</h2>
                <p className={styles.sheetSub}>Complete your order of AED {total.toFixed(2)}</p>

                <form onSubmit={handleSubmit}>
                    <div className={pageStyles.stripeSection}>
                        <label className={styles.label}>Card Number</label>
                        <div className={pageStyles.stripeField}>
                            <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
                        </div>
                        <div className={pageStyles.stripeRow}>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Expiry Date</label>
                                <div className={pageStyles.stripeField}>
                                    <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>CVV</label>
                                <div className={pageStyles.stripeField}>
                                    <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <div className={pageStyles.errorMsg}>{error}</div>}

                    <div style={{ height: 16 }} />
                    <button type="submit" className={styles.btnPrimary} disabled={processing}>
                        {processing ? 'Processing...' : `Pay AED ${total.toFixed(2)}`}
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={onClose} disabled={processing}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([])
    const [shopId, setShopId] = useState<string | null>(null)
    const [origin, setOrigin] = useState<'cafe' | 'store'>('cafe')
    const [loading, setLoading] = useState(true)
    const [removing, setRemoving] = useState<string | number | null>(null)
    const [showPayment, setShowPayment] = useState(false)
    const router = useRouter()
    const { refreshCart } = useAppCart()

    // Form State
    const [email, setEmail] = useState('')
    const [orderType, setOrderType] = useState<'take-away' | 'dine-in'>('take-away')
    const [timeSelection, setTimeSelection] = useState<'now' | 'custom'>('now')
    const [slot, setSlot] = useState('')
    const [slots, setSlots] = useState<any[]>([])
    const [instructions, setInstructions] = useState('')
    const [coupon, setCoupon] = useState('')
    const [useWTCoins, setUseWTCoins] = useState(false)
    const [baristas, setBaristas] = useState<any[]>([])
    const [selectedBarista, setSelectedBarista] = useState('')
    const [couponLoading, setCouponLoading] = useState(false)
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [couponError, setCouponError] = useState('')

    // Store Shipping State
    const [shippingAddress, setShippingAddress] = useState({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'AE',
        phoneNumber: '',
    })

    const fetchCart = async () => {
        try {
            const res = await fetch('/api/app/cart')
            const data = await res.json()
            setItems(data.items || [])
            setOrigin(data.origin || 'cafe')
            const sid = data.shop ? (typeof data.shop === 'object' ? data.shop.id : data.shop) : null
            setShopId(sid)

            if (sid && data.origin !== 'store') {
                const slotsRes = await fetch(`/api/slots?where[shop][equals]=${sid}&limit=100`)
                const slotsData = await slotsRes.json()
                setSlots(slotsData.docs || [])

                // Fetch baristas using server action
                const { getBaristas } = await import('../menu/actions')
                const { baristas: fetchedBaristas } = await getBaristas()
                setBaristas(fetchedBaristas || [])
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchCart() }, [])

    const removeItem = async (itemId: string | number) => {
        setRemoving(itemId)
        try {
            await fetch(`/api/app/cart?itemId=${itemId}`, { method: 'DELETE' })
            await fetchCart()
            refreshCart()
        } catch (e) { console.error(e) }
        finally { setRemoving(null) }
    }

    const clearCart = async () => {
        if (!window.confirm('Clear your entire cart?')) return
        try {
            await fetch('/api/app/cart', { method: 'DELETE' })
            setItems([])
            setShopId(null)
            refreshCart()
        } catch (e) { console.error(e) }
    }

    const subtotal = items.reduce((acc, item) => {
        const customTotal = (item.customizations || []).reduce((a, c) => a + (c.price || 0), 0)
        return acc + (item.price + customTotal) * item.quantity
    }, 0)

    const handleApplyCoupon = async () => {
        if (!coupon || !shopId) return
        setCouponLoading(true)
        setCouponError('')
        setAppliedCoupon(null)

        try {
            const res = await fetch(`/api/shop/${shopId}/coupons/${coupon}`)
            const data = await res.json()

            if (!res.ok) {
                setCouponError(data.error || 'Invalid coupon')
                return
            }

            setAppliedCoupon(data.coupon)
        } catch (err) {
            setCouponError('Failed to validate coupon')
        } finally {
            setCouponLoading(false)
        }
    }

    const calculateCouponDiscount = () => {
        if (!appliedCoupon) return 0
        const c = appliedCoupon

        if (subtotal < c.minimumAmount) return 0

        if (c.applicability === 'all') {
            if (c.discountType === 'percentage') {
                return subtotal * (c.discountAmount / 100)
            } else {
                return Math.min(c.discountAmount, subtotal)
            }
        } else if (c.applicability === 'products') {
            const eligibleProducts = (c.products as any[])?.map((p: any) =>
                typeof p === 'object' ? p.id : p
            ) || []

            let eligibleSubtotal = 0
            items.forEach(item => {
                if (eligibleProducts.includes(String(item.productId))) {
                    const customTotal = (item.customizations || []).reduce((a, c) => a + (c.price || 0), 0)
                    eligibleSubtotal += (item.price + customTotal) * item.quantity
                }
            })

            if (eligibleSubtotal === 0) return 0

            if (c.discountType === 'percentage') {
                return eligibleSubtotal * (c.discountAmount / 100)
            } else {
                return Math.min(c.discountAmount, eligibleSubtotal)
            }
        }
        return 0
    }

    const couponDiscount = calculateCouponDiscount()
    const taxAmount = (subtotal - couponDiscount) * 0.05
    const total = subtotal - couponDiscount + taxAmount

    const handlePlaceOrder = async (paymentMethodId: string) => {
        try {
            const isStore = origin === 'store'
            const endpoint = isStore ? '/api/checkout/cafe-checkout' : '/api/checkout/cafe-checkout'
            // NOTE: We'll update cafeCheckout to handle store or create a new one. 
            // For now, let's use the same but with different payload structure.

            const payload = {
                email,
                shopId,
                orderType: isStore ? 'store' : orderType,
                timeSelection: isStore ? 'now' : timeSelection,
                slot: !isStore && timeSelection === 'custom' ? slot : '',
                useWTCoins,
                appliedCouponCode: coupon,
                specialInstructions: instructions,
                paymentMethodId,
                shippingAddress: isStore ? shippingAddress : undefined,
                menuItems: items.map(item => ({
                    product: item.productId,
                    vId: item.vId,
                    quantity: item.quantity,
                    customizations: item.customizations || [],
                    relationTo: item.relationTo,
                })),
                selectedBarista: selectedBarista || undefined,
            }

            // Defensive Check
            const invalidItem = payload.menuItems.find(i => !i.product)
            if (invalidItem) {
                throw new Error('Some items in your cart are invalid. Please remove and re-add them.')
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Checkout failed')

            refreshCart()
            router.push(`/app/order/${data.dbOrderId || 'success'}`)
        } catch (err: any) {
            alert('Error: ' + err.message)
            throw err
        }
    }

    if (loading) return (
        <div>
            <div className={pageStyles.header}>
                <h1 className={pageStyles.title}>Cart & Checkout</h1>
            </div>
            <div className={styles.spinner} />
        </div>
    )

    return (
        <Elements stripe={stripePromise}>
            <div className={pageStyles.container}>
                <div className={pageStyles.header}>
                    <h1 className={pageStyles.title}>Order Review</h1>
                    {items.length > 0 && (
                        <span className={pageStyles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <h3>Your cart is empty</h3>
                        <p>Go back and add some delicious treats!</p>
                        <button className={styles.btnPrimary} style={{ marginTop: 8 }} onClick={() => router.push('/app')}>
                            Browse {origin === 'store' ? 'Store' : 'Menu'}
                        </button>
                    </div>
                ) : (
                    <div className={pageStyles.cartContent}>
                        {/* Item List */}
                        <div className={pageStyles.itemList}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'var(--color-text-muted, #6b7a8d)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                <button
                                    onClick={clearCart}
                                    style={{ background: 'none', border: 'none', color: '#e57373', fontSize: 13, cursor: 'pointer', padding: '4px 8px' }}
                                >
                                    Clear cart
                                </button>
                            </div>
                            {items.map(item => {
                                const customTotal = (item.customizations || []).reduce((a, c) => a + (c.price || 0), 0)
                                const lineTotal = (item.price + customTotal) * item.quantity
                                return (
                                    <div key={item.id} className={pageStyles.cartItem}>
                                        <div className={pageStyles.itemThumbnail}>
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} className={pageStyles.itemImg} width={64} height={64} style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div className={pageStyles.itemImgPlaceholder}>{item.relationTo === 'shop-menu' ? '☕' : '📦'}</div>
                                            )}
                                            <div className={pageStyles.itemQtyBadge}>{item.quantity}</div>
                                        </div>
                                        <div className={pageStyles.itemDetails}>
                                            <div className={pageStyles.itemHeader}>
                                                <div className={pageStyles.itemInfo}>
                                                    <div className={pageStyles.itemName}>{item.name}</div>
                                                    {item.variantName && (
                                                        <div className={pageStyles.variantName}>{item.variantName}</div>
                                                    )}
                                                </div>
                                                <div className={pageStyles.itemTotal}>AED {lineTotal.toFixed(2)}</div>
                                            </div>

                                            <div className={pageStyles.itemMeta}>
                                                <span className={pageStyles.unitPrice}>AED {item.price.toFixed(2)} each</span>
                                            </div>

                                            {item.customizations && item.customizations.length > 0 && (
                                                <div className={pageStyles.customList}>
                                                    {item.customizations.map((c, i) => (
                                                        <div key={i} className={pageStyles.customRow}>
                                                            <span className={pageStyles.customLabel}>{c.label}</span>
                                                            {c.price > 0 && <span className={pageStyles.customPrice}>+AED {c.price}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className={pageStyles.itemFooter}>
                                                <button className={pageStyles.removeBtn} onClick={() => removeItem(item.id)} disabled={removing === item.id}>
                                                    {removing === item.id ? 'Removing...' : 'Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Order Details Form */}
                        <div className={pageStyles.formSection}>
                            <h3 className={pageStyles.sectionTitle}>Contact Info</h3>
                            <div className={pageStyles.card}>
                                <label className={styles.label}>Email Address</label>
                                <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            {origin === 'cafe' ? (
                                <>
                                    <h3 className={pageStyles.sectionTitle}>Order Type</h3>
                                    <div className={pageStyles.card}>
                                        <div className={pageStyles.segmented}>
                                            <button className={`${pageStyles.segmentBtn} ${orderType === 'take-away' ? pageStyles.segmentActive : ''}`} onClick={() => setOrderType('take-away')}>🥡 Take Away</button>
                                            <button className={`${pageStyles.segmentBtn} ${orderType === 'dine-in' ? pageStyles.segmentActive : ''}`} onClick={() => setOrderType('dine-in')}>🪑 Dine In</button>
                                        </div>
                                    </div>

                                    <h3 className={pageStyles.sectionTitle}>Time Slot</h3>
                                    <div className={pageStyles.card}>
                                        <div className={pageStyles.segmented}>
                                            <button className={`${pageStyles.segmentBtn} ${timeSelection === 'now' ? pageStyles.segmentActive : ''}`} onClick={() => setTimeSelection('now')}>⚡ Now</button>
                                            <button className={`${pageStyles.segmentBtn} ${timeSelection === 'custom' ? pageStyles.segmentActive : ''}`} onClick={() => setTimeSelection('custom')}>🕐 Later</button>
                                        </div>
                                        {timeSelection === 'custom' && (
                                            <select className={styles.input} style={{ marginTop: 12 }} value={slot} onChange={e => setSlot(e.target.value)}>
                                                <option value="">Choose a time</option>
                                                {slots.map(s => <option key={s.id} value={s.id}>{s.from} - {s.to}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    <h3 className={pageStyles.sectionTitle}>Select Barista (Optional)</h3>
                                    <div className={pageStyles.card}>
                                        <div className={pageStyles.baristaSelectWrapper}>
                                            <select
                                                className={pageStyles.baristaSelect}
                                                value={selectedBarista}
                                                onChange={e => setSelectedBarista(e.target.value)}
                                            >
                                                <option value="">Any Barista</option>
                                                {baristas.map((b: any) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name || b.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className={pageStyles.sectionTitle}>Shipping Address</h3>
                                    <div className={pageStyles.card}>
                                        <label className={styles.label}>Full Address</label>
                                        <input className={styles.input} placeholder="Apt, Street" value={shippingAddress.line1} onChange={e => setShippingAddress({ ...shippingAddress, line1: e.target.value })} />
                                        <div style={{ height: 12 }} />
                                        <div className={pageStyles.stripeRow}>
                                            <div style={{ flex: 1 }}>
                                                <label className={styles.label}>City</label>
                                                <input className={styles.input} placeholder="Dubai" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label className={styles.label}>Phone</label>
                                                <input className={styles.input} placeholder="+971..." value={shippingAddress.phoneNumber} onChange={e => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <h3 className={pageStyles.sectionTitle}>Notes & Promo</h3>
                            <div className={pageStyles.card}>
                                <label className={styles.label}>Coupon Code</label>
                                <div className={pageStyles.couponInputGroup}>
                                    <input
                                        className={styles.input}
                                        placeholder="Enter code"
                                        value={coupon}
                                        onChange={e => {
                                            setCoupon(e.target.value)
                                            if (appliedCoupon) setAppliedCoupon(null)
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={pageStyles.couponApplyBtn}
                                        onClick={handleApplyCoupon}
                                        disabled={!coupon || couponLoading || !shopId}
                                    >
                                        {couponLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {appliedCoupon && <div className={pageStyles.couponSuccess}>Coupon applied successfully!</div>}
                                {couponError && <div className={pageStyles.couponError}>{couponError}</div>}
                                {appliedCoupon && subtotal < appliedCoupon.minimumAmount && (
                                    <div className={pageStyles.couponError}>Min. order AED {appliedCoupon.minimumAmount} required</div>
                                )}
                                <div style={{ height: 12 }} />
                                <label className={pageStyles.checkboxLabel}>
                                    <input type="checkbox" checked={useWTCoins} onChange={e => setUseWTCoins(e.target.checked)} />
                                    <span>Use my WTCoins for discount</span>
                                </label>
                                <div style={{ height: 12 }} />
                                <label className={styles.label}>Special Instructions</label>
                                <textarea className={styles.input} placeholder="Extra ice, allergies, etc." value={instructions} onChange={e => setInstructions(e.target.value)} />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className={pageStyles.summary}>
                            <div className={pageStyles.summaryRow}>
                                <span>Subtotal</span>
                                <span>AED {subtotal.toFixed(2)}</span>
                            </div>
                            {couponDiscount > 0 && (
                                <div className={`${pageStyles.summaryRow} ${pageStyles.discountRow}`}>
                                    <span>Coupon Discount ({appliedCoupon.code})</span>
                                    <span>-AED {couponDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={pageStyles.summaryRow}>
                                <span>VAT (5%)</span>
                                <span>AED {taxAmount.toFixed(2)}</span>
                            </div>
                            <div className={styles.divider} />
                            <div className={`${pageStyles.summaryRow} ${pageStyles.totalRow}`}>
                                <span>Total</span>
                                <span>AED {total.toFixed(2)}</span>
                                <div className={pageStyles.totalBadge}>Payable</div>
                            </div>
                        </div>

                        <button
                            className={styles.btnPrimary}
                            onClick={() => setShowPayment(true)}
                            disabled={!email || (origin === 'cafe' && timeSelection === 'custom' && !slot) || (origin === 'store' && !shippingAddress.line1)}
                        >
                            Proceed to Payment
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {showPayment && (
                <PaymentSheet
                    subtotal={subtotal}
                    total={total}
                    onClose={() => setShowPayment(false)}
                    onSubmit={handlePlaceOrder}
                />
            )}
        </Elements>
    )
}
