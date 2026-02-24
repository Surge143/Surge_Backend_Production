'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const SectionRowLabel = () => {
    const { data, rowNumber } = useRowLabel<any>()

    // Try to find a descriptive title
    // 1. Explicit title/label/groupTitle
    // 2. Template relationship name (if populated)
    // 3. Template relationship ID (if not populated)
    const title = data?.title || data?.groupTitle || data?.label ||
        (typeof data?.template === 'object' ? data?.template?.title : data?.template)

    const row = (rowNumber ?? 0) + 1

    return (
        <span style={{ fontWeight: '500' }}>
            {title || `Section ${String(row).padStart(2, '0')}`}
        </span>
    )
}
