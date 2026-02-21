"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from "@stripe/react-stripe-js";
import styles from "./checkout-test.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface SavedCard {
    id: string;
    brand: string;
    last4: string;
    expMonth: number | undefined;
    expYear: number | undefined;
}

function CheckoutForm({ savedCards }: { savedCards: SavedCard[] }) {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
        savedCards.length > 0 ? savedCards[0].id : 'new'
    );

    // USER PROVIDED DATA
    const [email, setEmail] = useState("testuser@example.com");
    const [deliveryOption, setDeliveryOption] = useState("delivery");
    const [useWTCoins, setUseWTCoins] = useState(true);
    const [shippingAsBilling, setShippingAsBilling] = useState(true);

    const [shippingAddress, setShippingAddress] = useState({
        addressFirstName: "Test User",
        addressLastName: "Test User",
        phoneNumber: "+91 9876543210",
        addressLine1: "123 Test Street",
        addressLine2: "Near Coffee Shop",
        city: "Bengaluru",
        emirates: "dubai",
        country: "United Arab",
    });

    const [billingAddress, setBillingAddress] = useState({
        addressFirstName: "Test User",
        addressLastName: "Test User",
        phoneNumber: "+91 9876543210",
        addressLine1: "123 Test Street",
        addressLine2: "Near Coffee Shop",
        city: "Bengaluru",
        emirates: "dubai",
        country: "United Arab",
    });

    // HARDCODED PRODUCT
    const product = {
        productId: 4,
        variantId: "698eee6cc433ecd1067dfb3e",
        quantity: 2,
        price: 80,
        name: "Hardcoded Product #4",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe) return;

        setIsProcessing(true);
        setMessage(null);

        try {
            let paymentMethodId: string;

            if (selectedPaymentMethod !== 'new') {
                paymentMethodId = selectedPaymentMethod;
            } else {
                if (!elements) throw new Error('Elements not loaded');
                const cardElement = elements.getElement(CardNumberElement);
                if (!cardElement) throw new Error("Card element not found");

                const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                    type: "card",
                    card: cardElement,
                    billing_details: {
                        email,
                        name: billingAddress.addressFirstName + " " + billingAddress.addressLastName,
                        address: { city: billingAddress.city, country: "AE" },
                    },
                });

                if (pmError) throw new Error(pmError.message);
                paymentMethodId = paymentMethod!.id;
            }

            const response = await fetch("/api/checkout/one-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    deliveryOption,
                    paymentMethodId,
                    useWTCoins,
                    shippingAddressAsBillingAddress: shippingAsBilling,
                    shippingAddress,
                    billingAddress: shippingAsBilling ? shippingAddress : billingAddress,
                    product, // Singular product field as requested
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Something went wrong");

            // Confirm Payment
            const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
            if (confirmError) throw new Error(confirmError.message);

            setMessage({ type: 'success', text: `Success! Order ID: ${data.orderId}` });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.Main}>
            <div className={styles.Container}>
                <div className={styles.FormSection}>
                    <div>
                        <h1 className={styles.Title}>Checkout Test</h1>
                        <p className={styles.Subtitle}>Sending user-provided JSON data to API</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.SectionTitle}>Contact Details</div>
                        <div className={styles.InputGroup}>
                            <input
                                className={styles.Input}
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.SectionTitle}>Shipping Address</div>
                        <div className={styles.Grid}>
                            <input
                                className={styles.Input}
                                placeholder="First Name"
                                value={shippingAddress.addressFirstName}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, addressFirstName: e.target.value })}
                                required
                            />
                            <input
                                className={styles.Input}
                                placeholder="Last Name"
                                value={shippingAddress.addressLastName}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, addressLastName: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.InputGroup} style={{ marginTop: '15px' }}>
                            <input
                                className={styles.Input}
                                placeholder="Phone"
                                value={shippingAddress.phoneNumber}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.InputGroup} style={{ marginTop: '15px' }}>
                            <input
                                className={styles.Input}
                                placeholder="Address Line 1"
                                value={shippingAddress.addressLine1}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                                required
                            />
                            <input
                                className={styles.Input}
                                placeholder="Address Line 2 (Optional)"
                                value={shippingAddress.addressLine2}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                            />
                        </div>
                        <div className={styles.Grid} style={{ marginTop: '15px' }}>
                            <input
                                className={styles.Input}
                                placeholder="City"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                required
                            />
                            <select
                                className={styles.Input}
                                value={shippingAddress.emirates}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, emirates: e.target.value })}
                            >
                                <option value="abu_dhabi">Abu Dhabi</option>
                                <option value="dubai">Dubai</option>
                                <option value="sharjah">Sharjah</option>
                                <option value="ajman">Ajman</option>
                                <option value="umm_al_quwain">Umm Al Quwain</option>
                                <option value="ras_al_khaimah">Ras Al Khaimah</option>
                                <option value="fujairah">Fujairah</option>
                            </select>
                        </div>

                        <div className={styles.SectionTitle} style={{ marginTop: '30px' }}>Payment Method</div>

                        {/* Saved card picker */}
                        {savedCards.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                {savedCards.map(card => (
                                    <label key={card.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                        borderRadius: 8, cursor: 'pointer', border: `2px solid ${selectedPaymentMethod === card.id ? '#4f46e5' : '#e5e7eb'}`,
                                        background: selectedPaymentMethod === card.id ? '#eef2ff' : '#fff',
                                    }}>
                                        <input type="radio" name="pm" value={card.id} checked={selectedPaymentMethod === card.id} onChange={() => setSelectedPaymentMethod(card.id)} />
                                        <span>💳 {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)}</span>
                                        <span style={{ color: '#6b7280' }}>•••• {card.last4} &nbsp; {card.expMonth?.toString().padStart(2, '0')}/{card.expYear}</span>
                                    </label>
                                ))}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                    borderRadius: 8, cursor: 'pointer', border: `2px solid ${selectedPaymentMethod === 'new' ? '#4f46e5' : '#e5e7eb'}`,
                                    background: selectedPaymentMethod === 'new' ? '#eef2ff' : '#fff',
                                }}>
                                    <input type="radio" name="pm" value="new" checked={selectedPaymentMethod === 'new'} onChange={() => setSelectedPaymentMethod('new')} />
                                    <span>➕ Use a new card</span>
                                </label>
                            </div>
                        )}

                        {/* New card elements */}
                        {selectedPaymentMethod === 'new' && (
                            <div className={styles.StripeElementContainer}>
                                <div className={styles.StripeElement}><CardNumberElement options={{ style: { base: { fontSize: '16px' } } }} /></div>
                                <div className={styles.Grid}>
                                    <div className={styles.StripeElement}><CardExpiryElement options={{ style: { base: { fontSize: '16px' } } }} /></div>
                                    <div className={styles.StripeElement}><CardCvcElement options={{ style: { base: { fontSize: '16px' } } }} /></div>
                                </div>
                            </div>
                        )}

                        <div className={styles.SectionTitle} style={{ marginTop: '30px' }}>Options</div>
                        <label className={styles.CheckboxRow}>
                            <input
                                type="checkbox"
                                className={styles.Checkbox}
                                checked={useWTCoins}
                                onChange={() => setUseWTCoins(!useWTCoins)}
                            />
                            Use WT Coins (Applied automatically if logged in)
                        </label>
                        <label className={styles.CheckboxRow}>
                            <input
                                type="checkbox"
                                className={styles.Checkbox}
                                checked={shippingAsBilling}
                                onChange={() => setShippingAsBilling(!shippingAsBilling)}
                            />
                            Billing address same as shipping
                        </label>

                        <button type="submit" disabled={isProcessing} className={styles.SubmitButton}>
                            {isProcessing ? "Processing Payment..." : `Pay AED ${product.price * product.quantity}`}
                        </button>

                        {message && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                borderRadius: '12px',
                                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                                color: message.type === 'success' ? '#155724' : '#721c24',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {message.text}
                            </div>
                        )}
                    </form>
                </div>

                <div className={styles.SummarySection}>
                    <div className={styles.SectionTitle}>Order Summary</div>
                    <div className={styles.ProductCard}>
                        <div style={{ width: 60, height: 60, background: '#eee', borderRadius: 12 }}></div>
                        <div className={styles.ProductInfo}>
                            <div className={styles.ProductName}>{product.name}</div>
                            <div className={styles.ProductDetail}>Qty: {product.quantity} • {product.variantId.substring(0, 8)}...</div>
                        </div>
                        <div className={styles.ProductName}>AED {product.price}</div>
                    </div>

                    <div className={styles.Totals}>
                        <div className={styles.TotalRow}>
                            <span>Subtotal</span>
                            <span>AED {product.price * product.quantity}</span>
                        </div>
                        <div className={styles.TotalRow}>
                            <span>Shipping</span>
                            <span>{deliveryOption === 'delivery' ? 'Calculated at API' : 'Free Pickup'}</span>
                        </div>
                        <div className={styles.TotalRow + " " + styles.GrandTotal}>
                            <span>Total</span>
                            <span>AED {product.price * product.quantity}*</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>* Final total (taxes/shipping) calculated by backend.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutTestPage() {
    const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        fetch('/api/stripe/payment-methods')
            .then(r => r.ok ? r.json() : { paymentMethods: [] })
            .then(data => setSavedCards(data.paymentMethods ?? []))
            .catch(() => setSavedCards([]))
            .finally(() => setReady(true));
    }, []);

    if (!ready) return <div style={{ padding: '2rem' }}>Loading payment options...</div>;

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm savedCards={savedCards} />
        </Elements>
    );
}
