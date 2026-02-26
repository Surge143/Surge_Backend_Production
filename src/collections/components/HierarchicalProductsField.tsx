'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { RelationshipField } from 'payload'

const HierarchicalProductsField: React.FC = () => {
    const { value: categoryFilter } = useField<string>({ path: 'categoryFilter' })
    const { value: selectedProducts, setValue: setSelectedProducts } = useField<string[]>({ path: 'selectedProducts' })

    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchProducts = async () => {
            if (!categoryFilter) {
                setProducts([])
                return
            }

            setLoading(true)
            try {
                // Step 1: Find the category and all its descendants
                const categoryRes = await fetch(`/api/web-sub-categories?where[breadcrumbs.id][equals]=${categoryFilter}&depth=0&limit=0`)
                const categoryData = await categoryRes.json()
                const categoryIds = categoryData.docs.map((d: any) => d.id)

                if (categoryIds.length === 0) {
                    setProducts([])
                    return
                }

                // Step 2: Fetch products assigned to these categories
                // Note: We use a simplified query for web-products where we check if it's in the subCategories array
                const productsRes = await fetch(`/api/web-products?where[subCategories][in]=${categoryIds.join(',')}&depth=0&limit=0`)
                const productsData = await productsRes.json()

                setProducts(productsData.docs)
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
        // Clear selection when filter changes (safer)
        setSelectedProducts([])
    }, [categoryFilter, setSelectedProducts])

    const toggleProduct = (productId: string) => {
        const current = selectedProducts || []
        if (current.includes(productId)) {
            setSelectedProducts(current.filter(id => id !== productId))
        } else {
            setSelectedProducts([...current, productId])
        }
    }

    if (!categoryFilter) {
        return <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>Please select a sub-category to view products.</div>
    }

    if (loading) {
        return <div>Loading products...</div>
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <label className="field-label" style={{ marginBottom: '10px', display: 'block' }}>Select Products</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', border: '1px solid #ccc', padding: '15px', borderRadius: '4px' }}>
                {products.length === 0 ? (
                    <div>No products found in this category branch.</div>
                ) : (
                    products.map(product => (
                        <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={(selectedProducts || []).includes(product.id)}
                                onChange={() => toggleProduct(product.id)}
                            />
                            <label htmlFor={`product-${product.id}`} style={{ cursor: 'pointer' }}>{product.name}</label>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default HierarchicalProductsField
