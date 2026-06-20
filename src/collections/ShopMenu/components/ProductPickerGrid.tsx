'use client'
import { CheckboxInput, TextInput } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import styles from './ProductPicker.module.css'

export interface ShopMenuItem {
    id?: string
    productId?: string
    originalPrice?: string | number
    salePrice?: string | number
    stockCount?: string | number
    inStock?: boolean
    selected?: boolean
}

export interface MenuItem {
    id: string
    name: string
    regularPrice: number
    salePrice: number
    image?: any
    tagline?: string
    description?: string
    dietaryType?: string
    customizations?: any
    category: {
        id: string
        title: string
    }
    subCategories: Array<{
        id: string
        title: string
    }>
}

interface ProductPickerGridProps {
    selectedItems: ShopMenuItem[]
    onToggle: (product: MenuItem) => void
    onUpdate: (productId: string, updates: Partial<ShopMenuItem>) => void
    searchTerm: string
    setSearchTerm: (val: string) => void
    excludedIds?: string[]
    shopId?: string
}

export const ProductPickerGrid: React.FC<ProductPickerGridProps> = ({
    selectedItems,
    onToggle,
    onUpdate,
    searchTerm,
    setSearchTerm,
    excludedIds = [],
    shopId
}) => {
    const [products, setProducts] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [alreadyAddedIds, setAlreadyAddedIds] = useState<string[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // 1. Fetch products
                const response = await fetch('/api/menu?limit=1000')
                const data = await response.json()
                if (data && Array.isArray(data.docs)) {
                    setProducts(data.docs)
                }

                // 2. Fetch existing shop-menu items for this shop to exclude already-added items
                if (shopId) {
                    const shopMenuRes = await fetch(`/api/shop-menu?limit=1000&where[shop][equals]=${shopId}&depth=0`)
                    const shopMenuData = await shopMenuRes.json()

                    if (shopMenuData.docs) {
                        const existingIds: string[] = []
                        shopMenuData.docs.forEach((item: any) => {
                            if (Array.isArray(item.menuRelation)) {
                                item.menuRelation.forEach((rel: any) => {
                                    const id = typeof rel === 'object' ? rel.id : rel
                                    if (id) existingIds.push(id)
                                })
                            }
                        })
                        setAlreadyAddedIds(existingIds)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [shopId])

    const filteredProducts = products.filter(p => {
        // Exclude products that are already added to this shop
        if (alreadyAddedIds.includes(p.id)) return false
        // Exclude products from the excludedIds prop
        if (excludedIds.includes(p.id)) return false

        const term = searchTerm.toLowerCase()
        const nameMatch = (p.name || '').toLowerCase().includes(term)
        const categoryMatch = (typeof p.category === 'object' && p.category?.title || '').toLowerCase().includes(term)
        const subCategoryMatch = Array.isArray(p.subCategories) && p.subCategories.filter(Boolean).some(s => (s.title || '').toLowerCase().includes(term))
        return nameMatch || categoryMatch || subCategoryMatch
    })

    if (loading) {
        return <div className={styles.loader}>Loading menu items...</div>
    }

    return (
        <div className={styles.productTableWrapper}>
            <table className={styles.productPickerTable}>
                <thead>
                    <tr>
                        <th className={styles.colSelect}>Select</th>
                        <th className={styles.colName}>Product Name</th>
                        <th className={styles.colCategory}>Category</th>
                        <th className={styles.colSubcategories}>Sub Categories</th>
                        <th className={styles.colPrice}>Reg. Price</th>
                        <th className={styles.colSale}>Sale Price</th>
                        <th className={styles.colStock}>Stock Qty</th>
                        <th className={styles.colStatus}>In Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(product => {
                        const selectedData = selectedItems.find(item => item.id === product.id)
                        const isSelected = !!selectedData

                        return (
                            <tr key={product.id} className={isSelected ? styles.selected : ''}>
                                <td className={styles.colSelect} onClick={() => onToggle(product)}>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <CheckboxInput checked={isSelected} onToggle={() => onToggle(product)} />
                                    </div>
                                </td>
                                <td className={styles.colName} onClick={() => onToggle(product)}>
                                    <span className={styles.productName}>{product.name}</span>
                                </td>
                               <td className={styles.colCategory}>
    {product.category && typeof product.category === 'object' ? product.category.title : ''}
</td>
                              <td className={styles.colSubcategories}>
    {Array.isArray(product.subCategories) ? product.subCategories.filter(Boolean).map(s => s.title).join(', ') : ''}
</td>
                                <td className={styles.colPrice}>
                                    <TextInput
                                        path={`originalPrice_${product.id}`}
                                        value={selectedData?.originalPrice !== undefined ? String(selectedData.originalPrice) : String(product.regularPrice || '')}
                                        onChange={(e: any) => {
                                            const val = e.target.value;
                                            if (isSelected) {
                                                onUpdate(product.id, { originalPrice: val })
                                            }
                                        }}
                                        readOnly={!isSelected}
                                        required
                                    />
                                </td>
                                <td className={styles.colSale}>
                                    <TextInput
                                        path={`salePrice_${product.id}`}
                                        value={selectedData?.salePrice !== undefined ? String(selectedData.salePrice) : String(product.salePrice ?? product.regularPrice ?? '')}
                                        onChange={(e: any) => {
                                            const val = e.target.value;
                                            if (isSelected) {
                                                onUpdate(product.id, { salePrice: val })
                                            }
                                        }}
                                        readOnly={!isSelected}
                                        required
                                    />
                                </td>
                                <td className={styles.colStock}>
                                    <TextInput
                                        path={`stockCount_${product.id}`}
                                        value={selectedData?.stockCount !== undefined ? String(selectedData.stockCount) : ''}
                                        onChange={(e: any) => {
                                            const val = e.target.value;
                                            if (isSelected) {
                                                onUpdate(product.id, { stockCount: val })
                                            }
                                        }}
                                        readOnly={!isSelected || !(selectedData?.inStock)}
                                        required={selectedData?.inStock}
                                    />
                                </td>
                                <td className={styles.colStatus}>
                                    <CheckboxInput
                                        checked={selectedData?.inStock ?? false}
                                        onToggle={() => isSelected && onUpdate(product.id, { inStock: !selectedData?.inStock })}
                                        readOnly={!isSelected}
                                    />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
