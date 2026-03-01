'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
    useField,
    FieldLabel,
    CheckboxInput,
    useForm,
} from '@payloadcms/ui'

interface Product {
    id: string
    name: string
    categories: string | { id: string; name: string }
}

export const RecommendedProductsField: React.FC<{ path: string }> = ({ path }) => {
    // Get the categories selected in the doc to filter products
    const { value: categoryId } = useField<string | { id: string }>({ path: 'categories' })
    const {
        value: selectedProductIds,
        setValue: setSelectedProductIds
    } = useField<string[]>({ path })

    const { getData } = useForm();
    const docId = getData()?.id;

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)

    // Normalize categoryId handle both object or string
    const normalizedCategoryId = useMemo(() => {
        if (!categoryId) return null
        return typeof categoryId === 'object' ? categoryId.id : categoryId
    }, [categoryId])

    useEffect(() => {
        const fetchProducts = async () => {
            if (!normalizedCategoryId) {
                setProducts([])
                return
            }

            setLoading(true)
            try {
                // Fetch products that belong to the same category
                // We exclude the current product to avoid self-recommendation
                const query = `where[categories][equals]=${normalizedCategoryId}&limit=0`
                const res = await fetch(`/api/web-products?${query}`)
                const data = await res.json()

                // Filter out the current doc
                const filteredProducts = data.docs.filter((p: Product) => p.id !== docId)
                setProducts(filteredProducts)
            } catch (error) {
                console.error('Error fetching recommended products:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [normalizedCategoryId, docId])

    const handleToggle = (productId: string) => {
        const current = Array.isArray(selectedProductIds) ? [...selectedProductIds] : []
        const index = current.indexOf(productId)

        if (index > -1) {
            current.splice(index, 1)
        } else {
            if (current.length >= 3) {
                // Limit to three
                return
            }
            current.push(productId)
        }

        setSelectedProductIds(current)
    }

    const isChecked = (productId: string) => {
        if (!Array.isArray(selectedProductIds)) return false
        return selectedProductIds.includes(productId)
    }

    if (!normalizedCategoryId) {
        return (
            <div style={{ marginBottom: '20px' }}>
                <FieldLabel label="Recommended Products" />
                <div style={{
                    padding: '1rem',
                    border: '1px dashed var(--theme-elevation-200)',
                    borderRadius: '4px',
                    color: 'var(--theme-error-500)',
                    background: 'var(--theme-elevation-50)',
                    fontSize: '0.9rem'
                }}>
                    Please select a Category first to see relevant products for recommendation.
                </div>
            </div>
        )
    }

    if (loading) return <div style={{ marginBottom: '20px' }}>Loading products...</div>

    return (
        <div className="recommended-products-field" style={{ marginBottom: '20px' }}>
            <FieldLabel label="Recommended Products (Max 3)" />
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '8px',
                background: 'var(--theme-elevation-50)',
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto'
            }}>
                {products.length === 0 ? (
                    <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>No other products found in this category.</div>
                ) : (
                    products.map(product => (
                        <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckboxInput
                                checked={isChecked(product.id)}
                                onToggle={() => handleToggle(product.id)}
                                id={`rec-product-${product.id}`}
                            />
                            <label
                                htmlFor={`rec-product-${product.id}`}
                                style={{
                                    cursor: (Array.isArray(selectedProductIds) && selectedProductIds.length >= 3 && !isChecked(product.id)) ? 'not-allowed' : 'pointer',
                                    opacity: (Array.isArray(selectedProductIds) && selectedProductIds.length >= 3 && !isChecked(product.id)) ? 0.5 : 1
                                }}
                            >
                                {product.name}
                            </label>
                        </div>
                    ))
                )}
            </div>
            {Array.isArray(selectedProductIds) && selectedProductIds.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                    Selected: {selectedProductIds.length} / 3
                </div>
            )}
        </div>
    )
}
