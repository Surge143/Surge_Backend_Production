import React from 'react'
import Link from 'next/link'

export const BaristaDashboardLink: React.FC = () => {
    return (
        <div className="nav__link">
            <Link
                href="/admin/barista-dashboard"
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <span className="nav__link-label">Barista Dashboard</span>
            </Link>
        </div>
    )
}
