'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
    useField,
    FieldLabel,
    ReactSelect,
    useForm,
    useDocumentInfo,
} from '@payloadcms/ui'
import { useParams } from 'next/navigation'

interface Product {
    id: string
    name: string
    categories: string | { id: string; name: string }
}

export const RecommendedProductsField: React.FC<{ path: string }> = ({ path }) => {
    const params = useParams();
    const { id: infoId } = useDocumentInfo();
    const docId = infoId || (Array.isArray(params?.segments) ? params.segments[params.segments.length - 1] : params?.id);

    const { value: categoryId } = useField<string | { id: string }>({ path: 'categories' })
    const {
        value: selectedProductIds,
        setValue: setSelectedProductIds
    } = useField<string[]>({ path })

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
                const filteredProducts = data.docs.filter((p: Product) => {
                    const isSelf = String(p.id).trim() === String(docId).trim()
                    return !isSelf
                })
                setProducts(filteredProducts)
            } catch (error) {
                console.error('Error fetching recommended products:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [normalizedCategoryId, docId])

    const options = useMemo(() => {
        return products
            .filter(product => String(product.id).trim() !== String(docId).trim())
            .map(product => ({
                label: product.name,
                value: product.id
            }))
    }, [products, docId])

    const selectedOptions = useMemo(() => {
        if (!Array.isArray(selectedProductIds)) return []
        return options.filter(opt => selectedProductIds.includes(opt.value))
    }, [options, selectedProductIds])

    const handleChange = (selected: any) => {
        if (!selected) {
            setSelectedProductIds([])
            return
        }

        const newValues = Array.isArray(selected) ? selected.map((s: any) => s.value) : [selected.value]

        if (newValues.length > 3) {
            // This case should ideally be handled by the UI (disabling more selections)
            // but we keep it here as a safety measure.
            return
        }

        setSelectedProductIds(newValues)
    }

    const isLimitReached = Array.isArray(selectedProductIds) && selectedProductIds.length >= 3

    const filteredOptions = useMemo(() => {
        if (isLimitReached) {
            // Only show already selected options so no new ones can be added
            return options.filter(opt => selectedProductIds.includes(opt.value))
        }
        return options
    }, [options, isLimitReached, selectedProductIds])

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
            <ReactSelect
                isMulti
                options={filteredOptions}
                value={selectedOptions}
                onChange={handleChange}
                noOptionsMessage={() => isLimitReached ? "Maximum 3 products selected" : "No products found"}
                placeholder={isLimitReached ? "Maximum 3 products selected" : "Select up to 3 products..."}
            />
            {Array.isArray(selectedProductIds) && selectedProductIds.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                    Selected: {selectedProductIds.length} / 3
                </div>
            )}
        </div>
    )
}
