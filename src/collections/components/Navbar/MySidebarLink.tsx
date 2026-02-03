import React from 'react'
import Link from 'next/link'

// This name must match the part after the '#' in your config
export const MySidebarLink: React.FC = () => {
    return (
        <div className="nav__link">
            <Link
                href="/admin/pending-orders"
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <span className="nav__link-label">Incoming Orders</span>
            </Link>
        </div>
    )
}