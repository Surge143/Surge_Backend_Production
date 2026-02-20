'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from '@stripe/react-stripe-js'
import styles from './checkout.module.css'
import { useParams } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function ShopCheckoutForm() {
    const stripe = useStripe()
    const elements = useElements()
    const params = useParams()
    const shopId = params.shopId as string

    // Form State
    const [shop, setShop] = useState<any>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [activeCustomizationIndex, setActiveCustomizationIndex] = useState<number | null>(null)

    interface FormState {
        email: string
        orderType: string
        timeSelection: string
        slot: string
        menuItems: any[]
        useWTCoins: boolean
        appliedCouponCode: string
        specialInstructions: string
        paymentMethodId: string
    }

    const [form, setForm] = useState<FormState>({
        email: '',
        orderType: 'take-away',
        timeSelection: 'now',
        slot: '',
        menuItems: [] as any[],
        useWTCoins: false,
        appliedCouponCode: '',
        specialInstructions: '',
        paymentMethodId: ''
    })

    // Initialization: Fetch Shop Details, Slots, Menu Items, AND Cart
    useEffect(() => {
        if (!shopId) return

        const init = async () => {
            setLoading(true)
            try {
                const [shopRes, slotsRes, productsRes, cartRes] = await Promise.all([
                    fetch(`/api/shop/${shopId}`),
                    fetch(`/api/slots?where[shop][equals]=${shopId}&limit=100`),
                    fetch(`/api/shop/${shopId}/menu-items`),
                    fetch('/api/app/cart')
                ])

                if (!shopRes.ok) throw new Error('Failed to fetch shop details')

                const shopData = await shopRes.json()
                const slotsData = await slotsRes.json()
                const productsData = await productsRes.json()
                const cartData = await cartRes.json()

                setShop(shopData)
                setSlots(slotsData.docs || [])
                setProducts(productsData.items || productsData.docs || [])

                // Pre-fill form (email from user if available, items from cart)
                if (cartData.items && Array.isArray(cartData.items)) {
                    const mappedItems = cartData.items.map((cartItem: any) => {
                        const product = (productsData.items || productsData.docs || []).find((p: any) => p.id === cartItem.productId);
                        if (!product) return null;

                        // Deep copy product customizations to serve as the base structure
                        const formCustomizations = JSON.parse(JSON.stringify(product.customizations || []));

                        // Hydrate with selections from cart
                        const cartCustoms = cartItem.customizations || [];

                        if (Array.isArray(cartCustoms)) {
                            // Try to map cart selections to the form structure
                            // We handle two cases: 
                            // 1. Cart has full structure (we look for enabled=true)
                            // 2. Cart has flat list of selected options (we match by label)

                            formCustomizations.forEach((panel: any) => {
                                panel.sections?.forEach((section: any) => {
                                    section.options?.forEach((option: any) => {
                                        // RESET STATE first to ensure cleaner defaults
                                        option.enabled = false;

                                        // Check if this option is selected in the cart data

                                        // Recursive/Deep search in cart data for this option label/price
                                        let isSelected = false;

                                        const findInCart = (nodes: any[]) => {
                                            for (const node of nodes) {
                                                // If node has 'enabled' property, respect it absolutely
                                                if (node.label === option.label && node.hasOwnProperty('enabled')) {
                                                    if (node.enabled === true) {
                                                        isSelected = true;
                                                    }
                                                    return;
                                                }

                                                // If node is a container (panel/section)
                                                if (node.sections) findInCart(node.sections);
                                                if (node.options) findInCart(node.options);

                                                // If cart is flat list of options WITHOUT enabled property
                                                if (node.label === option.label && !node.sections && !node.options && !node.hasOwnProperty('enabled')) {
                                                    // If it's a simple list without enabled flag, existence means selection
                                                    isSelected = true;
                                                    return;
                                                }
                                            }
                                        };

                                        findInCart(cartCustoms);

                                        if (isSelected) {
                                            option.enabled = true;
                                        }
                                    });
                                });
                            });
                        }

                        return {
                            product: cartItem.productId,
                            quantity: cartItem.quantity,
                            customizations: formCustomizations
                        };
                    }).filter(Boolean);

                    setForm(prev => ({
                        ...prev,
                        menuItems: mappedItems
                    }))
                }

            } catch (error) {
                console.error('Initialization error:', error)
                // alert('Failed to load shop data. Check console.')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [shopId])

    const addItem = () => {
        if (products.length === 0) return
        const firstProd = products[0]
        const newItemIndex = form.menuItems.length

        setForm(prev => ({
            ...prev,
            menuItems: [...prev.menuItems, {
                product: firstProd.id,
                quantity: 1,
                customizations: firstProd.customizations || []
            }]
        }))

        // Open customization immediately for new item
        setActiveCustomizationIndex(newItemIndex)
    }

    const removeItem = (index: number) => {
        setForm(prev => ({
            ...prev,
            menuItems: prev.menuItems.filter((_, i) => i !== index)
        }))
        if (activeCustomizationIndex === index) setActiveCustomizationIndex(null)
    }

    const updateItemProduct = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId)
        const newItems = [...form.menuItems]
        newItems[index] = {
            ...newItems[index],
            product: productId,
            customizations: product?.customizations || []
        }
        setForm(prev => ({ ...prev, menuItems: newItems }))
    }

    const updateQuantity = (index: number, newQuantity: number) => {
        const newItems = [...form.menuItems]
        newItems[index].quantity = Math.max(1, newQuantity)
        setForm(prev => ({ ...prev, menuItems: newItems }))
    }

    const toggleCustomization = (itemIndex: number, panelIdx: number, sectionIdx: number, optionIdx: number) => {
        const newItems = [...form.menuItems]
        const item = { ...newItems[itemIndex] }
        const customizations = JSON.parse(JSON.stringify(item.customizations)) // Deep copy

        const option = customizations[panelIdx].sections[sectionIdx].options[optionIdx]
        option.enabled = !option.enabled

        // Handle single choice selection
        if (option.enabled && customizations[panelIdx].sections[sectionIdx].selectionType === 'single') {
            customizations[panelIdx].sections[sectionIdx].options.forEach((opt: any, i: number) => {
                if (i !== optionIdx) opt.enabled = false
            })
        }

        item.customizations = customizations
        newItems[itemIndex] = item
        setForm(prev => ({ ...prev, menuItems: newItems }))
    }

    const getLineItemPrice = (item: any) => {
        const product = products.find(p => p.id === (typeof item.product === 'object' ? item.product.id : item.product))
        if (!product) return 0

        let itemPrice = product.salePrice || product.regularPrice || 0

        if (item.customizations) {
            item.customizations.forEach((panel: any) => {
                panel.sections?.forEach((section: any) => {
                    section.options?.forEach((option: any) => {
                        if (option.enabled) itemPrice += (option.price || 0)
                    })
                })
            })
        }
        return itemPrice * (item.quantity || 1)
    }

    const calculateSubtotal = () => {
        return form.menuItems.reduce((acc, item) => acc + getLineItemPrice(item), 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setProcessing(true)

        try {
            const cardElement = elements.getElement(CardNumberElement)
            let pmId = form.paymentMethodId

            if (cardElement && !pmId) {
                const { error, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement
                })
                if (error) throw new Error(error.message)
                pmId = paymentMethod.id
            }

            const payload = {
                ...form,
                shopId,
                paymentMethodId: pmId || 'pm_card_visa', // Fallback for manual testing
                menuItems: form.menuItems.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    customizations: item.customizations
                }))
            }

            console.log('Sending Payload:', payload)

            const res = await fetch('/api/checkout/cafeCheckout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Checkout failed')

            alert('Order Created Successfully! Check your console and Payload admin.')
            console.log('Success:', data)

            if (data.clientSecret) {
                const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
                if (confirmError) alert('Payment confirmation failed: ' + confirmError.message)
                else alert('Payment Successful!')
            }

        } catch (error: any) {
            alert('Error: ' + error.message)
            console.error(error)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div className={styles.container}>Loading Shop Checkout...</div>
    if (!shop) return <div className={styles.container}>Shop not found.</div>

    const subtotal = calculateSubtotal()

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Checkout: {shop.name}</h1>

            <form onSubmit={handleSubmit} className={styles.checkoutGrid}>
                <div className={styles.leftCol}>

                    {/* Basic Info */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>1. Contact Info</h2>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                className={styles.input}
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="test@example.com"
                            />
                        </div>
                    </div>

                    {/* Order Preferences */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>2. Order Preferences</h2>
                        <div className={styles.grid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Order Type</label>
                                <div className={styles.buttonGroup}>
                                    <button
                                        type="button"
                                        className={`${styles.tabButton} ${form.orderType === 'take-away' ? styles.activeTab : ''}`}
                                        onClick={() => setForm({ ...form, orderType: 'take-away' })}
                                    >Take Away</button>
                                    <button
                                        type="button"
                                        className={`${styles.tabButton} ${form.orderType === 'dine-in' ? styles.activeTab : ''}`}
                                        onClick={() => setForm({ ...form, orderType: 'dine-in' })}
                                    >Dine In</button>
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Time Selection</label>
                                <div className={styles.buttonGroup}>
                                    <button
                                        type="button"
                                        className={`${styles.tabButton} ${form.timeSelection === 'now' ? styles.activeTab : ''}`}
                                        onClick={() => setForm({ ...form, timeSelection: 'now', slot: '' })}
                                    >Now</button>
                                    <button
                                        type="button"
                                        className={`${styles.tabButton} ${form.timeSelection === 'custom' ? styles.activeTab : ''}`}
                                        onClick={() => setForm({ ...form, timeSelection: 'custom' })}
                                    >Later</button>
                                </div>
                            </div>

                            {form.timeSelection === 'custom' && (
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Select Slot</label>
                                    <select
                                        className={styles.select}
                                        required
                                        value={form.slot}
                                        onChange={e => setForm({ ...form, slot: e.target.value })}
                                    >
                                        <option value="">Choose a slot</option>
                                        {slots.map(s => <option key={s.id} value={s.id}>{s.from} - {s.to}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>3. Menu Items</h2>

                        {form.menuItems.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                Use &quot;+ Add Item&quot; to start your order.
                            </div>
                        )}

                        {form.menuItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.product)
                            if (!product) return null

                            const lineTotal = getLineItemPrice(item)

                            return (
                                <div key={idx} className={styles.itemCard}>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemHeader}>
                                            <select
                                                className={styles.select}
                                                style={{ flex: 1, fontWeight: 'bold' }}
                                                value={item.product}
                                                onChange={e => updateItemProduct(idx, e.target.value)}
                                            >
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <span className={styles.itemPrice}>AED {lineTotal.toFixed(2)}</span>
                                        </div>

                                        <div className={styles.itemControls}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <label className={styles.label} style={{ marginBottom: 0 }}>Qty:</label>
                                                <input
                                                    className={styles.input}
                                                    type="number"
                                                    style={{ width: '60px', padding: '6px' }}
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.customizeBtn}
                                                onClick={() => setActiveCustomizationIndex(idx)}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => removeItem(idx)}
                                        title="Remove Item"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                        <button type="button" className={styles.addItemBtn} onClick={addItem}>+ Add Item</button>
                    </div>

                    {/* Payment */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>4. Payment Information</h2>
                        <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                            <label className={styles.label}>Direct Payment Method ID (Optional)</label>
                            <input
                                className={styles.input}
                                value={form.paymentMethodId}
                                onChange={e => setForm({ ...form, paymentMethodId: e.target.value })}
                                placeholder="pm_card_visa"
                            />
                        </div>
                        <div style={{ padding: '15px', border: '1.5px solid #e5e7eb', borderRadius: '10px' }}>
                            <CardNumberElement options={{ style: { base: { fontSize: '16px' } } }} />
                            <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                <div style={{ flex: 1 }}><CardExpiryElement options={{ style: { base: { fontSize: '16px' } } }} /></div>
                                <div style={{ flex: 1 }}><CardCvcElement options={{ style: { base: { fontSize: '16px' } } }} /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.summary}>
                    <div className={styles.card}>
                        <h3 className={styles.sectionTitle}>Order Summary</h3>

                        {/* Cart Summary List in Sidebar */}
                        <div className={styles.summaryList}>
                            {form.menuItems.map((item, idx) => {
                                const product = products.find(p => p.id === item.product)
                                if (!product) return null
                                const lineTotal = getLineItemPrice(item)

                                return (
                                    <div key={idx} className={styles.summaryItem}>
                                        <div className={styles.summaryHeader}>
                                            <span>{item.quantity}x {product.name}</span>
                                            <span>AED {lineTotal.toFixed(2)}</span>
                                        </div>
                                        {item.customizations && (
                                            <div className={styles.summaryCustomizations}>
                                                {item.customizations.map((panel: any) =>
                                                    panel.sections?.map((section: any) =>
                                                        section.options?.filter((opt: any) => opt.enabled).map((opt: any, oIdx: number) => (
                                                            <div key={`${section.id}-${oIdx}`}>
                                                                + {opt.label}
                                                            </div>
                                                        ))
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className={styles.summaryRow}>
                            <span>Items Subtotal</span>
                            <span>AED {subtotal.toFixed(2)}</span>
                        </div>

                        <div className={styles.inputGroup} style={{ margin: '20px 0' }}>
                            <label className={styles.label}>Coupon Code</label>
                            <input
                                className={styles.input}
                                placeholder="WELCOME10"
                                value={form.appliedCouponCode}
                                onChange={e => setForm({ ...form, appliedCouponCode: e.target.value })}
                            />
                        </div>

                        <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                            <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.useWTCoins}
                                    onChange={e => setForm({ ...form, useWTCoins: e.target.checked })}
                                />
                                Use WTCoins
                            </label>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Special Instructions</label>
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={form.specialInstructions}
                                onChange={e => setForm({ ...form, specialInstructions: e.target.value })}
                                placeholder="No ice, extra hot, etc."
                            ></textarea>
                        </div>

                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span>AED {subtotal.toFixed(2)}</span>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={processing || form.menuItems.length === 0 || !form.email}
                        >
                            {processing ? 'Processing...' : `Place Order for ${shop.name}`}
                        </button>
                    </div>
                </div>

                {/* Customization Modal */}
                {activeCustomizationIndex !== null && form.menuItems[activeCustomizationIndex] && (
                    <div className={styles.modalOverlay} onClick={() => setActiveCustomizationIndex(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>
                                    Customize {products.find(p => p.id === form.menuItems[activeCustomizationIndex].product)?.name}
                                </h3>
                                <button type="button" className={styles.closeModalBtn} onClick={() => setActiveCustomizationIndex(null)}>✕</button>
                            </div>

                            <div className={styles.modalBody}>
                                {form.menuItems[activeCustomizationIndex].customizations && form.menuItems[activeCustomizationIndex].customizations.map((panel: any, pIdx: number) => (
                                    <div key={pIdx}>
                                        {panel.sections?.map((section: any, sIdx: number) => (
                                            <div key={sIdx} className={styles.optionGroup}>
                                                <div className={styles.optionTitle}>
                                                    {section.title} <span style={{ fontWeight: 'normal', color: '#888' }}>({section.selectionType})</span>
                                                </div>
                                                <div className={styles.optionsContainer}>
                                                    {section.options?.map((opt: any, oIdx: number) => (
                                                        <button
                                                            key={oIdx}
                                                            type="button"
                                                            className={`${styles.optionButton} ${opt.enabled ? styles.selected : ''}`}
                                                            onClick={() => toggleCustomization(activeCustomizationIndex, pIdx, sIdx, oIdx)}
                                                        >
                                                            {opt.label}
                                                            {opt.price > 0 && <span className={styles.priceAddon}>+AED {opt.price}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={styles.saveCustomizationBtn}
                                onClick={() => setActiveCustomizationIndex(null)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

            </form>
        </div>
    )
}

export default function ShopCheckoutMockup() {
    return (
        <Elements stripe={stripePromise}>
            <ShopCheckoutForm />
        </Elements>
    )
}
