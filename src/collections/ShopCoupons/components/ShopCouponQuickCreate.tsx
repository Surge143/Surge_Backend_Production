'use client'
import { Button, Modal, SelectInput, TextInput, useAuth, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import styles from './CouponPicker.module.css'
import { CouponItem, CouponPickerGrid } from './CouponPickerGrid'

const modalSlug = 'quick-create-shop-coupon-modal'

type SelectedCoupon = {
    couponId: string
    discountType: string
    discountAmount: number
    isPubliclyVisible: boolean
}

export const ShopCouponQuickCreate: React.FC = () => {
    const { openModal, closeModal } = useModal()
    const { user } = useAuth()
    const router = useRouter()

    const [selectedItems, setSelectedItems] = useState<SelectedCoupon[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [selectedShop, setSelectedShop] = useState<string>('')
    const [createError, setCreateError] = useState<string | null>(null)

    // Fetch shops on mount
    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await fetch('/api/shop?limit=1000')
                const data = await res.json()
                if (data.docs) {
                    setShops(data.docs)
                    // Auto-select the shop for shop-managers
                    if (user?.role === 'shop-manager') {
                        const myShop = data.docs.find((s: any) =>
                            String(typeof s.shopManager === 'object' ? s.shopManager.id : s.shopManager) === String(user.id)
                        )
                        if (myShop) setSelectedShop(String(myShop.id))
                    }
                }
            } catch (err) {
                console.error('Failed to fetch shops:', err)
            }
        }
        fetchShops()
    }, [user])

    // Clear coupon selections whenever the shop changes
    useEffect(() => {
        setSelectedItems([])
        setSearchTerm('')
        setCreateError(null)
    }, [selectedShop])

    const toggleItem = (coupon: CouponItem) => {
        const next = [...selectedItems]
        const index = next.findIndex(item => String(item.couponId) === String(coupon.id))
        if (index > -1) {
            next.splice(index, 1)
        } else {
            next.push({
                couponId: String(coupon.id),
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                isPubliclyVisible: coupon.isPubliclyVisible !== undefined ? coupon.isPubliclyVisible : true,
            })
        }
        setSelectedItems(next)
    }

    const handleShopChange = (val: any) => {
        // SelectInput may return a string or { value: string } object
        const newValue = val !== null && typeof val === 'object' ? String(val.value ?? '') : String(val ?? '')
        setSelectedShop(newValue)
    }

    const resetModal = () => {
        setSelectedItems([])
        setSearchTerm('')
        setCreateError(null)
    }

    const handleClose = () => {
        resetModal()
        closeModal(modalSlug)
    }

    const handleCreate = async () => {
        if (selectedItems.length === 0) {
            setCreateError('Please select at least one coupon.')
            return
        }
        if (!selectedShop) {
            setCreateError('Please select a shop first.')
            return
        }

        setIsCreating(true)
        setCreateError(null)

        try {
            // Fetch full coupon data for all selected items
            const fullCoupons = await Promise.all(
                selectedItems.map(item =>
                    fetch(`/api/coupon/${item.couponId}?draft=false`).then(res => {
                        if (!res.ok) throw new Error(`Failed to fetch coupon ${item.couponId}`)
                        return res.json()
                    })
                )
            )

            // Normalise shop ID
            const shopId: string | number = isNaN(Number(selectedShop)) ? selectedShop : Number(selectedShop)

            // Create one shop-coupon per selected coupon
            const results = await Promise.all(
                fullCoupons.map(async (coupon: any) => {
                    const payload = {
                        shop: shopId,
                        // couponRelation links back to the source coupon
                        couponRelation: [typeof coupon.id === 'string' && !isNaN(Number(coupon.id)) ? Number(coupon.id) : coupon.id],
                        code: coupon.code,
                        status: 'active',
                        // Shop coupons are always app-only — override whatever the source has
                        couponFor: { website: false, app: true },
                        isPubliclyVisible: coupon.isPubliclyVisible !== undefined ? coupon.isPubliclyVisible : true,
                        applicability: coupon.applicability ?? 'all',
                        // Extract IDs from populated relationship arrays
                        products: Array.isArray(coupon.products)
                            ? coupon.products.map((p: any) => (typeof p === 'object' ? p.id : p))
                            : [],
                        discountType: coupon.discountType,
                        discountAmount: coupon.discountAmount,
                        expiryDate: coupon.expiryDate,
                        minimumAmount: coupon.minimumAmount ?? 0,
                        usageLimit: coupon.usageLimit ?? null,
                        usageLimitPerUser: coupon.usageLimitPerUser ?? 1,
                        usageCount: 0,
                    }

                    return fetch('/api/shop-coupon', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })
                })
            )

            const failed = results.filter(res => !res.ok)
            if (failed.length === 0) {
                resetModal()
                closeModal(modalSlug)
                router.push('/admin/collections/shop-coupon')
                router.refresh()
            } else {
                // Try to extract error messages from failed responses
                const errorBodies = await Promise.all(failed.map(r => r.json().catch(() => null)))
                const messages = errorBodies.map(b => b?.errors?.[0]?.message || b?.message || 'Unknown error').join('; ')
                setCreateError(`Failed to create ${failed.length} coupon(s): ${messages}`)
            }
        } catch (err: any) {
            console.error('Error during batch coupon creation:', err)
            setCreateError(err?.message || 'An unexpected error occurred.')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className={styles.quickCreateContainer} style={{ marginBottom: '1rem' }}>
            <Button
                buttonStyle="primary"
                onClick={() => { resetModal(); openModal(modalSlug) }}
                type="button"
            >
                + Select Coupons &amp; Create
            </Button>

            <Modal slug={modalSlug} className={styles.productPickerModal}>
                <div className={styles.modalContainer}>
                    <div className={styles.modalHeader}>
                        <h2>Select Coupons for Shop</h2>

                        {/* Shop selector — hidden for shop-managers since their shop is auto-selected */}
                        {user?.role !== 'shop-manager' && (
                            <div className={styles.shopSelectWrapper} style={{ width: '250px' }}>
                                <SelectInput
                                    path="shopSelect"
                                    name="shopSelect"
                                    label="Select Shop"
                                    options={shops.map(s => ({
                                        label: String(s.title || s.name || s.id),
                                        value: String(s.id),
                                    }))}
                                    value={selectedShop}
                                    onChange={handleShopChange}
                                />
                            </div>
                        )}

                        <div className={styles.searchWrapper} style={{ flexGrow: 1, display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <TextInput
                                    path="searchTerm"
                                    placeholder="Search coupons..."
                                    value={searchTerm}
                                    onChange={(e: any) => setSearchTerm(e.target.value)}
                                    label="Search Coupons"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button buttonStyle="secondary" onClick={handleClose} type="button">
                                Cancel
                            </Button>
                            <Button
                                buttonStyle="primary"
                                onClick={handleCreate}
                                type="button"
                                disabled={isCreating || selectedItems.length === 0 || !selectedShop}
                            >
                                {isCreating
                                    ? 'Creating...'
                                    : `Create${selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}`}
                            </Button>
                        </div>
                    </div>

                    {/* Inline error message */}
                    {createError && (
                        <div style={{
                            padding: '10px 40px',
                            background: 'var(--theme-error-100)',
                            color: 'var(--theme-error-500)',
                            borderBottom: '1px solid var(--theme-error-200)',
                            fontSize: '13px',
                            fontWeight: 500,
                        }}>
                            ⚠️ {createError}
                        </div>
                    )}

                    {/* Prompt user to select a shop before showing the grid */}
                    {!selectedShop ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
                            Please select a shop to see available coupons.
                        </div>
                    ) : (
                        <div className={styles.modalContent}>
                            <CouponPickerGrid
                                selectedItems={selectedItems}
                                onToggle={toggleItem}
                                searchTerm={searchTerm}
                                shopId={selectedShop}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}
