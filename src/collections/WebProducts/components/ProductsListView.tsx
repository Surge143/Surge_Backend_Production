'use client'
import React, { useEffect, useState } from 'react'
import { StoreProductsClient } from '@/collections/components/ShopManagerCustomComponents/StoreDashboard/StoreProductsClient'

export const ProductsListView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/web-products?limit=500&depth=2&sort=name&draft=true')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.docs ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '40vh', color: '#555', fontSize: 13,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        Loading products…
      </div>
    )
  }

  return <StoreProductsClient initialProducts={products} />
}

export default ProductsListView
