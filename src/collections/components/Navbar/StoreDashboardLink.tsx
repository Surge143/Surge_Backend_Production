import React from 'react'
import Link from 'next/link'

export const StoreDashboardLink: React.FC = () => {
  return (
    <div className="nav__link">
      <Link href="/admin/store-dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="nav__link-label">📦 Store Dashboard</span>
      </Link>
    </div>
  )
}
