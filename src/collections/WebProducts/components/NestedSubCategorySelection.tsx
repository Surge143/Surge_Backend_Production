'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
    useField,
    FieldLabel,
    CheckboxInput,
    Collapsible,
} from '@payloadcms/ui'
import { CheckboxField } from 'payload'

// Type definitions based on WebSubCategories schema
interface Level3 {
    name: string
    slug: string
    id: string
}

interface Level2 {
    name: string
    slug: string
    id: string
    level3?: Level3[]
}

interface Level1 {
    name: string
    slug: string
    id: string
    level2?: Level2[]
}

interface WebSubCategory {
    id: string
    parentCategory: string | { id: string; title: string }
    level1?: Level1[]
    title: string
}

export const NestedSubCategorySelection: React.FC<{ path: string }> = ({ path }) => {
    // Get the categories selected in the parent field to filter sub-categories
    const { value: rawCategoryIds } = useField<string | string[]>({ path: 'categories' })
    const { value: selectedSubCategories, setValue: setSelectedSubCategories } = useField<any[]>({ path })

    // Normalize to array handle both hasMany: true and hasMany: false
    const selectedCategoryIds = useMemo(() => {
        if (!rawCategoryIds) return []
        return Array.isArray(rawCategoryIds) ? rawCategoryIds : [rawCategoryIds]
    }, [rawCategoryIds])

    const [subCategories, setSubCategories] = useState<WebSubCategory[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchSubCategories = async () => {
            setLoading(true)
            try {
                // Fetch all sub-categories (we'll filter them locally based on selectedCategoryIds)
                const res = await fetch('/api/web-sub-categories?limit=0&depth=1')
                const data = await res.json()
                setSubCategories(data.docs)
            } catch (error) {
                console.error('Error fetching sub-categories:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubCategories()
    }, [])

    // Filter sub-categories based on selected parent categories
    const relevantSubCategories = useMemo(() => {
        if (selectedCategoryIds.length === 0) return []

        return subCategories.filter(sub => {
            const parentId = typeof sub.parentCategory === 'object' ? sub.parentCategory.id : sub.parentCategory
            return selectedCategoryIds.includes(parentId)
        })
    }, [subCategories, selectedCategoryIds])

    const handleToggle = (categoryId: string, level1Id: string, level2Id?: string, level3Id?: string) => {
        const current = Array.isArray(selectedSubCategories) ? [...selectedSubCategories] : []

        const selection = {
            subCategoryId: categoryId,
            level1Id,
            level2Id,
            level3Id
        }

        const index = current.findIndex(item =>
            item.subCategoryId === categoryId &&
            item.level1Id === level1Id &&
            item.level2Id === level2Id &&
            item.level3Id === level3Id
        )

        if (index > -1) {
            current.splice(index, 1)
        } else {
            current.push(selection)
        }

        setSelectedSubCategories(current)
    }

    const isChecked = (categoryId: string, level1Id: string, level2Id?: string, level3Id?: string) => {
        if (!Array.isArray(selectedSubCategories)) return false
        return selectedSubCategories.some(item =>
            item.subCategoryId === categoryId &&
            item.level1Id === level1Id &&
            item.level2Id === level2Id &&
            item.level3Id === level3Id
        )
    }

    if (loading) return <div>Loading sub-categories...</div>

    if (relevantSubCategories.length === 0) {
        return (
            <div style={{ padding: '1rem', border: '1px dashed var(--theme-elevation-200)', borderRadius: '4px', opacity: 0.6 }}>
                Please select at least one Product Category to see relevant sub-categories.
            </div>
        )
    }

    return (
        <div className="nested-sub-categories" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '600', fontSize: '18px', marginBottom: '10px' }}>
                <FieldLabel label="Select Nested Sub Categories" />
            </span>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '8px',
                background: 'var(--theme-elevation-50)',
                marginTop: '10px'
            }}>
                {relevantSubCategories.map(sub => (
                    <Collapsible
                        key={sub.id}
                        header={<span style={{ fontWeight: '600' }}>Select The Sub Categories</span>}
                        initCollapsed={false}
                    >
                        <div style={{ padding: '1rem 0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {sub.level1?.map(l1 => (
                                <div key={l1.id} className="level-1">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CheckboxInput
                                            checked={isChecked(sub.id, l1.id)}
                                            onToggle={() => handleToggle(sub.id, l1.id)}
                                            id={`check-${l1.id}`}
                                        />
                                        <label htmlFor={`check-${l1.id}`} style={{ cursor: 'pointer', fontWeight: '500' }}>{l1.name}</label>
                                    </div>

                                    {l1.level2 && l1.level2.length > 0 && (
                                        <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {l1.level2.map(l2 => (
                                                <div key={l2.id} className="level-2">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <CheckboxInput
                                                            checked={isChecked(sub.id, l1.id, l2.id)}
                                                            onToggle={() => handleToggle(sub.id, l1.id, l2.id)}
                                                            id={`check-${l2.id}`}
                                                        />
                                                        <label htmlFor={`check-${l2.id}`} style={{ cursor: 'pointer' }}>{l2.name}</label>
                                                    </div>

                                                    {l2.level3 && l2.level3.length > 0 && (
                                                        <div style={{ marginLeft: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                            {l2.level3.map(l3 => (
                                                                <div key={l3.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <CheckboxInput
                                                                        checked={isChecked(sub.id, l1.id, l2.id, l3.id)}
                                                                        onToggle={() => handleToggle(sub.id, l1.id, l2.id, l3.id)}
                                                                        id={`check-${l3.id}`}
                                                                    />
                                                                    <label htmlFor={`check-${l3.id}`} style={{ cursor: 'pointer', fontSize: '0.9rem' }}>{l3.name}</label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Collapsible>
                ))}
            </div>
        </div>
    )
}
