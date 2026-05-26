'use client'
import Link from 'next/link'

export const MenuListHint = () => (
  <p
    style={{
      margin: '0 0 12px',
      color: 'var(--theme-elevation-400)',
      fontSize: '13px',
    }}
  >
    Create products in{' '}
    <Link href="/admin/collections/menu" style={{ color: 'var(--theme-text)', fontWeight: 600 }}>
      Menu Builder
    </Link>{' '}
    first, then add them to your shop here.
  </p>
)
