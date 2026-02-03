'use client'
import { CheckboxInput } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import styles from './CouponPicker.module.css'

export interface CouponItem {
    id: string
    code: string
    status: string
    couponFor?: {
        website?: boolean
        app?: boolean
    }
    applicability: 'all' | 'products'
    products?: any[]
    discountType: string
    discountAmount: number
    expiryDate: string
    minimumAmount: number
    usageLimit?: number
    usageLimitPerUser: number
    usageCount: number
    isPubliclyVisible: boolean
}

interface CouponPickerGridProps {
    selectedItems: any[]
    onToggle: (coupon: CouponItem) => void
    searchTerm: string
    excludedIds?: string[]
    shopId?: string // Add shopId to fetch existing shop-coupons
}

export const CouponPickerGrid: React.FC<CouponPickerGridProps> = ({
    selectedItems,
    onToggle,
    searchTerm,
    excludedIds = [],
    shopId
}) => {
    const [coupons, setCoupons] = useState<CouponItem[]>([])
    const [loading, setLoading] = useState(true)
    const [alreadyAddedCouponIds, setAlreadyAddedCouponIds] = useState<string[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch existing shop-coupons for this shop to exclude already-added coupons
                if (shopId) {
                    const shopCouponsRes = await fetch(`/api/shop-coupon?limit=1000&where[shop][equals]=${shopId}&depth=1`)
                    const shopCouponsData = await shopCouponsRes.json()

                    if (shopCouponsData.docs) {
                        // Extract coupon IDs from the couponRelation field
                        const existingCouponIds: string[] = []
                        shopCouponsData.docs.forEach((shopCoupon: any) => {
                            if (Array.isArray(shopCoupon.couponRelation)) {
                                shopCoupon.couponRelation.forEach((coupon: any) => {
                                    const couponId = typeof coupon === 'object' ? coupon.id : coupon
                                    if (couponId) existingCouponIds.push(couponId)
                                })
                            }
                        })
                        setAlreadyAddedCouponIds(existingCouponIds)
                    }
                }

                // Fetch coupons that have 'app: true' in 'couponFor' group
                const res = await fetch('/api/coupon?limit=1000&where[couponFor.app][equals]=true')
                const data = await res.json()
                if (data.docs) {
                    setCoupons(data.docs)
                }
            } catch (err) {
                console.error('Failed to fetch coupons:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [shopId])

    const filteredCoupons = coupons.filter(c => {
        // Exclude coupons that are already added to this shop
        if (alreadyAddedCouponIds.includes(c.id)) return false
        // Exclude coupons from the excludedIds prop
        if (excludedIds.includes(c.id)) return false
        // Filter by search term
        return c.code.toLowerCase().includes(searchTerm.toLowerCase())
    })

    if (loading) return <div className={styles.loader}>Loading coupons...</div>

    return (
        <div className={styles.productTableWrapper}>
            <table className={styles.productPickerTable}>
                <thead>
                    <tr>
                        <th className={styles.colSelect}>Select</th>
                        <th className={styles.colName}>Coupon Code</th>
                        <th className={styles.colType}>Type</th>
                        <th className={styles.colAmount}>Discount</th>
                        <th className={styles.colExpiry}>Expiry</th>
                        <th className={styles.colStatus}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCoupons.map((coupon) => {
                        const isSelected = selectedItems.some(i => i.couponId === coupon.id)
                        return (
                            <tr key={coupon.id} className={isSelected ? styles.selected : ''}>
                                <td className={styles.colSelect} onClick={() => onToggle(coupon)}>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <CheckboxInput checked={isSelected} onToggle={() => onToggle(coupon)} />
                                    </div>
                                </td>
                                <td className={styles.colName} onClick={() => onToggle(coupon)}>
                                    <span className={styles.productName}>{coupon.code}</span>
                                </td>
                                <td className={styles.colType} onClick={() => onToggle(coupon)}>
                                    {coupon.discountType}
                                </td>
                                <td className={styles.colAmount} onClick={() => onToggle(coupon)}>
                                    {coupon.discountAmount}
                                </td>
                                <td className={styles.colExpiry} onClick={() => onToggle(coupon)}>
                                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className={styles.colStatus} onClick={() => onToggle(coupon)}>
                                    {coupon.status}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {filteredCoupons.length === 0 && !loading && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
                    {alreadyAddedCouponIds.length > 0
                        ? 'All available coupons have already been added to this shop.'
                        : 'No app-supported coupons found.'}
                </div>
            )}
        </div>
    )
}
