'use client'
import React, { useEffect, useState } from 'react'
import { StoreProductsClient } from '@/collections/components/ShopManagerCustomComponents/StoreDashboard/StoreProductsClient'

export const ProductsListView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/web-products?limit=500&depth=2&sort=_order&draft=true')
      .then((r) => r.json())
      .then(async (data) => {
        const docs: any[] = data.docs ?? []

        // ── Batch-resolve bare productImage IDs ─────────────────────────────
        // With draft=true, Payload sometimes skips populating relationship
        // fields and returns just a numeric ID even at depth=2. We collect
        // all such IDs, fetch them in ONE /api/media request, then swap
        // each number for the real { url, ... } media object.
        const unresolvedIds = [
          ...new Set(
            docs
              .map((p: any) => p.productImage)
              .filter((img: any): img is number => typeof img === 'number'),
          ),
        ]

        if (unresolvedIds.length > 0) {
          try {
            const mediaRes = await fetch(
              `/api/media?where[id][in]=${unresolvedIds.join(',')}&limit=${unresolvedIds.length}&depth=0`,
            )
            const mediaData = await mediaRes.json()
            const mediaMap: Record<number, any> = {}
            for (const m of mediaData.docs ?? []) {
              mediaMap[m.id] = m
            }
            for (const p of docs) {
              if (typeof p.productImage === 'number') {
                p.productImage = mediaMap[p.productImage] ?? null
              }
            }
          } catch {
            // Non-fatal — images simply won't show for this render
          }
        }
        // ────────────────────────────────────────────────────────────────────

        setProducts(docs)
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
