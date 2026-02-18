'use client'

import React, { useState, useEffect } from 'react'
import styles from './tester.module.css'

interface Product {
    id: string | number
    name: string
    price: number
    salePrice?: number
    tagline?: string
    image?: any
    customizations?: any[]
    slug: string
}

interface Selection {
    sectionTitle: string
    label: string
    price: number
}

export default function AppTesterPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<any[]>([])
    const [cartShopId, setCartShopId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [shops, setShops] = useState<any[]>([])
    const [selectedShopId, setSelectedShopId] = useState<string>('')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [editingItemId, setEditingItemId] = useState<string | number | null>(null)
    const [currentSelections, setCurrentSelections] = useState<Selection[]>([])
    const [lastRequestJson, setLastRequestJson] = useState<any>(null)

    // 1. Initial Fetch
    useEffect(() => {
        fetchShops()
        fetchCart()
    }, [])

    useEffect(() => {
        if (selectedShopId) {
            fetchProducts(selectedShopId)
        }
    }, [selectedShopId])

    const fetchShops = async () => {
        try {
            const res = await fetch('/api/shop?limit=100')
            const data = await res.json()
            if (data.docs) {
                setShops(data.docs)
                if (data.docs.length > 0) setSelectedShopId(data.docs[0].id)
            }
        } catch (err) {
            console.error('Fetch shops error:', err)
        }
    }

    const fetchCart = async () => {
        try {
            const cartRes = await fetch('/api/app/cart')
            const cartData = await cartRes.json()
            if (cartData.items) setCart(cartData.items)
            if (cartData.shop) {
                setCartShopId(typeof cartData.shop === 'object' ? cartData.shop.id : cartData.shop)
            }
        } catch (err) {
            console.error('Fetch cart error:', err)
        }
    }

    const fetchProducts = async (shopId: string) => {
        setLoading(true)
        try {
            // Use the custom route made in the shop collection
            const prodRes = await fetch(`/api/shop/${shopId}/menu-items?limit=20`)
            const prodData = await prodRes.json()
            // The custom route returns { success: true, items: [...] }
            if (prodData.items) setProducts(prodData.items)
        } catch (err) {
            console.error('Fetch items error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchInitialData = async () => {
        if (selectedShopId) fetchProducts(selectedShopId)
        fetchCart()
    }

    // 2. Selection Logic
    const handleProductClick = (product: Product) => {
        setSelectedProduct(product)
        setEditingItemId(null)
        setCurrentSelections([])
    }

    const handleEditClick = async (item: any) => {
        setLoading(true)
        try {
            // 1. Try to find in existing products
            let product = products.find(p => String(p.id) === String(item.productId))

            // 2. If not found, fetch it via the CUSTOM shop endpoint
            if (!product && cartShopId) {
                const res = await fetch(`/api/shop/${cartShopId}/menu-items/${item.productId}`)
                if (res.ok) {
                    const data = await res.json()
                    // The custom route returns { success: true, item: { ... } }
                    if (data.item) {
                        const it = data.item
                        product = {
                            id: it.id,
                            name: it.name,
                            price: it.regularPrice, // Map regularPrice to price
                            salePrice: it.salePrice,
                            tagline: it.tagline,
                            image: it.image,
                            customizations: it.customizations,
                            slug: it.slug
                        }
                    }
                }
            }

            if (!product) {
                alert('Product details not found. Make sure the shop matches the cart items.')
                return
            }

            setEditingItemId(item.id)
            setSelectedProduct(product)
            // item.customizations are already {sectionTitle, label, price}
            setCurrentSelections(item.customizations.map((c: any) => ({
                sectionTitle: c.sectionTitle,
                label: c.label,
                price: c.price || 0
            })))
        } catch (err) {
            console.error('Edit error:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleOption = (sectionTitle: string, option: any) => {
        const isSelected = currentSelections.some(s => s.sectionTitle === sectionTitle && s.label === option.label)

        if (isSelected) {
            setCurrentSelections(prev => prev.filter(s => !(s.sectionTitle === sectionTitle && s.label === option.label)))
        } else {
            // Find and remove other selections from the same section if it's single choice (default for testing)
            // Note: Real logic would check section.selectionType
            setCurrentSelections(prev => [
                ...prev.filter(s => s.sectionTitle !== sectionTitle),
                { sectionTitle, label: option.label, price: option.price }
            ])
        }
    }

    // 3. Cart Logic
    const handleSave = async () => {
        if (!selectedProduct) return

        const customizations = currentSelections.map(s => ({
            sectionTitle: s.sectionTitle,
            label: s.label
        }))

        try {
            let res
            if (editingItemId) {
                // UPDATE
                const payload = {
                    itemId: editingItemId,
                    customizations: customizations
                }
                setLastRequestJson(payload)
                res = await fetch('/api/app/cart', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            } else {
                // CREATE
                const payload = {
                    productId: selectedProduct.id,
                    quantity: 1,
                    relationTo: 'shop-menu',
                    customizations: customizations
                }
                setLastRequestJson(payload)
                res = await fetch('/api/app/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            if (res.ok) {
                setSelectedProduct(null)
                setEditingItemId(null)
                fetchCart() // Refresh cart
            } else {
                const error = await res.json()
                alert('Cart Error: ' + JSON.stringify(error))
            }
        } catch (err) {
            console.error('Save error:', err)
        }
    }

    const removeFromCart = async (itemId: string | number) => {
        try {
            const res = await fetch(`/api/app/cart?itemId=${itemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })
            if (res.ok) {
                fetchCart()
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    if (loading && products.length === 0) {
        return <div className={styles.testerContainer}>Loading App Tester...</div>
    }

    return (
        <div className={styles.testerContainer}>
            {/* 📱 Mock App Device */}
            <div className={styles.appFrame}>
                <div className={styles.header}>
                    <div>
                        <h2>White Mantis App</h2>
                        <select
                            value={selectedShopId}
                            onChange={(e) => setSelectedShopId(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: 'var(--font-size-xs)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id} style={{ background: 'var(--color-surface-dark)' }}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.badge}>{cart.length}</div>
                </div>

                <div className={styles.content}>
                    <h3 className="mb-md">Explore Menu</h3>
                    {products.map(product => (
                        <div key={product.id} className={styles.productCard} onClick={() => handleProductClick(product)}>
                            <div className={styles.productInfo}>
                                <img
                                    src={product.image?.url || '/api/media/file/White-Mantis-White-Logo.svg'}
                                    className={styles.productImage}
                                    alt={product.name}
                                />
                                <div className={styles.details}>
                                    <h3>{product.name}</h3>
                                    <p className="text-lighter text-xs mb-xs">{product.tagline}</p>
                                    <div className={styles.priceTag}>
                                        {product.salePrice ? (
                                            <>
                                                <span className={styles.oldPrice}>AED {product.price}</span>
                                                <span>AED {product.salePrice}</span>
                                            </>
                                        ) : (
                                            <span>AED {product.price}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Customization Modal */}
                {selectedProduct && (
                    <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2 className="mb-lg">{selectedProduct.name}</h2>

                            {selectedProduct.customizations?.[0]?.sections?.map((section: any) => (
                                <div key={section.id} className={styles.section}>
                                    <div className={styles.sectionTitle}>{section.title}</div>
                                    <div className={styles.optionGrid}>
                                        {section.options?.map((opt: any) => (
                                            <div
                                                key={opt.id}
                                                className={`${styles.optionItem} ${currentSelections.some(s => s.sectionTitle === section.title && s.label === opt.label) ? styles.active : ''}`}
                                                onClick={() => toggleOption(section.title, opt)}
                                            >
                                                <span>{opt.label}</span>
                                                <span className="text-xs">+AED {opt.price}</span>
                                            </div>
                                        ))}
                                        {/* Support for groups if they exist */}
                                        {section.groups?.map((group: any) => (
                                            <div key={group.id} className="mt-sm">
                                                <div className="text-xs text-lighter mb-xs">{group.groupTitle}</div>
                                                {group.options?.map((opt: any) => {
                                                    const fullLabel = `${group.groupTitle} - ${opt.label}`
                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`${styles.optionItem} ${currentSelections.some(s => s.sectionTitle === section.title && s.label === fullLabel) ? styles.active : ''} mb-xs`}
                                                            onClick={() => toggleOption(section.title, { label: fullLabel, price: opt.price })}
                                                        >
                                                            <span>{opt.label}</span>
                                                            <span className="text-xs">+AED {opt.price}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button className={styles.addButton} onClick={handleSave}>
                                {editingItemId ? 'Update Item' : 'Add to Cart'} - AED {
                                    (selectedProduct.salePrice || selectedProduct.price) +
                                    currentSelections.reduce((acc, s) => acc + s.price, 0)
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🛒 Cart Inspector */}
            <div className={styles.cartSidebar}>
                <h2 className="mb-lg">Cart Inspector (Snapshot)</h2>
                <div className="flex-1 overflow-auto">
                    {cart.length === 0 && <p className="text-center text-lighter mt-xl">Your cart is empty.</p>}
                    {cart.map(item => (
                        <div key={item.id} className={styles.cartItem}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-primary font-bold">AED {item.price}</div>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {item.customizations?.length > 0 && (
                                <div className={styles.snapshotList}>
                                    {item.customizations.map((c: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{c.sectionTitle}: {c.label}</span>
                                            <span>+AED {c.price}</span>
                                        </div>
                                    ))}
                                    <div className="mt-sm pt-xs border-top" style={{ borderTop: '1px solid #333', fontWeight: 'bold' }}>
                                        Total: AED {item.price + item.customizations.reduce((sum: number, c: any) => sum + (c.price || 0), 0)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {lastRequestJson && (
                    <div className={styles.jsonViewer}>
                        <div>LAST REQUEST BODY:</div>
                        <pre>{JSON.stringify(lastRequestJson, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}
