'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
} from '@stripe/react-stripe-js'
import styles from '../checkout/checkout.module.css'
import { Product, ProductVariant, SubscriptionFrequency } from '../types/product'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutSubscriptionForm() {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const searchParams = useSearchParams()

    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')
    const frequencyId = searchParams.get('frequencyId')
    const quantity = parseInt(searchParams.get('quantity') || '1')

    const [isProcessing, setIsProcessing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [product, setProduct] = useState<Product | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [selectedFrequency, setSelectedFrequency] = useState<SubscriptionFrequency | null>(null)

    const [user, setUser] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [useWTCoins, setUseWTCoins] = useState(false)
    const [wtCoinsBalance, setWtCoinsBalance] = useState<any>(null)
    const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery')
    const [shippingAsBilling, setShippingAsBilling] = useState(true)
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
        if (!productId) { router.push('/products'); return }

        const fetchData = async () => {
            try {
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

                const prodRes = await fetch(`/api/web-products/${productId}`)
                if (!prodRes.ok) throw new Error('Product not found')
                const prodData = await prodRes.json()
                setProduct(prodData)

                if (variantId && prodData.variants) {
                    const variant = prodData.variants.find((v: any) => v.id === variantId)
                    setSelectedVariant(variant || null)
                    if (frequencyId && variant?.subFreq) {
                        const freq = variant.subFreq.find((f: any) => f.id === frequencyId)
                        setSelectedFrequency(freq || null)
                    }
                } else if (frequencyId && prodData.subFreq) {
                    const freq = prodData.subFreq.find((f: any) => f.id === frequencyId)
                    setSelectedFrequency(freq || null)
                }

                setIsLoading(false)
            } catch (err) {
                console.error('Failed to resolve data', err)
                router.push('/products')
            }
        }

        fetchData()
    }, [productId, variantId, frequencyId, router])

    useEffect(() => {
        const updateStats = async () => {
            try {
                const res = await fetch('/api/checkout/calculate-tax-shipping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deliveryOption, shippingAddress: deliveryOption === 'delivery' ? shippingAddress : null })
                })
                if (res.ok) setTaxStats(await res.json())
            } catch (err) { console.error('Failed to calc tax/shipping', err) }
        }
        updateStats()
    }, [deliveryOption, shippingAddress.emirates, shippingAddress])

    // Guest Email Autofill logic
    useEffect(() => {
        if (!user && shippingAddress.addressFirstName && shippingAddress.addressLastName && !email.includes('@')) {
            const suggestedEmail = `${shippingAddress.addressFirstName.toLowerCase()}.${shippingAddress.addressLastName.toLowerCase()}@whitemantis.guest`
            setEmail(suggestedEmail)
        }
    }, [user, shippingAddress.addressFirstName, shippingAddress.addressLastName, email])

    const getBasePrice = () => selectedVariant ? (selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice) : (product?.salePrice || product?.regularPrice || 0)
    const calculateSubscriptionDiscount = () => (getBasePrice() * quantity) * ((selectedVariant?.subscriptionDiscount || product?.subscriptionDiscount || 0) / 100)
    const calculateWTCoinsDiscount = () => {
        if (!useWTCoins || !wtCoinsBalance) return 0
        const subtotalAfterDiscounts = getBasePrice() * quantity - calculateSubscriptionDiscount()
        return Math.min(wtCoinsBalance.balance / wtCoinsBalance.pointsToAed, subtotalAfterDiscounts)
    }
    const calculateFinalTotal = () => {
        const subtotal = getBasePrice() * quantity
        const afterDiscount = subtotal - calculateSubscriptionDiscount() - calculateWTCoinsDiscount()
        const withShipping = afterDiscount + taxStats.shippingCharge
        return withShipping + withShipping * (taxStats.taxRate / 100)
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements || !product) return

        setIsProcessing(true)

        try {
            const checkoutBody = {
                email,
                deliveryOption,
                useWTCoins,
                shippingAddressAsBillingAddress: shippingAsBilling,
                product: {
                    productId: product.id,
                    variantId: selectedVariant?.id,
                    subscriptionId: selectedFrequency?.id,
                    quantity,
                },
                shippingAddress,
                billingAddress: shippingAsBilling ? shippingAddress : billingAddress,
            }

            const response = await fetch('/api/checkout/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutBody),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Checkout failed')

            const { clientSecret, dbSubscriptionId } = data

            // Confirm payment with Stripe (handles 3DS, saved cards, and redirect)
            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success?subscriptionId=${dbSubscriptionId}`,
                },
            })

            if (confirmError) throw new Error(confirmError.message)

        } catch (err: any) {
            alert(err.message)
            setIsProcessing(false)
        }
    }

    if (isLoading || !product) return <div className={styles.emptyCart}><h2>Loading...</h2></div>

    return (
        <div className={styles.container}>
            <div className="container">
                <form onSubmit={handlePayment} className={styles.checkoutGrid}>
                    <div className={styles.infoContent}>
                        <h1 className={styles.pageTitle}>Subscription Checkout</h1>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Contact Information</h2>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Email Address</label>
                                    <input type="email" placeholder="your@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} />
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
                            <div className={styles.paymentBox}>
                                <PaymentElement />
                            </div>
                        </section>
                    </div>

                    <div className={styles.summaryContent}>
                        <div className={styles.stickySummary}>
                            <h3 className={styles.summaryTitle}>Subscription Summary</h3>
                            <div className={styles.cartItems}>
                                <div className={styles.summaryItem}>
                                    <div className={styles.siDetails}>
                                        <span className={styles.siName}>{product.name}</span>
                                        <span className={styles.siVariant}>
                                            {selectedVariant?.variantName} x {quantity}
                                            <br />Frequency: Every {selectedFrequency?.duration} {selectedFrequency?.interval}
                                        </span>
                                    </div>
                                    <span className={styles.siPrice}>AED {(getBasePrice() * quantity).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className={styles.calculation}>
                                <div className={styles.calcRow}><span>Subtotal</span><span>AED {(getBasePrice() * quantity).toFixed(2)}</span></div>
                                {selectedFrequency && (
                                    <div className={`${styles.calcRow} ${styles.discount}`}>
                                        <span>Sub Discount ({selectedVariant?.subscriptionDiscount || product?.subscriptionDiscount || 0}%)</span>
                                        <span>-AED {calculateSubscriptionDiscount().toFixed(2)}</span>
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
                                    <span>AED {(((getBasePrice() * quantity - calculateSubscriptionDiscount() - calculateWTCoinsDiscount()) + taxStats.shippingCharge) * (taxStats.taxRate / 100)).toFixed(2)}</span>
                                </div>
                                <div className={styles.totalRow}><span>Total (Recurring)</span><span>AED {calculateFinalTotal().toFixed(2)}</span></div>
                            </div>
                            <div className={styles.wtCoins}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={useWTCoins} onChange={() => setUseWTCoins(!useWTCoins)} disabled={!user || !wtCoinsBalance || wtCoinsBalance.balance === 0} />
                                    {user && wtCoinsBalance ? `Use WT Coins (Balance: ${wtCoinsBalance.balance} ≈ AED ${wtCoinsBalance.estimatedValue})` : user ? 'Use WT Coins (Loading...)' : 'Use WT Coins (Login required)'}
                                </label>
                            </div>
                            <button disabled={isProcessing || !stripe} className={styles.payBtn}>
                                {isProcessing ? 'Processing...' : `Subscribe for AED ${calculateFinalTotal().toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function CheckoutSubscriptionPage() {
    const [user, setUser] = useState<any>(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        fetch('/api/users/me').then(r => r.json()).then(data => {
            if (data.user) {
                setUser(data.user)
                setEmail(data.user.email || '')
            }
        })
    }, [])

    return (
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>}>
            <Elements
                key={`${user?.id || 'guest'}-${email}`}
                stripe={stripePromise}
                options={{
                    mode: 'payment', // Required for pre-confirming/Stripe Link even if subscription
                    amount: 1, // Placeholder
                    currency: 'aed',
                    defaultValues: {
                        billingDetails: {
                            email: email,
                        }
                    }
                } as any}
            >
                <CheckoutSubscriptionForm />
            </Elements>
        </Suspense>
    )
}
