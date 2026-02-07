import Link from 'next/link'
import Image from 'next/image'
import { Product } from '../types/product'
import styles from './ProductCard.module.css'

interface ProductCardProps {
    product: Product
    onAddToCart?: () => void
    onAddToWishlist?: () => void
    onSubscribe?: () => void
}

export default function ProductCard({
    product,
    onAddToCart,
    onAddToWishlist,
    onSubscribe,
}: ProductCardProps) {
    // Get display values from product or first variant
    const getDisplayImage = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            const variantImage = product.variants[0].variantImage
            // Handle both object and string types
            if (typeof variantImage === 'object' && variantImage !== null) {
                return variantImage.url || '/placeholder.jpg'
            }
            return '/placeholder.jpg'
        }
        const productImage = product.productImage
        if (typeof productImage === 'object' && productImage !== null) {
            return productImage.url || '/placeholder.jpg'
        }
        return '/placeholder.jpg'
    }

    const getDisplayPrice = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            const variant = product.variants[0]
            return variant.variantSalePrice || variant.variantRegularPrice
        }
        return product.salePrice || product.regularPrice || 0
    }

    const getOriginalPrice = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            const variant = product.variants[0]
            return variant.variantSalePrice ? variant.variantRegularPrice : null
        }
        return product.salePrice ? product.regularPrice : null
    }

    const getInStock = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            return product.variants[0].variantInStock
        }
        return product.inStock
    }

    const hasSubscription = () => {
        if (product.hasVariantOptions && product.variants && product.variants.length > 0) {
            return product.variants.some(v => v.hasVariantSub && v.subFreq && v.subFreq.length > 0)
        }
        return product.hasSimpleSub && product.subFreq && product.subFreq.length > 0
    }

    const displayPrice = getDisplayPrice()
    const originalPrice = getOriginalPrice()
    const hasDiscount = originalPrice !== null && originalPrice > displayPrice
    const discountPercent = hasDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0
    const inStock = getInStock()
    const showSubscription = hasSubscription()

    // Debug logging
    console.log('Product:', product.name, {
        hasVariantOptions: product.hasVariantOptions,
        variantsCount: product.variants?.length || 0,
        firstVariant: product.variants?.[0],
        displayImage: getDisplayImage(),
        showSubscription
    })

    return (
        <div className={styles.card}>
            <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
                <Image
                    src={getDisplayImage()}
                    alt={product.name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {hasDiscount && (
                    <span className={styles.discountBadge}>-{discountPercent}%</span>
                )}
                {showSubscription && (
                    <span className={styles.subscriptionBadge}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Subscribe
                    </span>
                )}
                {!inStock && (
                    <span className={styles.outOfStock}>Out of Stock</span>
                )}
            </Link>

            <div className={styles.content}>
                <Link href={`/products/${product.slug}`} className={styles.title}>
                    <h3>{product.name}</h3>
                    <p className={styles.tagline}>{product.tagline}</p>
                </Link>

                <div className={styles.priceRow}>
                    <div className={styles.prices}>
                        <span className={styles.currentPrice}>AED {displayPrice.toFixed(2)}</span>
                        {hasDiscount && originalPrice && (
                            <span className={styles.originalPrice}>AED {originalPrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <div className={styles.actionRow}>
                        <button
                            className={`btn btn-primary ${styles.addToCart}`}
                            onClick={onAddToCart}
                            disabled={!inStock}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            Add to Cart
                        </button>
                        <button
                            className={styles.wishlistBtn}
                            onClick={onAddToWishlist}
                            title="Add to Wishlist"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                    </div>
                    {showSubscription && (
                        <button
                            className={`btn ${styles.subscribeBtn}`}
                            onClick={onSubscribe}
                            disabled={!inStock}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Subscribe & Save
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

