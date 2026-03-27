import { DefaultTemplate } from '@payloadcms/next/templates'
import { AdminViewProps } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'
import { ShopManagerDashboardClient } from './ShopManagerDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const ShopManagerDashboard: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { permissions, locale, req, visibleEntities } = initPageResult
  const currentUser = req.user as any

  // Only super-admin, admin, and shop-manager are allowed
  if (!['super-admin', 'admin', 'shop-manager'].includes(currentUser?.role)) {
    redirect('/admin')
  }

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

  const shopId = shopDoc?.id ? String(shopDoc.id) : null

  // Build shared query
  const shopWhere = shopId ? [{ shop: { equals: shopId } }] : []

  // Today's date range
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Fetch today's live orders (pending + accepted/active)
  const { docs: liveOrders } = await req.payload.find({
    collection: 'app-orders',
    where: {
      and: [
        {
          or: [
            { orderAcceptance: { equals: 'pending' } },
            {
              and: [
                { orderAcceptance: { equals: 'accepted' } },
                // Exclude orders held in the "scheduled for later" hidden state
                { scheduledForPrep: { not_equals: true } },
                {
                  or: [
                    { appOrderStatus: { in: ['pending', 'preparing', 'ready'] } },
                    { appOrderStatusDine: { in: ['pending', 'preparing', 'ready'] } },
                  ],
                },
              ],
            },
          ],
        },
        { paymentStatus: { equals: 'paid' } },
        { createdAt: { greater_than_equal: todayStart.toISOString() } },
        ...shopWhere,
      ],
    },
    depth: 3,
    limit: 200,
    sort: '-createdAt',
  })

  // Fetch today's cancelled/rejected orders
  const { docs: cancelledOrders } = await req.payload.find({
    collection: 'app-orders',
    where: {
      and: [
        {
          or: [
            { orderAcceptance: { equals: 'rejected' } },
            { appOrderStatus: { equals: 'cancelled' } },
            { appOrderStatusDine: { equals: 'cancelled' } },
          ],
        },
        { paymentStatus: { in: ['paid', 'refund-initiated', 'refunded', 'failed'] } },
        { createdAt: { greater_than: todayStart.toISOString() } },
        ...shopWhere,
      ],
    },
    depth: 3,
    limit: 100,
    sort: '-updatedAt',
  })

  // Fetch slots
  const { docs: slots } = await req.payload.find({
    collection: 'slots',
    ...(shopId ? { where: { shop: { equals: shopId } } } : {}),
    limit: 50,
    sort: 'slot',
  })

  // Fetch baristas for the current shop only
  const { docs: baristas } = await req.payload.find({
    collection: 'admins',
    where: {
      and: [
        { role: { equals: 'barista' } },
        ...(shopId ? [{ shop: { equals: shopId } }] : []),
      ],
    },
    limit: 50,
    overrideAccess: true,
    depth: 0,
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
      <ShopManagerDashboardClient
        initialOrders={liveOrders as any}
        initialCancelled={cancelledOrders as any}
        initialSlots={slots as any}
        initialBaristas={baristas as any}
        shopDoc={shopDoc as any}
        isAdmin={isAdmin}
        allShops={allShops as any}
      />
    </DefaultTemplate>
  )
}

export default ShopManagerDashboard
