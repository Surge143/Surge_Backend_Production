'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useCart } from '../../components/CartContext'
import RichText from '../../components/RichText'
import SubscriptionModal from '../../components/SubscriptionModal'
import { Product, ProductVariant } from '../../types/product'
import styles from './product-details.module.css'

export default function ProductDetailsPage() {
    const { slug } = useParams()
    const router = useRouter()
    const { addItem } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/web-products?where[slug][equals]=${slug}&limit=1`, {
                    cache: 'no-store',
                })
                if (!res.ok) throw new Error('Failed to fetch product')
                const data = await res.json()
                if (data.docs && data.docs.length > 0) {
                    const fetchedProduct = data.docs[0]
                    setProduct(fetchedProduct)
                    if (fetchedProduct.hasVariantOptions && fetchedProduct.variants?.length > 0) {
                        setSelectedVariant(fetchedProduct.variants[0])
                    }
                } else {
                    router.push('/products')
                }
            } catch (error) {
                console.error('Error fetching product:', error)
                router.push('/products')
            } finally {
                setLoading(false)
            }
        }
        if (slug) fetchProduct()
    }, [slug, router])

    const handleAddToCart = () => {
        if (!product) return
        setAdding(true)

        addItem({
            product: product.id.toString(),
            vId: product.hasVariantOptions ? selectedVariant?.id : undefined,
            quantity: quantity,
        })

        setTimeout(() => setAdding(false), 500)
    }

    if (loading) return <div className={styles.loading}>Loading product details...</div>
    if (!product) return null

    const currentPrice = selectedVariant
        ? (selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice)
        : (product.salePrice || product.regularPrice || 0)

    const originalPrice = selectedVariant
        ? (selectedVariant.variantSalePrice ? selectedVariant.variantRegularPrice : null)
        : (product.salePrice ? product.regularPrice : null)

    const displayImage = selectedVariant && selectedVariant.variantImage
        ? selectedVariant.variantImage.url
        : (product.productImage ? product.productImage.url : '/placeholder.jpg')

    const hasSubscription = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            return product.variants.some(v => v.hasVariantSub && v.subFreq && v.subFreq.length > 0)
        }
        return product.hasSimpleSub && product.subFreq && product.subFreq.length > 0
    }

    const showSubscription = hasSubscription()

    return (
        <div className={styles.container}>
            <div className="container">
                <div className={styles.mainGrid}>
                    {/* Image Gallery */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImage}>
                            <Image src={displayImage} alt={product.name} fill style={{ objectFit: 'cover' }} priority />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className={styles.info}>
                        <div className={styles.categoryBadge}>
                            {product.categories?.[0]?.title}
                        </div>
                        <h1 className={styles.title}>{product.name}</h1>
                        <p className={styles.tagline}>{product.tagline}</p>

                        <div className={styles.priceSection}>
                            <span className={styles.currentPrice}>AED {currentPrice.toFixed(2)}</span>
                            {originalPrice && originalPrice > currentPrice && (
                                <span className={styles.originalPrice}>AED {originalPrice.toFixed(2)}</span>
                            )}
                        </div>

                        <div className={styles.divider}></div>

                        <RichText content={product.description} className={styles.description} />

                        {/* Variants */}
                        {product.hasVariantOptions && product.variants?.length > 0 && (
                            <div className={styles.variants}>
                                <label className={styles.label}>Select Option</label>
                                <div className={styles.variantList}>
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            className={`${styles.variantBtn} ${selectedVariant?.id === variant.id ? styles.variantBtnActive : ''}`}
                                            onClick={() => setSelectedVariant(variant)}
                                        >
                                            {variant.variantName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className={styles.quantitySection}>
                            <label className={styles.label}>Quantity</label>
                            <div className={styles.quantityControls}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={styles.qtyBtn}>−</button>
                                <span className={styles.qtyValue}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(5, quantity + 1))}
                                    className={styles.qtyBtn}
                                    disabled={quantity >= 5}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className={styles.actionButtons}>
                            <button
                                className={`btn btn-primary btn-lg ${styles.addToCart}`}
                                onClick={handleAddToCart}
                                disabled={adding}
                            >
                                {adding ? 'Adding...' : 'Add to Cart'}
                            </button>

                            {showSubscription && (
                                <div className={styles.subscribeSection}>
                                    <button
                                        className={styles.subscribeBtn}
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Subscribe & Save
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <SubscriptionModal
                        product={product}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        quantity={quantity}
                    />
                )}

                {/* Specs */}
                <div className={styles.specsGrid}>
                    <div className={styles.specBox}>
                        <span className={styles.specLabel}>Farm</span>
                        <span className={styles.specValue}>{product.farm}</span>
                    </div>
                    <div className={styles.specBox}>
                        <span className={styles.specLabel}>Variety</span>
                        <span className={styles.specValue}>{product.variety}</span>
                    </div>
                    <div className={styles.specBox}>
                        <span className={styles.specLabel}>Process</span>
                        <span className={styles.specValue}>{product.process}</span>
                    </div>
                    <div className={styles.specBox}>
                        <span className={styles.specLabel}>Roast</span>
                        <span className={styles.specValue}>{product.roast}</span>
                    </div>
                </div>

                {/* Farm Detail */}
                <div className={styles.farmSection}>
                    <h2 className={styles.sectionTitle}>About the Farm</h2>
                    <RichText content={product.farmDescription} className={styles.farmDescription} />
                </div>
            </div>
        </div>
    )
}
