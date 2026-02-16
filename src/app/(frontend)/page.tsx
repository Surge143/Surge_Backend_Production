'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from './components/ProductCard'
import SubscriptionModal from './components/SubscriptionModal'
import { Product } from './types/product'
import styles from './home.module.css'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/web-products?limit=8`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          setProducts([])
          return
        }
        const data = await res.json()
        setProducts(data.docs || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      }
    }
    fetchProducts()
  }, [])

  const handleSubscribeClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Premium Coffee
              <br />
              <span className={styles.heroAccent}>Delivered Fresh</span>
            </h1>
            <p className={styles.heroText}>
              Discover exceptional coffee from the world&apos;s finest farms, roasted to perfection and delivered to your door.
            </p>
            <div className={styles.heroActions}>
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop Now
              </Link>
              <Link href="/about" className="btn btn-outline btn-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.featured}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Featured Products</h2>
            <p>Handpicked selections from our premium collection</p>
          </div>

          <div className="grid grid-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSubscribe={() => handleSubscribeClick(product)}
              />
            ))}
          </div>

          <div className={styles.viewAll}>
            <Link href="/products" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className="grid grid-3">
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🚚</div>
              <h3>Free Delivery</h3>
              <p>On orders over AED 200</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>☕</div>
              <h3>Fresh Roasted</h3>
              <p>Roasted to order for maximum freshness</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🌍</div>
              <h3>Sustainably Sourced</h3>
              <p>Direct trade with ethical farmers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Modal */}
      {selectedProduct && (
        <SubscriptionModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
