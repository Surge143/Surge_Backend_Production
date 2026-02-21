'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
} from '@stripe/react-stripe-js'
import { useCart } from '../components/CartContext'
import styles from './checkout.module.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ------------------------------------------------------------------
// Inner form — renders the actual UI and handles payment confirmation
// ------------------------------------------------------------------
function CheckoutFormUI({
    isProcessing,
    setIsProcessing,
    user,
    email,
    setEmail,
    useWTCoins,
    setUseWTCoins,
    wtCoinsBalance,
    deliveryOption,
    setDeliveryOption,
    shippingAsBilling,
    setShippingAsBilling,
    couponCode,
    setCouponCode,
    couponData,
    handleApplyCoupon,
    calculateWTCoinsDiscount,
    calculateFinalTotal,
    taxStats,
    shippingAddress,
    setShippingAddress,
    billingAddress,
    setBillingAddress,
}: any) {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const { items, clearCart, totalPrice } = useCart()

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements || items.length === 0) return

        setIsProcessing(true)

        try {
            // 1. Trigger form validation via Stripe Elements
            const { error: submitError } = await elements.submit()
            if (submitError) throw new Error(submitError.message)

            // 2. Create Order and PaymentIntent on our server
            const checkoutBody = {
                email,
                deliveryOption,
                useWTCoins,
                appliedCouponCode: couponData?.code,
                shippingAddressAsBillingAddress: shippingAsBilling,
                products: items.map(item => ({
                    productId: item.product,
                    variantId: item.vId, // CartItem uses vId
                    quantity: item.quantity,
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

            const { clientSecret, dbOrderId } = data

            // 3. Confirm the payment with Stripe
            // This will handle 3DS, saved cards, and redirect to return_url
            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success?orderId=${dbOrderId}`,
                },
            })

            // Clear Cart locally if successful (though redirect usually happens)
            if (!confirmError) {
                clearCart()
            } else {
                throw new Error(confirmError.message)
            }
        } catch (err: any) {
            alert(err.message)
            setIsProcessing(false)
        }
    }

    return (
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
                                onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, addressFirstName: e.target.value }))}
                                className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Last Name</label>
                            <input placeholder="Last Name" required value={shippingAddress.addressLastName}
                                onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, addressLastName: e.target.value }))}
                                className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Phone Number</label>
                            <input placeholder="Phone Number" required value={shippingAddress.phoneNumber}
                                onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, phoneNumber: e.target.value }))}
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
                            <input placeholder="Address Line 1" required value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, addressLine1: e.target.value }))} className={`${styles.input} span-2`} />
                            <input placeholder="Address Line 2 (Optional)" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, addressLine2: e.target.value }))} className={`${styles.input} span-2`} />
                            <input placeholder="City" required value={shippingAddress.city} onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, city: e.target.value }))} className={styles.input} />
                            <select value={shippingAddress.emirates} onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, emirates: e.target.value }))} className={styles.input}>
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
                    <div className={styles.paymentBox}>
                        <PaymentElement />
                    </div>
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
    )
}

// ------------------------------------------------------------------
// Main Checkout Form — manages state and wraps UI with Elements
// ------------------------------------------------------------------
function CheckoutForm() {
    const { items, totalPrice } = useCart()

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

    // Guest email autofill logic
    useEffect(() => {
        if (!user && !email && shippingAddress.addressFirstName && shippingAddress.addressLastName) {
            setEmail(`${shippingAddress.addressFirstName.toLowerCase()}${shippingAddress.addressLastName.toLowerCase()}@whitemantis.guest`.replace(/\s+/g, ''))
        }
    }, [shippingAddress.addressFirstName, shippingAddress.addressLastName, user, email])

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

    if (items.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h2>Your cart is empty</h2>
                <button onClick={() => window.location.href = '/products'} className="btn btn-primary">Start Shopping</button>
            </div>
        )
    }

    const finalTotal = calculateFinalTotal()
    // Stripe amount must be at least 1 (in the smallest unit)
    const stripeAmount = Math.max(1, Math.round(finalTotal * 100))

    return (
        <div className={styles.container}>
            <div className="container">
                <Elements
                    key={`${user?.id || 'guest'}-${email}`}
                    stripe={stripePromise}
                    options={{
                        mode: 'payment',
                        amount: stripeAmount,
                        currency: 'aed',
                        setup_future_usage: (user ? 'off_session' : undefined) as any,
                        defaultValues: {
                            billingDetails: {
                                email: email,
                                name: `${shippingAddress.addressFirstName} ${shippingAddress.addressLastName}`.trim(),
                                phone: shippingAddress.phoneNumber,
                            }
                        }
                    } as any}
                >
                    <CheckoutFormUI
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        user={user}
                        email={email}
                        setEmail={setEmail}
                        useWTCoins={useWTCoins}
                        setUseWTCoins={setUseWTCoins}
                        wtCoinsBalance={wtCoinsBalance}
                        deliveryOption={deliveryOption}
                        setDeliveryOption={setDeliveryOption}
                        shippingAsBilling={shippingAsBilling}
                        setShippingAsBilling={setShippingAsBilling}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        couponData={couponData}
                        handleApplyCoupon={handleApplyCoupon}
                        calculateWTCoinsDiscount={calculateWTCoinsDiscount}
                        calculateFinalTotal={calculateFinalTotal}
                        taxStats={taxStats}
                        shippingAddress={shippingAddress}
                        setShippingAddress={setShippingAddress}
                        billingAddress={billingAddress}
                        setBillingAddress={setBillingAddress}
                    />
                </Elements>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return <CheckoutForm />
}
