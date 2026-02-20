'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from '../app.module.css'
import pageStyles from './home.module.css'
import { useAppCart } from '../_components/AppShell'

interface Shop {
    id: string
    name: string
    address?: {
        street?: string
        apartment?: string
        city?: string
        emirates: string
        country?: string
    }
    image?: { url: string }
    tagline?: string
}

export default function AppHomePage() {
    const [shops, setShops] = useState<Shop[]>([])
    const [view, setView] = useState<'cafe' | 'store'>('cafe')
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null)
    const [selectedFrequency, setSelectedFrequency] = useState<any | null>(null)
    const [adding, setAdding] = useState(false)
    const [mixedCartDialog, setMixedCartDialog] = useState<{ visible: boolean; currentOrigin: string; pendingAdd: () => Promise<void> } | null>(null)
    const router = useRouter()
    const { refreshCart } = useAppCart()

    useEffect(() => {
        setLoading(true)
        if (view === 'cafe') {
            fetch('/api/shop?limit=100')
                .then(r => r.json())
                .then(d => setShops(d.docs || []))
                .catch(console.error)
                .finally(() => setLoading(false))
        } else {
            fetch('/api/web-products?limit=100')
                .then(r => r.json())
                .then(d => {
                    const docs = d.docs || []
                    setProducts(docs)
                })
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [view])

    const handleProductTap = (product: any) => {
        setSelectedProduct(product)
        if (product.hasVariantOptions && product.variants?.length > 0) {
            setSelectedVariant(product.variants[0])
        } else {
            setSelectedVariant(null)
        }
        setSelectedFrequency(null)
    }

    const handleAddToCart = async () => {
        if (!selectedProduct || adding) return
        setAdding(true)
        try {
            const doAdd = async () => fetch('/api/app/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: 1,
                    vId: selectedVariant?.id || null,
                }),
            })

            const res = await doAdd()
            const data = await res.json()

            if (!res.ok) {
                if (data.error === 'MIXED_CART') {
                    // Show custom popup instead of browser confirm
                    setMixedCartDialog({
                        visible: true,
                        currentOrigin: data.currentOrigin,
                        pendingAdd: async () => {
                            await fetch('/api/app/cart', { method: 'DELETE' })
                            const retry = await doAdd()
                            if (retry.ok) {
                                refreshCart()
                                setSelectedProduct(null)
                            }
                        },
                    })
                } else {
                    console.error('Cart error:', data.error)
                }
                return
            }
            refreshCart()
            setSelectedProduct(null)
        } catch (e) { console.error(e) }
        finally { setAdding(false) }
    }

    const handleSubscribe = () => {
        if (!selectedProduct || !selectedFrequency) return
        const params = new URLSearchParams({
            productId: selectedProduct.id.toString(),
            quantity: '1',
            frequencyId: selectedFrequency.id,
        })
        if (selectedVariant) {
            params.append('variantId', selectedVariant.id)
        }
        router.push(`/checkout-subscription?${params.toString()}`)
    }

    const currentPrice = () => {
        if (!selectedProduct) return 0
        if (selectedProduct.hasVariantOptions && selectedVariant) {
            return selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice
        }
        return selectedProduct.salePrice || selectedProduct.regularPrice || 0
    }

    const subFreqs = () => {
        if (!selectedProduct) return []
        if (selectedProduct.hasVariantOptions && selectedVariant) {
            return selectedVariant.subFreq || []
        }
        return selectedProduct.subFreq || []
    }

    return (
        <>
            {/* Hero */}
            <div className={pageStyles.hero}>
                <div className={pageStyles.heroGlow} />
                <div className={pageStyles.heroContent}>
                    <div className={pageStyles.logoMark}>{view === 'cafe' ? '☕' : '📦'}</div>
                    <h1 className={pageStyles.heroTitle}>White Mantis</h1>
                    <p className={pageStyles.heroSub}>
                        {view === 'cafe' ? 'Premium cafe experience, your way.' : 'Premium collection, delivered to your door.'}
                    </p>
                </div>
            </div>

            {/* View Toggle */}
            <div className={pageStyles.tabs}>
                <button
                    className={`${pageStyles.tab} ${view === 'cafe' ? pageStyles.tabActive : ''}`}
                    onClick={() => setView('cafe')}
                >
                    Cafe
                </button>
                <button
                    className={`${pageStyles.tab} ${view === 'store' ? pageStyles.tabActive : ''}`}
                    onClick={() => setView('store')}
                >
                    Store
                </button>
            </div>

            {/* Content */}
            <div className={pageStyles.section}>
                <div className={styles.sectionHeader}>
                    {view === 'cafe' ? 'Choose a Location' : 'White Mantis Store'}
                </div>

                {loading && <div className={styles.spinner} />}

                {!loading && view === 'cafe' && shops.length === 0 && (
                    <div className={styles.emptyState}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                        <h3>No shops available</h3>
                        <p>Check back soon.</p>
                    </div>
                )}

                {!loading && view === 'store' && products.length === 0 && (
                    <div className={styles.emptyState}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        <h3>No products found</h3>
                        <p>Store is being restocked.</p>
                    </div>
                )}

                {view === 'cafe' && (
                    <div className={pageStyles.shopGrid}>
                        {shops.map(shop => (
                            <button
                                key={shop.id}
                                className={pageStyles.shopCard}
                                onClick={() => router.push(`/app/menu/${shop.id}`)}
                            >
                                <div className={pageStyles.shopImageWrap}>
                                    {shop.image?.url ? (
                                        <Image src={shop.image.url} alt={shop.name} className={pageStyles.shopImage} width={400} height={200} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div className={pageStyles.shopImagePlaceholder}>☕</div>
                                    )}
                                    <div className={pageStyles.shopImageOverlay} />
                                </div>
                                <div className={pageStyles.shopInfo}>
                                    <h3 className={pageStyles.shopName}>{shop.name}</h3>
                                    {shop.tagline && <p className={pageStyles.shopTagline}>{shop.tagline}</p>}
                                    {shop.address && (
                                        <p className={pageStyles.shopAddress}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {shop.address.city}, {shop.address.emirates?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </p>
                                    )}
                                    <div className={pageStyles.shopCta}>
                                        View Menu
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {view === 'store' && (
                    <div className={pageStyles.productGrid}>
                        {products.map(product => (
                            <div key={product.id} className={pageStyles.productCard} onClick={() => handleProductTap(product)}>
                                <div className={pageStyles.productImageWrap}>
                                    {product.productImage?.url ? (
                                        <Image src={product.productImage.url} alt={product.name} className={pageStyles.productImage} width={200} height={200} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div className={pageStyles.shopImagePlaceholder}>📦</div>
                                    )}
                                </div>
                                <div className={pageStyles.productInfo}>
                                    <h3 className={pageStyles.productName}>{product.name}</h3>
                                    <div className={pageStyles.productPrice}>
                                        AED {product.salePrice || product.regularPrice}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Store Selection Sheet */}
            {selectedProduct && (
                <div className={styles.sheetOverlay} onClick={() => setSelectedProduct(null)}>
                    <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                        <div className={styles.sheetHandle} />
                        <h2 className={pageStyles.sheetTitle}>{selectedProduct.name}</h2>
                        {selectedProduct.tagline && <p className={pageStyles.sheetSub}>{selectedProduct.tagline}</p>}

                        <div className={pageStyles.sheetContent}>
                            {/* Variant Selection */}
                            {selectedProduct.hasVariantOptions && selectedProduct.variants?.length > 0 && (
                                <div className={pageStyles.sheetSection}>
                                    <div className={pageStyles.sectionLabel}>Select Option</div>
                                    <div className={pageStyles.optionGrid}>
                                        {selectedProduct.variants.map((v: any) => (
                                            <button
                                                key={v.id}
                                                className={`${pageStyles.optionChip} ${selectedVariant?.id === v.id ? pageStyles.optionChipActive : ''}`}
                                                onClick={() => { setSelectedVariant(v); setSelectedFrequency(null); }}
                                            >
                                                {v.variantName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subscription Options */}
                            {subFreqs().length > 0 && (
                                <div className={pageStyles.sheetSection}>
                                    <div className={pageStyles.sectionLabel}>Subscription (Save {selectedVariant?.subscriptionDiscount || selectedProduct.subscriptionDiscount}%)</div>
                                    <div className={pageStyles.frequencyList}>
                                        {subFreqs().map((f: any) => (
                                            <button
                                                key={f.id}
                                                className={`${pageStyles.freqCard} ${selectedFrequency?.id === f.id ? pageStyles.freqCardActive : ''}`}
                                                onClick={() => setSelectedFrequency(f)}
                                            >
                                                <div className={pageStyles.freqDetails}>
                                                    <span className={pageStyles.freqLabel}>Every {f.duration} {f.interval}{f.duration > 1 ? 's' : ''}</span>
                                                    <span className={pageStyles.freqPrice}>
                                                        AED {(currentPrice() * (1 - (selectedVariant?.subscriptionDiscount || selectedProduct.subscriptionDiscount) / 100)).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className={pageStyles.freqRadio}>
                                                    <div className={pageStyles.radioOutline}>
                                                        {selectedFrequency?.id === f.id && <div className={pageStyles.radioDot} />}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={pageStyles.sheetFooter}>
                            {selectedFrequency ? (
                                <button className={styles.btnPrimary} onClick={handleSubscribe}>
                                    Save & Subscribe — AED {(currentPrice() * (1 - (selectedVariant?.subscriptionDiscount || selectedProduct.subscriptionDiscount) / 100)).toFixed(2)}
                                </button>
                            ) : (
                                <button className={styles.btnPrimary} onClick={handleAddToCart} disabled={adding}>
                                    {adding ? 'Adding...' : `Add to Cart — AED ${currentPrice().toFixed(2)}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mixed Cart Conflict Sheet */}
            {mixedCartDialog?.visible && (
                <div className={styles.sheetOverlay} onClick={() => setMixedCartDialog(null)}>
                    <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                        <div className={styles.sheetHandle} />
                        <h2 className={pageStyles.sheetTitle}>Cart Conflict</h2>
                        <p className={pageStyles.sheetSub}>
                            Your cart already contains {mixedCartDialog.currentOrigin === 'cafe' ? 'Cafe' : 'Store'} items.
                            To add this item, we need to clear your current cart.
                        </p>

                        <div className={pageStyles.sheetContent}>
                            <button
                                className={styles.btnPrimary}
                                onClick={async () => {
                                    const action = mixedCartDialog.pendingAdd;
                                    setMixedCartDialog(null);
                                    await action();
                                }}
                            >
                                Clear Cart & Add Item
                            </button>
                            <button
                                className={styles.btnGhost}
                                onClick={() => setMixedCartDialog(null)}
                            >
                                Keep My Current Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
