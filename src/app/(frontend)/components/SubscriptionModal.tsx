'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Product, ProductVariant, SubscriptionFrequency } from '../types/product'
import styles from './SubscriptionModal.module.css'

interface SubscriptionModalProps {
    product: Product
    isOpen: boolean
    onClose: () => void
    quantity?: number
}

export default function SubscriptionModal({ product, isOpen, onClose, quantity = 1 }: SubscriptionModalProps) {
    const router = useRouter()
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [selectedFrequency, setSelectedFrequency] = useState<SubscriptionFrequency | null>(null)

    // Get available subscription frequencies
    const getAvailableFrequencies = useCallback((): SubscriptionFrequency[] => {
        if (!product) return []
        console.log(product)
        if (product.hasVariantOptions && selectedVariant) {
            return selectedVariant.subFreq || []
        }
        return product.subFreq || []
    }, [product, selectedVariant])

    // Initialize selected variant and frequency when modal opens
    useEffect(() => {
        if (isOpen && product) {
            // First initialize variant if needed
            if (product.hasVariantOptions && product.variants?.length > 0 && !selectedVariant) {
                setSelectedVariant(product.variants[0])
            }

            // Then initialize frequency based on current selection
            const frequencies = getAvailableFrequencies()
            if (frequencies.length > 0 && !selectedFrequency) {
                setSelectedFrequency(frequencies[0])
            }
        }
    }, [isOpen, selectedVariant, product, getAvailableFrequencies, selectedFrequency])


    // Get current price
    const getCurrentPrice = (): number => {
        if (!product) return 0
        if (product.hasVariantOptions && selectedVariant) {
            return selectedVariant.variantSalePrice || selectedVariant.variantRegularPrice
        }
        return product.salePrice || product.regularPrice || 0
    }

    // Get current image
    const getCurrentImage = (): string => {
        if (!product) return '/placeholder.jpg'
        if (product.hasVariantOptions && selectedVariant) {
            const variantImage = selectedVariant.variantImage
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

    // Calculate discounted price
    const calculateDiscountedPrice = (frequency: SubscriptionFrequency): number => {
        const basePrice = getCurrentPrice()
        const discount = selectedVariant?.subscriptionDiscount || product.subscriptionDiscount || 0
        return basePrice - (basePrice * discount / 100)
    }

    // Handle subscription
    const handleSubscribe = () => {
        if (!selectedFrequency) {
            return
        }

        const params = new URLSearchParams({
            productId: product.id.toString(),
            quantity: quantity.toString(),
            frequencyId: selectedFrequency.id,
        })

        if (selectedVariant) {
            params.append('variantId', selectedVariant.id)
        }

        const url = `/checkout-subscription?${params.toString()}`
        router.push(url)
        onClose()
    }

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isOpen) return null

    const frequencies = getAvailableFrequencies()
    const hasSubscription = frequencies.length > 0

    return (
        <div className={styles.modal} onClick={handleOverlayClick}>
            <div className={styles.overlay} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>Subscribe & Save</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Product Info */}
                    <div className={styles.productInfo}>
                        <div className={styles.productImage}>
                            <Image
                                src={getCurrentImage()}
                                alt={product.name}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div className={styles.productDetails}>
                            <h3>{product.name}</h3>
                            <p>{product.tagline}</p>
                            <div className={styles.price}>
                                AED {getCurrentPrice().toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {hasSubscription ? (
                        <>
                            {/* Variant Selection */}
                            {product.hasVariantOptions && product.variants.length > 0 && (
                                <div className={styles.section}>
                                    <h4>Select Size</h4>
                                    <div className={styles.variantOptions}>
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                className={`${styles.variantOption} ${selectedVariant?.id === variant.id ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setSelectedVariant(variant)
                                                    setSelectedFrequency(null)
                                                }}
                                            >
                                                {variant.variantName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Frequency Selection */}
                            <div className={styles.section}>
                                <h4>Delivery Frequency</h4>
                                <div className={styles.frequencyOptions}>
                                    {frequencies.map((frequency) => {
                                        const discountedPrice = calculateDiscountedPrice(frequency)
                                        const savings = getCurrentPrice() - discountedPrice

                                        return (
                                            <div
                                                key={frequency.id}
                                                className={`${styles.frequencyOption} ${selectedFrequency?.id === frequency.id ? styles.selected : ''}`}
                                                onClick={() => setSelectedFrequency(frequency)}
                                            >
                                                <div className={styles.frequencyInfo}>
                                                    <div className={styles.frequencyLabel}>
                                                        Every {frequency.duration} {frequency.interval}
                                                        {frequency.duration > 1 ? 's' : ''}
                                                    </div>
                                                    <div className={styles.frequencyDiscount}>
                                                        Save {selectedVariant?.subscriptionDiscount || product.subscriptionDiscount || 0}% (AED {savings.toFixed(2)})
                                                    </div>
                                                </div>
                                                <div className={styles.frequencyPrice}>
                                                    AED {discountedPrice.toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noSubscription}>
                            <p>No subscription options available for this product.</p>
                        </div>
                    )}
                </div>

                {hasSubscription && (
                    <div className={styles.footer}>
                        <button
                            className={`btn btn-primary ${styles.subscribeBtn}`}
                            onClick={handleSubscribe}
                            disabled={!selectedFrequency}
                        >
                            Subscribe Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
