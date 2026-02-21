'use client'

import React, { useState, useEffect } from 'react'
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
import { useCart } from '../components/CartContext'
import styles from './checkout.module.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ------------------------------------------------------------------
// Saved card type
// ------------------------------------------------------------------
interface SavedCard {
    id: string
    brand: string
    last4: string
    expMonth: number | undefined
    expYear: number | undefined
}

// ------------------------------------------------------------------
// Inner form — rendered inside <Elements>
// ------------------------------------------------------------------
function CheckoutForm({ savedCards }: { savedCards: SavedCard[] }) {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const { items, totalPrice, clearCart } = useCart()

    const [isProcessing, setIsProcessing] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [useWTCoins, setUseWTCoins] = useState(false)
    const [wtCoinsBalance, setWtCoinsBalance] = useState<any>(null)
    const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery')
    const [shippingAsBilling, setShippingAsBilling] = useState(true)
    const [couponCode, setCouponCode] = useState('')
    const [couponData, setCouponData] = useState<any>(null)
    const [taxStats, setTaxStats] = useState({ taxRate: 0, shippingCharge: 0 })

    // 'new' = entering a new card, otherwise the id of a SavedCard
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
        savedCards.length > 0 ? savedCards[0].id : 'new'
    )

    const [shippingAddress, setShippingAddress] = useState({
        addressFirstName: '',
        addressLastName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        emirates: 'dubai',
    })

    const [billingAddress, setBillingAddress] = useState({
        addressFirstName: '',
        addressLastName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        emirates: 'dubai',
    })

    useEffect(() => {
        const fetchUserData = async () => {
            const userRes = await fetch('/api/users/me')
            if (userRes.ok) {
                const userData = await userRes.json()
                if (userData.user) {
                    setUser(userData.user)
                    setEmail(userData.user.email || '')
                    setShippingAddress(prev => ({
                        ...prev,
                        addressFirstName: userData.user.firstName || '',
                        addressLastName: userData.user.lastName || '',
                        phoneNumber: userData.user.phone || '',
                        addressLine1: userData.user.address?.street || '',
                        addressLine2: userData.user.address?.apartment || '',
                        city: userData.user.address?.city || '',
                        emirates: userData.user.address?.state || 'dubai'
                    }))

                    Promise.all([
                        fetch(`/api/user-wt-coins?where[user][equals]=${userData.user.id}`),
                        fetch('/api/globals/wt-coins')
                    ])
                        .then(([balanceRes, configRes]) => Promise.all([balanceRes.json(), configRes.json()]))
                        .then(([balanceData, configData]) => {
                            const balance = balanceData.docs?.[0]?.totalBalance || 0
                            const pointsToAed = configData.pointsToAed || 1
                            setWtCoinsBalance({
                                balance,
                                pointsToAed,
                                estimatedValue: parseFloat((balance / pointsToAed).toFixed(2)),
                                minPointsPerOrder: configData.minPointsPerOrder || 0,
                                maxPointsPerOrder: configData.maxPointsPerOrder || 0,
                            })
                        })
                        .catch(err => console.error('Failed to fetch WTCoins balance', err))
                }
            }
        }
        fetchUserData()
    }, [])

    useEffect(() => {
        const updateStats = async () => {
            try {
                const res = await fetch('/api/checkout/calculate-tax-shipping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deliveryOption,
                        shippingAddress: deliveryOption === 'delivery' ? shippingAddress : null
                    })
                })
                if (res.ok) {
                    const data = await res.json()
                    setTaxStats(data)
                }
            } catch (err) {
                console.error('Failed to calc tax/shipping', err)
            }
        }
        updateStats()
    }, [deliveryOption, shippingAddress.emirates, shippingAddress])

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        try {
            const res = await fetch(`/api/coupon/coupons/${couponCode}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setCouponData(data.coupon)
                alert('Coupon applied successfully!')
            } else {
                alert(data.error || 'Invalid coupon')
            }
        } catch (err) {
            alert('Failed to validate coupon')
        }
    }

    const calculateWTCoinsDiscount = () => {
        if (!useWTCoins || !wtCoinsBalance) return 0
        let subtotal = totalPrice
        if (couponData) {
            if (couponData.discountType === 'fixed') subtotal -= couponData.discountAmount
            else subtotal -= (totalPrice * (couponData.discountAmount / 100))
        }
        const maxDiscount = wtCoinsBalance.balance / wtCoinsBalance.pointsToAed
        return Math.min(maxDiscount, subtotal)
    }

    const calculateFinalTotal = () => {
        let total = totalPrice
        if (couponData) {
            if (couponData.discountType === 'fixed') total -= couponData.discountAmount
            else total -= (totalPrice * (couponData.discountAmount / 100))
        }
        total -= calculateWTCoinsDiscount()
        total += taxStats.shippingCharge
        return total + total * (taxStats.taxRate / 100)
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || items.length === 0) return

        setIsProcessing(true)

        try {
            let paymentMethodId: string

            if (selectedPaymentMethod !== 'new') {
                // User chose a saved card — use it directly
                paymentMethodId = selectedPaymentMethod
            } else {
                // User is entering a new card
                if (!elements) throw new Error('Elements not loaded')
                const cardElement = elements.getElement(CardNumberElement)
                if (!cardElement) throw new Error('Card element not found')

                const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                    billing_details: {
                        email,
                        name: shippingAsBilling
                            ? `${shippingAddress.addressFirstName} ${shippingAddress.addressLastName}`
                            : `${billingAddress.addressFirstName} ${billingAddress.addressLastName}`,
                        phone: shippingAsBilling ? shippingAddress.phoneNumber : billingAddress.phoneNumber,
                    },
                })

                if (pmError) throw new Error(pmError.message)
                paymentMethodId = paymentMethod!.id
            }

            const checkoutBody = {
                email,
                paymentMethodId,
                deliveryOption,
                useWTCoins,
                appliedCouponCode: couponData?.code,
                shippingAddressAsBillingAddress: shippingAsBilling,
                products: items.map(item => ({
                    productId: item.product,
                    variantId: item.vId,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingAddress,
                billingAddress: shippingAsBilling ? shippingAddress : billingAddress,
            }

            const response = await fetch('/api/checkout/one-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutBody),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Checkout failed')

            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret)

            if (confirmError) throw new Error(confirmError.message)

            if (paymentIntent?.status === 'succeeded') {
                clearCart()
                router.push('/checkout/success')
            }
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const cardBrandIcon: Record<string, string> = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
        discover: '💳',
    }

    if (items.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h2>Your cart is empty</h2>
                <button onClick={() => router.push('/products')} className="btn btn-primary">Start Shopping</button>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className="container">
                <form onSubmit={handlePayment} className={styles.checkoutGrid}>
                    {/* Left: Info */}
                    <div className={styles.infoContent}>
                        <h1 className={styles.pageTitle}>Checkout</h1>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Contact Information</h2>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>First Name</label>
                                    <input placeholder="First Name" required value={shippingAddress.addressFirstName}
                                        onChange={(e) => { const v = e.target.value; setShippingAddress({ ...shippingAddress, addressFirstName: v }); setBillingAddress({ ...billingAddress, addressFirstName: v }) }}
                                        className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Last Name</label>
                                    <input placeholder="Last Name" required value={shippingAddress.addressLastName}
                                        onChange={(e) => { const v = e.target.value; setShippingAddress({ ...shippingAddress, addressLastName: v }); setBillingAddress({ ...billingAddress, addressLastName: v }) }}
                                        className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Phone Number</label>
                                    <input placeholder="Phone Number" required value={shippingAddress.phoneNumber}
                                        onChange={(e) => { const v = e.target.value; setShippingAddress({ ...shippingAddress, phoneNumber: v }); setBillingAddress({ ...billingAddress, phoneNumber: v }) }}
                                        className={styles.input} />
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Delivery Method</h2>
                            <div className={styles.deliveryToggle}>
                                <button type="button" className={`${styles.toggleBtn} ${deliveryOption === 'delivery' ? styles.active : ''}`} onClick={() => setDeliveryOption('delivery')}>Home Delivery</button>
                                <button type="button" className={`${styles.toggleBtn} ${deliveryOption === 'pickup' ? styles.active : ''}`} onClick={() => setDeliveryOption('pickup')}>Store Pickup</button>
                            </div>
                        </section>

                        {deliveryOption === 'delivery' && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Shipping Address</h2>
                                <div className={styles.formGrid}>
                                    <input placeholder="Address Line 1" required value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })} className={`${styles.input} span-2`} />
                                    <input placeholder="Address Line 2 (Optional)" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })} className={`${styles.input} span-2`} />
                                    <input placeholder="City" required value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className={styles.input} />
                                    <select value={shippingAddress.emirates} onChange={(e) => setShippingAddress({ ...shippingAddress, emirates: e.target.value })} className={styles.input}>
                                        <option value="abu_dhabi">Abu Dhabi</option>
                                        <option value="dubai">Dubai</option>
                                        <option value="sharjah">Sharjah</option>
                                        <option value="ajman">Ajman</option>
                                        <option value="umm_al_quwain">Umm Al Quwain</option>
                                        <option value="ras_al_khaimah">Ras Al Khaimah</option>
                                        <option value="fujairah">Fujairah</option>
                                    </select>
                                </div>
                            </section>
                        )}

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Payment Details</h2>

                            {/* ── Saved cards picker ── */}
                            {savedCards.length > 0 && (
                                <div className={styles.savedCards}>
                                    {savedCards.map(card => (
                                        <label key={card.id} className={`${styles.savedCard} ${selectedPaymentMethod === card.id ? styles.savedCardActive : ''}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={card.id}
                                                checked={selectedPaymentMethod === card.id}
                                                onChange={() => setSelectedPaymentMethod(card.id)}
                                            />
                                            <span className={styles.cardBrand}>{cardBrandIcon[card.brand] ?? '💳'} {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)}</span>
                                            <span className={styles.cardDetails}>•••• {card.last4} &nbsp; {card.expMonth?.toString().padStart(2, '0')}/{card.expYear}</span>
                                        </label>
                                    ))}
                                    <label className={`${styles.savedCard} ${selectedPaymentMethod === 'new' ? styles.savedCardActive : ''}`}>
                                        <input type="radio" name="paymentMethod" value="new" checked={selectedPaymentMethod === 'new'} onChange={() => setSelectedPaymentMethod('new')} />
                                        <span>➕ Use a new card</span>
                                    </label>
                                </div>
                            )}

                            {/* ── New card entry elements (shown when no saved cards or "new card" chosen) ── */}
                            {selectedPaymentMethod === 'new' && (
                                <div className={styles.paymentBox}>
                                    <div className={styles.stripeElement}>
                                        <label>Card Number</label>
                                        <div className={styles.elementWrapper}><CardNumberElement /></div>
                                    </div>
                                    <div className={styles.elementRow}>
                                        <div className={styles.stripeElement}>
                                            <label>Expiry Date</label>
                                            <div className={styles.elementWrapper}><CardExpiryElement /></div>
                                        </div>
                                        <div className={styles.stripeElement}>
                                            <label>CVC</label>
                                            <div className={styles.elementWrapper}><CardCvcElement /></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right: Summary */}
                    <div className={styles.summaryContent}>
                        <div className={styles.stickySummary}>
                            <h3 className={styles.summaryTitle}>Order Summary</h3>
                            <div className={styles.cartItems}>
                                {items.map((item, i) => (
                                    <div key={i} className={styles.summaryItem}>
                                        <div className={styles.siDetails}>
                                            <span className={styles.siName}>{item.name}</span>
                                            <span className={styles.siVariant}>{item.variantName} x {item.quantity}</span>
                                        </div>
                                        <span className={styles.siPrice}>AED {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.couponCode}>
                                <input placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className={styles.couponInput} />
                                <button type="button" onClick={handleApplyCoupon} className={styles.applyBtn}>Apply</button>
                            </div>

                            <div className={styles.calculation}>
                                <div className={styles.calcRow}><span>Subtotal</span><span>AED {totalPrice.toFixed(2)}</span></div>
                                {couponData && (
                                    <div className={`${styles.calcRow} ${styles.discount}`}>
                                        <span>Discount ({couponData.code})</span>
                                        <span>-AED {(couponData.discountType === 'fixed' ? couponData.discountAmount : totalPrice * (couponData.discountAmount / 100)).toFixed(2)}</span>
                                    </div>
                                )}
                                {useWTCoins && wtCoinsBalance && calculateWTCoinsDiscount() > 0 && (
                                    <div className={`${styles.calcRow} ${styles.discount}`}>
                                        <span>WT Coins Discount</span>
                                        <span>-AED {calculateWTCoinsDiscount().toFixed(2)}</span>
                                    </div>
                                )}
                                <div className={styles.calcRow}><span>Shipping</span><span>{taxStats.shippingCharge > 0 ? `AED ${taxStats.shippingCharge.toFixed(2)}` : 'FREE'}</span></div>
                                <div className={styles.calcRow}>
                                    <span>Tax ({taxStats.taxRate}%)</span>
                                    <span>AED {(((totalPrice - (couponData ? (couponData.discountType === 'fixed' ? couponData.discountAmount : totalPrice * (couponData.discountAmount / 100)) : 0) - calculateWTCoinsDiscount()) + taxStats.shippingCharge) * (taxStats.taxRate / 100)).toFixed(2)}</span>
                                </div>
                                <div className={styles.totalRow}><span>Total</span><span>AED {calculateFinalTotal().toFixed(2)}</span></div>
                            </div>

                            <div className={styles.wtCoins}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={useWTCoins} onChange={() => setUseWTCoins(!useWTCoins)} disabled={!user || !wtCoinsBalance || wtCoinsBalance.balance === 0} />
                                    {user && wtCoinsBalance ? `Use WT Coins (Balance: ${wtCoinsBalance.balance} ≈ AED ${wtCoinsBalance.estimatedValue})` : user ? 'Use WT Coins (Loading...)' : 'Use WT Coins (Login required)'}
                                </label>
                            </div>

                            <button disabled={isProcessing || !stripe} className={styles.payBtn}>
                                {isProcessing ? 'Processing...' : `Pay AED ${calculateFinalTotal().toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ------------------------------------------------------------------
// Outer wrapper — fetches saved cards, then mounts <Elements>
// ------------------------------------------------------------------
export default function CheckoutPage() {
    const [savedCards, setSavedCards] = useState<SavedCard[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        fetch('/api/stripe/payment-methods')
            .then(r => r.ok ? r.json() : { paymentMethods: [] })
            .then(data => setSavedCards(data.paymentMethods ?? []))
            .catch(() => setSavedCards([]))
            .finally(() => setReady(true))
    }, [])

    if (!ready) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><p>Loading payment options...</p></div>
    }

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm savedCards={savedCards} />
        </Elements>
    )
}
