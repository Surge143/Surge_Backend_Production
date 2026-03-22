import { DefaultTemplate } from '@payloadcms/next/templates'
import { AdminViewProps } from 'payload'
import React from 'react'
import { StoreDashboardClient } from './StoreDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const StoreDashboard: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { permissions, locale, req, visibleEntities } = initPageResult
  const currentUser = req.user as any

  const isAdmin = currentUser?.role !== 'shop-manager'

  // Determine this manager's shop
  let shopDoc: any = null
  let allShops: any[] = []

  if (!isAdmin) {
    // Shop-manager: locked to their own shop
    const shopResult = await req.payload.find({
      collection: 'shop',
      where: { shopManager: { equals: currentUser.id } },
      limit: 1,
      depth: 0,
    })
    shopDoc = shopResult.docs[0] || null
  } else {
    // Admin/super-admin: fetch all shops for the picker
    const shopResult = await req.payload.find({
      collection: 'shop',
      limit: 100,
      depth: 0,
    })
    allShops = shopResult.docs
    shopDoc = shopResult.docs[0] || null
  }

  // Today's date range (for delivered/cancelled sections only)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Fetch ALL active (placed + shipped) orders with payment completed — no date cap
  const { docs: activeOrders } = await req.payload.find({
    collection: 'web-orders',
    where: {
      and: [
        { deliveryStatus: { in: ['placed', 'shipped'] } },
        { paymentStatus: { equals: 'completed' } },
      ],
    },
    depth: 2,
    limit: 500,
    sort: '-createdAt',
    overrideAccess: true,
  })

  // Fetch delivered orders for today
  const { docs: deliveredOrders } = await req.payload.find({
    collection: 'web-orders',
    where: {
      and: [
        { deliveryStatus: { equals: 'delivered' } },
        { paymentStatus: { equals: 'completed' } },
        { createdAt: { greater_than_equal: todayStart.toISOString() } },
      ],
    },
    depth: 2,
    limit: 100,
    sort: '-updatedAt',
    overrideAccess: true,
  })

  // Fetch cancelled/refunded orders for today
  const { docs: cancelledOrders } = await req.payload.find({
    collection: 'web-orders',
    where: {
      and: [
        { deliveryStatus: { in: ['cancelled', 'refund-initiated', 'refunded'] } },
        { createdAt: { greater_than_equal: todayStart.toISOString() } },
      ],
    },
    depth: 2,
    limit: 100,
    sort: '-updatedAt',
    overrideAccess: true,
  })

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <StoreDashboardClient
        initialOrders={activeOrders as any}
        initialDelivered={deliveredOrders as any}
        initialCancelled={cancelledOrders as any}
        shopDoc={shopDoc as any}
        isAdmin={isAdmin}
        allShops={allShops as any}
      />
    </DefaultTemplate>
  )
}

export default StoreDashboard
