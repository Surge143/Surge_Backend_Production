import React from 'react'
import Link from 'next/link'

export const ShopManagerDashboardLink: React.FC = () => {
  return (
    <div className="nav__link">
      <Link
        href="/admin/shop-manager-dashboard"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <span className="nav__link-label">Cafe Dashboard</span>
      </Link>
    </div>
  )
}
