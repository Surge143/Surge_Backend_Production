'use client'
import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'

export const ShopManagerDashboardLink: React.FC = () => {
  const { user } = useAuth()
  const role = (user as any)?.role
  const isAdminOrSuperAdmin = ['admin', 'super-admin'].includes(role)
  const canSeeCafeDashboard = ['super-admin', 'admin', 'shop-manager'].includes(role)

  const links = [
    ...(canSeeCafeDashboard ? [{ href: '/admin/shop-manager-dashboard', label: 'Cafe Dashboard' }] : []),
    ...(isAdminOrSuperAdmin ? [{ href: '/admin/store-dashboard', label: 'Store Dashboard' }] : []),
  ]

  const [isOpen, setIsOpen] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  return (
    <>
      <button
        className={`nav-group__toggle${isOpen ? ' nav-group__toggle--open' : ''}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="nav-group__label">Dashboards</div>
        <div className="nav-group__indicator">
          <svg
            className="icon icon--chevron nav-group__indicator"
            height="100%"
            viewBox="0 0 20 20"
            width="100%"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path className="stroke" d="M14 8L10 12L6 8" strokeLinecap="square"></path>
          </svg>
        </div>
      </button>
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          height: isOpen ? (contentRef.current?.scrollHeight ?? 'auto') : 0,
          transition: 'height 0.2s ease',
        }}
      >
        {links.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <div key={href}>
              <Link
                className={`nav__link${isActive ? ' nav__link--active' : ''}`}
                href={href}
                style={{ fontWeight: isActive ? 600 : undefined }}
              >
                <span className="nav__link-label">{label}</span>
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
