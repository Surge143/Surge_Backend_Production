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
    shopId?: string
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
    const [error, setError] = useState<string | null>(null)
    const [alreadyAddedCouponIds, setAlreadyAddedCouponIds] = useState<string[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                // Fetch existing shop-coupons for this shop to exclude already-added coupons
                if (shopId) {
                    const shopCouponsRes = await fetch(
                        `/api/shop-coupon?limit=1000&where[shop][equals]=${shopId}&depth=1`
                    )
                    if (!shopCouponsRes.ok) throw new Error('Failed to fetch existing shop coupons')
                    const shopCouponsData = await shopCouponsRes.json()

                    if (shopCouponsData.docs) {
                        const existingCouponIds: string[] = []
                        shopCouponsData.docs.forEach((shopCoupon: any) => {
                            if (Array.isArray(shopCoupon.couponRelation)) {
                                shopCoupon.couponRelation.forEach((coupon: any) => {
                                    const couponId = typeof coupon === 'object' ? coupon.id : coupon
                                    if (couponId) existingCouponIds.push(String(couponId))
                                })
                            }
                        })
                        setAlreadyAddedCouponIds(existingCouponIds)
                    }
                } else {
                    setAlreadyAddedCouponIds([])
                }

                // Fetch active, published coupons that apply to the app.
                // draft=false ensures only published docs are returned (Versions/Drafts is enabled on Coupon).
                const res = await fetch(
                    '/api/coupon?limit=1000&where[couponFor.app][equals]=true&where[status][equals]=active&draft=false'
                )
                if (!res.ok) throw new Error('Failed to fetch coupons')
                const data = await res.json()
                if (data.docs) {
                    setCoupons(data.docs)
                }
            } catch (err: any) {
                console.error('Failed to fetch coupons:', err)
                setError(err?.message || 'Failed to load coupons. Please try again.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [shopId])

    const filteredCoupons = coupons.filter(c => {
        if (alreadyAddedCouponIds.includes(String(c.id))) return false
        if (excludedIds.includes(String(c.id))) return false
        return c.code.toLowerCase().includes(searchTerm.toLowerCase())
    })

    if (loading) return <div className={styles.loader}>Loading coupons...</div>

    if (error) return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-error-500)', fontWeight: 600 }}>
            ⚠️ {error}
        </div>
    )

    const availableCoupons = coupons.filter(c =>
        !alreadyAddedCouponIds.includes(String(c.id)) && !excludedIds.includes(String(c.id))
    )

    const emptyMessage = (() => {
        if (coupons.length === 0) return 'No active app-supported coupons found.'
        if (availableCoupons.length === 0) return 'All available coupons have already been added to this shop.'
        if (filteredCoupons.length === 0) return `No coupons match "${searchTerm}".`
        return null
    })()

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
                        const isSelected = selectedItems.some(i => String(i.couponId) === String(coupon.id))
                        const discountLabel = coupon.discountType === 'percentage'
                            ? `${coupon.discountAmount}%`
                            : `AED ${coupon.discountAmount}`
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
                                    {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                                </td>
                                <td className={styles.colAmount} onClick={() => onToggle(coupon)}>
                                    {discountLabel}
                                </td>
                                <td className={styles.colExpiry} onClick={() => onToggle(coupon)}>
                                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className={styles.colStatus} onClick={() => onToggle(coupon)}>
                                    <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        background: coupon.status === 'active' ? 'var(--theme-success-100)' : 'var(--theme-elevation-100)',
                                        color: coupon.status === 'active' ? 'var(--theme-success-500)' : 'var(--theme-elevation-500)',
                                    }}>
                                        {coupon.status}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {emptyMessage && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
                    {emptyMessage}
                </div>
            )}
        </div>
    )
}
