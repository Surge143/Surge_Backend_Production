'use client'

import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import SubscriptionModal from '../components/SubscriptionModal'
import { Product } from '../types/product'
import styles from './products.module.css'
import { useCart } from '../components/CartContext'

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { addItem } = useCart()
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/web-products?limit=100`, {
                    cache: 'no-store',
                })
                if (!res.ok) throw new Error('Failed to fetch products')
                const data = await res.json()
                setProducts(data.docs || [])
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const handleAddToCart = (product: Product) => {
        const variant = product.hasVariantOptions ? product.variants?.[0] : undefined
        const price = variant
            ? (variant.variantSalePrice || variant.variantRegularPrice || 0)
            : (product.salePrice || product.regularPrice || 0)
        addItem({
            product: product.id.toString(),
            vId: variant?.id,
            quantity: 1,
            name: product.name,
            price,
            image: (product.productImage as any)?.url || '',
            variantName: variant?.variantName || '',
        })
    }

    const handleSubscribeClick = (product: Product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedProduct(null)
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className="container">
                    <div className={styles.loading}>Loading our premium collection...</div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className="container">
                <div className={styles.header}>
                    <h1 className={styles.title}>Our Collection</h1>
                    <p className={styles.subtitle}>Explore the world&apos;s finest coffee beans, roasted to perfection.</p>
                </div>

                <div className={styles.productList}>
                    {products.length > 0 ? (
                        <div className="grid grid-4">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={() => handleAddToCart(product)}
                                    onSubscribe={() => handleSubscribeClick(product)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noProducts}>
                            <h3>No products found</h3>
                            <p>Check back soon for new arrivals!</p>
                        </div>
                    )}
                </div>

                {selectedProduct && (
                    <SubscriptionModal
                        product={selectedProduct}
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    )
}
