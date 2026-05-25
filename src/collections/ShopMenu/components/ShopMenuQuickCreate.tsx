'use client'
import { Button, Modal, SelectInput, TextInput, useAuth, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import styles from './ProductPicker.module.css'
import { MenuItem, ProductPickerGrid, ShopMenuItem } from './ProductPickerGrid'

const modalSlug = 'quick-create-shop-menu-modal'

export const ShopMenuQuickCreate: React.FC = () => {
    const { openModal, closeModal } = useModal()
    const { user } = useAuth()
    const router = useRouter()

    const [selectedItems, setSelectedItems] = useState<ShopMenuItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [selectedShop, setSelectedShop] = useState<string>('')

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch all shops if admin, or find manager's shop
                const shopRes = await fetch('/api/shop?limit=1000')
                const shopData = await shopRes.json()
                if (shopData?.docs) {
                    setShops(shopData.docs)

                    if (user?.role === 'shop-manager') {
                        const myShop = shopData.docs.find((s: any) =>
                            (typeof s.shopManager === 'object' ? s.shopManager.id : s.shopManager) === user.id
                        )
                        if (myShop) setSelectedShop(myShop.id)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err)
            }
        }
        fetchData()
    }, [user])

    const toggleItem = (product: MenuItem) => {
        const next = [...selectedItems]
        const index = next.findIndex(item => (item.productId === product.id || item.id === product.id))

        if (index > -1) {
            next.splice(index, 1)
        } else {
            // Only store minimal data - the server hook (or update logic below) will populate the rest
            const regularPrice = product.regularPrice || 0;

            next.push({
                productId: product.id,
                id: product.id, // For the grid to identify selection
                originalPrice: regularPrice,
                salePrice: product.salePrice || regularPrice,
                selected: true,
                inStock: true,
                stockCount: 0
            })
        }
        setSelectedItems(next)
    }

    const updateSelectedItem = (productId: string, updates: Partial<ShopMenuItem>) => {
        setSelectedItems(prev => prev.map(item =>
            (item.productId === productId || item.id === productId) ? { ...item, ...updates } : item
        ))
    }

    const cleanForPost = (value: any, isArrayItem = false): any => {
        if (Array.isArray(value)) return value.map(item => cleanForPost(item, true))
        if (value && typeof value === 'object') {
            if (!isArrayItem && 'id' in value) {
                // Populated relationship object — collapse to its ID
                return value.id
            }
            // Array row — strip the row ID, recurse into field values
            const { id: _id, ...rest } = value
            return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, cleanForPost(v, false)]))
        }
        return value
    }

    const handleCreate = async () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one product.')
            return
        }

        if (!selectedShop) {
            alert('Please select a shop first.')
            return
        }

        setIsCreating(true)
        try {
            // 1. Fetch full menu data for all selected items
            const menuIds = selectedItems.map(item => item.productId || item.id)
            const menuDataPromises = menuIds.map(async (id) => {
                const res = await fetch(`/api/menu/${id}`)
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}))
                    throw new Error(`Failed to fetch menu item ${id}: ${errorData.errors?.[0]?.message || res.statusText}`)
                }
                return res.json()
            })
            const fullMenuItems = await Promise.all(menuDataPromises)

            // 2. Map through each selected item to create individual POST requests
            const creationPromises = fullMenuItems.map(async (globalItem: any) => {
                const selection = selectedItems.find(item => (item.productId === globalItem.id || item.id === globalItem.id))

                if (!globalItem.category) {
                    throw new Error(`Menu item "${globalItem.name}" is missing a category. Please edit the global menu item first.`)
                }

                const shopId = selectedShop ? (isNaN(Number(selectedShop)) ? selectedShop : Number(selectedShop)) : undefined;

                const payload = {
                    name: globalItem.name,
                    shop: shopId,
                    menuRelation: [globalItem.id],
                    tagline: globalItem.tagline,
                    slug: globalItem.slug,
                    image: globalItem.image ? (typeof globalItem.image === 'object' ? globalItem.image.id : globalItem.image) : undefined,
                    description: globalItem.description,
                    category: typeof globalItem.category === 'object' ? globalItem.category.id : globalItem.category,
                    subCategories: globalItem.subCategories?.map((s: any) => (typeof s === 'object' ? s.id : s)) || [],
                    regularPrice: parseFloat(String(selection?.originalPrice ?? globalItem.regularPrice)) || 0,
                    salePrice: parseFloat(String(selection?.salePrice ?? globalItem.salePrice)) || 0,
                    dietaryType: globalItem.dietaryType,
                    stockCount: parseInt(String(selection?.stockCount ?? 0)) || 0,
                    inStock: selection?.inStock ?? true,
                    customizations: (globalItem.customizations || []).map((c: any) => ({
                        title: c.title,
                        template: typeof c.template === 'object' && c.template !== null ? c.template.id : c.template,
                        sections: (c.sections || []).map((s: any) => ({
                            title: s.title,
                            selectionType: s.selectionType,
                            groups: (s.groups || []).map((g: any) => ({
                                groupTitle: g.groupTitle,
                                options: (g.options || []).map((o: any) => ({ label: o.label, price: o.price })),
                            })),
                            options: (s.options || []).map((o: any) => ({ label: o.label, price: o.price })),
                        })),
                    })),
                }

                const res = await fetch('/api/shop-menu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}))
                    throw new Error(`Failed to create shop menu item for "${globalItem.name}": ${errorData.errors?.[0]?.message || res.statusText}`)
                }

                return res.json()
            })

            await Promise.all(creationPromises)

            closeModal(modalSlug)
            router.push(`/admin/collections/shop-menu`)
            router.refresh()

        } catch (err: any) {
            console.error('Error during batch shop menu creation:', err)
            alert(err.message || 'An unexpected error occurred.')
        } finally {
            setIsCreating(false)
        }
    }

    // Shops visible to this user in the dropdown
    const myShops = user?.role === 'shop-manager'
        ? shops.filter(s => String(typeof s.shopManager === 'object' ? s.shopManager?.id : s.shopManager) === String(user.id))
        : shops
    const showShopDropdown = user?.role !== 'shop-manager' || myShops.length > 1

    return (
        <div className={styles.quickCreateContainer} style={{ marginBottom: '1rem' }}>
            <Button
                buttonStyle="primary"
                className="shop-menu-quick-create-btn"
                onClick={() => openModal(modalSlug)}
                type="button"
            >
                + Select Shop Products & Create Menu Items
            </Button>

            <Modal slug={modalSlug} className={styles.productPickerModal}>
                <div className={styles.modalContainer}>
                    <div className={styles.modalHeader}>
                        <h2>Select Products for Shop Menu</h2>
                        {showShopDropdown && (
                            <div className={styles.shopSelectWrapper} style={{ width: '250px' }}>
                                <SelectInput
                                    path="shopSelect"
                                    name="shopSelect"
                                    label="Select Shop"
                                    options={myShops.map(s => ({
                                        label: String(s.address?.street || s.address?.city || s.id),
                                        value: String(s.id),
                                    }))}
                                    value={selectedShop}
                                    onChange={(val: any) => {
                                        const newValue = typeof val === 'object' && val !== null ? val.value : val;
                                        setSelectedShop(newValue);
                                    }}
                                />
                            </div>
                        )}
                        <div className={styles.searchWrapper} style={{ flexGrow: 1, display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <TextInput
                                    path="searchTerm"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                    label="Search Products"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                buttonStyle="secondary"
                                onClick={() => closeModal(modalSlug)}
                                type="button"
                                disabled={isCreating}
                            >
                                Cancel
                            </Button>
                            <Button
                                buttonStyle="primary"
                                onClick={handleCreate}
                                type="button"
                                disabled={isCreating || selectedItems.length === 0}
                            >
                                {isCreating ? 'Creating...' : 'Create Shop Menu Items'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.modalContent}>
                        <ProductPickerGrid
                            selectedItems={selectedItems}
                            onToggle={toggleItem}
                            onUpdate={updateSelectedItem}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            shopId={selectedShop}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
