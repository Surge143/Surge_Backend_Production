'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../../app.module.css'
import pageStyles from './menu.module.css'
import { useAppCart } from '../../../_components/AppShell'
import { getProductPreference } from '../actions'

interface Product {
    id: string | number
    name: string
    price: number
    salePrice?: number
    tagline?: string
    image?: { url: string }
    customizations?: any[]
    slug: string
}

interface Selection { sectionTitle: string; label: string; price: number }
interface SavedPref { productId: string; customizations: Selection[]; savedAt: string }
type ModalView = 'preference-choice' | 'customization'

export default function MenuPage() {
    const { shopId } = useParams<{ shopId: string }>()
    const router = useRouter()
    const { refreshCart } = useAppCart()

    const [shop, setShop] = useState<any>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Sheet state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [modalView, setModalView] = useState<ModalView>('customization')
    const [savedPref, setSavedPref] = useState<SavedPref | null>(null)
    const [currentSelections, setCurrentSelections] = useState<Selection[]>([])
    const [adding, setAdding] = useState(false)
    const [fetchingPref, setFetchingPref] = useState<string | number | null>(null)
    const [mixedCartDialog, setMixedCartDialog] = useState<{ visible: boolean; currentOrigin: string; pendingAdd: () => Promise<void> } | null>(null)

    useEffect(() => {
        if (!shopId) return
        Promise.all([
            fetch(`/api/shop/${shopId}`).then(r => r.json()),
            fetch(`/api/shop/${shopId}/menu-items?limit=50`).then(r => r.json()),
        ]).then(([shopData, menuData]) => {
            setShop(shopData)
            setProducts(menuData.items || menuData.docs || [])
        }).catch(console.error).finally(() => setLoading(false))
    }, [shopId])


    const handleProductTap = async (product: Product) => {
        if (fetchingPref) return

        // 1. Open sheet immediately with base customizations view
        setSelectedProduct(product)
        setCurrentSelections([])
        setSavedPref(null)
        setFetchingPref(product.id)
        setModalView('customization')

        console.log(`[Menu] Tapped product: ${product.name} (${product.id}). Fetching preferences...`)

        try {
            const pref = await getProductPreference(product.id)
            console.log(`[Menu] Preference fetch result for ${product.id}:`, pref)

            if (pref) {
                setSavedPref(pref as any)
                setModalView('preference-choice')
            } else {
                // If no pref, we stay in 'customization' which we set earlier
                setModalView('customization')
            }
        } catch (e) {
            console.error('[Menu] Failed to fetch preferences:', e)
            setModalView('customization')
        } finally {
            setFetchingPref(null)
        }
    }

    const closeSheet = () => {
        setSelectedProduct(null)
        setSavedPref(null)
        setCurrentSelections([])
    }

    const toggleOption = (sectionTitle: string, option: { label: string; price: number }) => {
        setCurrentSelections(prev => {
            const exists = prev.some(s => s.sectionTitle === sectionTitle && s.label === option.label)
            if (exists) return prev.filter(s => !(s.sectionTitle === sectionTitle && s.label === option.label))
            return [...prev.filter(s => s.sectionTitle !== sectionTitle), { sectionTitle, label: option.label, price: option.price }]
        })
    }

    const addToCart = async (customizations: Selection[]) => {
        if (!selectedProduct || adding) return
        setAdding(true)
        try {
            const doAdd = async () => fetch('/api/app/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: 1,
                    relationTo: 'shop-menu',
                    customizations: customizations.map(s => ({ sectionTitle: s.sectionTitle, label: s.label })),
                }),
            })

            const res = await doAdd()
            const data = await res.json()

            if (!res.ok) {
                if (data.error === 'MIXED_CART') {
                    setMixedCartDialog({
                        visible: true,
                        currentOrigin: data.currentOrigin,
                        pendingAdd: async () => {
                            await fetch('/api/app/cart', { method: 'DELETE' })
                            const retry = await doAdd()
                            if (retry.ok) {
                                closeSheet()
                                refreshCart()
                            }
                        }
                    })
                } else {
                    console.error('Cart error:', data.error)
                }
                return
            }

            closeSheet()
            refreshCart()
        } catch (e) { console.error(e) }
        finally { setAdding(false) }
    }

    const basePrice = (p: Product) => p.salePrice || p.price
    const totalPrice = selectedProduct
        ? basePrice(selectedProduct) + currentSelections.reduce((a, s) => a + s.price, 0)
        : 0

    if (loading) return (
        <div>
            <div className={pageStyles.shopHeader}>
                <div className={styles.spinner} />
            </div>
        </div>
    )

    return (
        <>
            {/* Shop Header */}
            <div className={pageStyles.shopHeader}>
                <button className={styles.appBarBack} onClick={() => router.push('/app')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className={pageStyles.shopHeaderInfo}>
                    <h1 className={pageStyles.shopTitle}>{shop?.name || 'Menu'}</h1>
                    {shop?.tagline && <p className={pageStyles.shopSubtitle}>{shop.tagline}</p>}
                </div>
                <Link href="/app/cart" className={pageStyles.cartBtn}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                </Link>
            </div>

            {/* Product Grid */}
            <div className={pageStyles.productGrid}>
                {products.map(product => (
                    <button key={product.id} className={pageStyles.productCard} onClick={() => handleProductTap(product)}>
                        <div className={pageStyles.productImageWrap}>
                            {product.image?.url ? (
                                <Image src={product.image.url} alt={product.name} className={pageStyles.productImage} width={200} height={200} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={pageStyles.productImagePlaceholder}>☕</div>
                            )}
                        </div>
                        <div className={pageStyles.productInfo}>
                            <h3 className={pageStyles.productName}>{product.name}</h3>
                            {product.tagline && <p className={pageStyles.productTagline}>{product.tagline}</p>}
                            <div className={pageStyles.productPriceRow}>
                                {product.salePrice ? (
                                    <>
                                        <span className={pageStyles.oldPrice}>AED {product.price}</span>
                                        <span className={pageStyles.price}>AED {product.salePrice}</span>
                                    </>
                                ) : (
                                    <span className={pageStyles.price}>AED {product.price}</span>
                                )}
                                <span className={pageStyles.addBtn}>
                                    {fetchingPref === product.id ? <div className={styles.spinner} style={{ width: 14, height: 14 }} /> : '+'}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Sheet */}
            {selectedProduct && (
                <div className={styles.sheetOverlay} onClick={closeSheet}>
                    <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                        <div className={styles.sheetHandle} />

                        {fetchingPref === selectedProduct.id && (
                            <div className={pageStyles.loadingBar}>
                                <div className={pageStyles.loadingFill} />
                                <p style={{ fontSize: 10, textAlign: 'center', marginTop: 8, color: 'var(--color-primary)' }}>
                                    Looking for your usual...
                                </p>
                            </div>
                        )}

                        {/* ── Preference Choice ── */}
                        {modalView === 'preference-choice' && savedPref && (
                            <div className={pageStyles.prefScreen}>
                                <h2 className={pageStyles.sheetTitle}>{selectedProduct.name}</h2>
                                {selectedProduct.tagline && <p className={pageStyles.sheetSub}>{selectedProduct.tagline}</p>}

                                <div className={pageStyles.prefCard}>
                                    <div className={pageStyles.prefBadge}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Your Usual Selection
                                    </div>
                                    <div className={pageStyles.prefItems}>
                                        {savedPref.customizations.map((c, i) => (
                                            <div key={i} className={pageStyles.prefItem}>
                                                <span className={pageStyles.prefSection}>{c.sectionTitle}</span>
                                                <span className={pageStyles.prefLabel}>{c.label}</span>
                                                {c.price > 0 && <span className={pageStyles.prefPrice}>+AED {c.price}</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={pageStyles.prefTotal}>
                                        AED {basePrice(selectedProduct) + savedPref.customizations.reduce((a, c) => a + (c.price || 0), 0)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={() => addToCart(savedPref.customizations)}
                                        disabled={adding}
                                    >
                                        {adding ? 'Adding…' : 'Add Your Usual'}
                                    </button>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <button
                                            className={styles.btnGhost}
                                            onClick={() => {
                                                setCurrentSelections(savedPref.customizations);
                                                setModalView('customization');
                                            }}
                                        >
                                            Edit Usual
                                        </button>
                                        <button
                                            className={styles.btnGhost}
                                            onClick={() => {
                                                setCurrentSelections([]);
                                                setModalView('customization');
                                            }}
                                        >
                                            Start Fresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Customization Panel ── */}
                        {modalView === 'customization' && (
                            <>
                                {savedPref && (
                                    <button className={pageStyles.backBtn} onClick={() => setModalView('preference-choice')}>
                                        ← Back
                                    </button>
                                )}
                                <h2 className={pageStyles.sheetTitle}>{selectedProduct.name}</h2>
                                {selectedProduct.tagline && <p className={pageStyles.sheetSub}>{selectedProduct.tagline}</p>}

                                {selectedProduct.customizations?.map((panel: any) => (
                                    <React.Fragment key={panel.id}>
                                        {panel.sections?.map((section: any) => (
                                            <div key={section.id} className={pageStyles.customSection}>
                                                <div className={pageStyles.customSectionTitle}>{section.title}</div>
                                                <div className={pageStyles.optionList}>
                                                    {/* Case 1: Grouped options (e.g. "Milk" / "Non-Dairy") */}
                                                    {section.groups?.length > 0
                                                        ? section.groups.map((group: any) => (
                                                            <React.Fragment key={group.id}>
                                                                {group.groupTitle && (
                                                                    <div className={pageStyles.groupTitle}>{group.groupTitle}</div>
                                                                )}
                                                                {group.options?.map((opt: any) => {
                                                                    const active = currentSelections.some(s => s.sectionTitle === section.title && s.label === opt.label)
                                                                    return (
                                                                        <button
                                                                            key={opt.id}
                                                                            className={`${pageStyles.optionItem} ${active ? pageStyles.optionActive : ''}`}
                                                                            onClick={() => toggleOption(section.title, opt)}
                                                                        >
                                                                            <span>{opt.label}</span>
                                                                            {opt.price > 0 && <span className={pageStyles.optionPrice}>+AED {opt.price}</span>}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </React.Fragment>
                                                        ))
                                                        : /* Case 2: Flat options (no groups) */
                                                        section.options?.map((opt: any) => {
                                                            const active = currentSelections.some(s => s.sectionTitle === section.title && s.label === opt.label)
                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    className={`${pageStyles.optionItem} ${active ? pageStyles.optionActive : ''}`}
                                                                    onClick={() => toggleOption(section.title, opt)}
                                                                >
                                                                    <span>{opt.label}</span>
                                                                    {opt.price > 0 && <span className={pageStyles.optionPrice}>+AED {opt.price}</span>}
                                                                </button>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}

                                <div style={{ height: 16 }} />
                                <button className={styles.btnPrimary} onClick={() => addToCart(currentSelections)} disabled={adding}>
                                    {adding ? 'Adding…' : `Add to Cart — AED ${totalPrice}`}
                                </button>
                            </>
                        )}
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
