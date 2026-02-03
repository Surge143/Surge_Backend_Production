'use client'
import { Button, Modal, SelectInput, TextInput, useAuth, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import styles from './CouponPicker.module.css'
import { CouponItem, CouponPickerGrid } from './CouponPickerGrid'

const modalSlug = 'quick-create-shop-coupon-modal'

export const ShopCouponQuickCreate: React.FC = () => {
    const { openModal, closeModal } = useModal()
    const { user } = useAuth()
    const router = useRouter()

    const [selectedItems, setSelectedItems] = useState<Array<{ couponId: string; discountType: string; discountAmount: number; isPubliclyVisible: boolean }>>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [name, setName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [selectedShop, setSelectedShop] = useState<string>('')

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await fetch('/api/shop?limit=1000')
                const data = await res.json()
                if (data.docs) {
                    setShops(data.docs)
                    if (user?.role === 'shop-manager') {
                        const myShop = data.docs.find((s: any) =>
                            (typeof s.shopManager === 'object' ? s.shopManager.id : s.shopManager) === user.id
                        )
                        if (myShop) setSelectedShop(myShop.id)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch shops:', err)
            }
        }
        fetchShops()
    }, [user])

    const toggleItem = (coupon: CouponItem) => {
        const next = [...selectedItems]
        const index = next.findIndex(item => item.couponId === coupon.id)

        if (index > -1) {
            next.splice(index, 1)
        } else {
            // Only store minimal data - the server hook will populate the rest
            next.push({
                couponId: coupon.id,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                isPubliclyVisible: coupon.isPubliclyVisible !== undefined ? coupon.isPubliclyVisible : true
            })
        }
        setSelectedItems(next)
    }

    const handleCreate = async () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one coupon.')
            return
        }

        if (!selectedShop) {
            alert('Please select a shop first.')
            return
        }

        setIsCreating(true)

        try {
            // 1. Fetch full coupon data for all selected items
            const couponIds = selectedItems.map((item, i) => item.couponId || i)
            const couponDataPromises = couponIds.map(id =>
                fetch(`/api/coupon/${id}`).then(res => res.json())
            )
            const fullCoupons = await Promise.all(couponDataPromises)

            // 2. Map through each selected coupon to create individual POST requests
            const creationPromises = fullCoupons.map(async (couponData: any) => {
                const coupon = couponData // API returns the coupon object directly
                const payload = {
                    // Link to the specific shop
                    shop: selectedShop,
                    couponRelation: [coupon.id], // Use the coupon ID and wrap in array for hasMany relationship
                    // Copy all data fields from the 'Coupon' to 'Shop Coupon'
                    code: coupon.code,
                    status: 'active', // You can keep it 'active' by default
                    couponFor: coupon.couponFor,
                    isPubliclyVisible: coupon.isPubliclyVisible !== undefined ? coupon.isPubliclyVisible : true,
                    applicability: coupon.applicability,

                    // Handle relationship arrays (extracting IDs if they are objects)
                    products: coupon.products?.map((p: any) => (typeof p === 'object' ? p.id : p)),

                    discountType: coupon.discountType,
                    discountAmount: coupon.discountAmount,
                    expiryDate: coupon.expiryDate,
                    minimumAmount: coupon.minimumAmount,
                    usageLimit: coupon.usageLimit,
                    usageLimitPerUser: coupon.usageLimitPerUser,
                    usageCount: 0, // Reset usage for the new shop-specific record
                }

                return fetch('/api/shop-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            })

            // 2. Execute all requests in parallel
            const results = await Promise.all(creationPromises)

            // 3. Execute all requests in parallel and check if all succeeded
            const failedRequests = results.filter(res => !res.ok)

            if (failedRequests.length === 0) {
                closeModal(modalSlug)
                // Redirect to the list view so the user can see the new separate rows
                router.push(`/admin/collections/shop-coupon`)
                router.refresh()
            } else {
                alert(`Failed to create ${failedRequests.length} coupons. Check console for details.`)
            }
        } catch (err) {
            console.error('Error during batch coupon creation:', err)
            alert('An unexpected error occurred.')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className={styles.quickCreateContainer} style={{ marginBottom: '1rem' }}>
            <Button
                buttonStyle="primary"
                className="shop-menu-quick-create-btn" // Reusing class for CSS hiding logic
                onClick={() => openModal(modalSlug)}
                type="button"
            >
                + Select Coupons & Create
            </Button>

            <Modal slug={modalSlug} className={styles.productPickerModal}>
                <div className={styles.modalContainer}>
                    <div className={styles.modalHeader}>
                        <h2>Select Coupons for Shop</h2>
                        {user?.role !== 'shop-manager' && (
                            <div className={styles.shopSelectWrapper} style={{ width: '250px' }}>
                                <SelectInput
                                    path="shopSelect"
                                    name="shopSelect"
                                    label="Select Shop"
                                    options={shops.map(s => ({ label: s.title || s.name, value: s.id }))}
                                    value={selectedShop}
                                    onChange={(val: any) => setSelectedShop(val)}
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
                            <Button buttonStyle="secondary" onClick={() => closeModal(modalSlug)} type="button">Cancel</Button>
                            <Button
                                buttonStyle="primary"
                                onClick={handleCreate}
                                type="button"
                                disabled={isCreating || selectedItems.length === 0}
                            >
                                {isCreating ? 'Creating...' : 'Create Shop Coupons'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.modalContent}>
                        <CouponPickerGrid
                            selectedItems={selectedItems}
                            onToggle={toggleItem}
                            searchTerm={searchTerm}
                            shopId={selectedShop}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

