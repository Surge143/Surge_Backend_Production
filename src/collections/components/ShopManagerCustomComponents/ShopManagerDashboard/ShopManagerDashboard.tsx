import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { AdminViewProps } from 'payload'
import React from 'react'
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

  // Determine this manager's shop
  let shopDoc: any = null
  if (currentUser?.role === 'shop-manager') {
    const shopResult = await req.payload.find({
      collection: 'shop',
      where: { shopManager: { equals: currentUser.id } },
      limit: 1,
      depth: 0,
    })
    shopDoc = shopResult.docs[0] || null
  } else {
    // Super-admin or admin — pick first shop
    const shopResult = await req.payload.find({
      collection: 'shop',
      limit: 1,
      depth: 0,
    })
    shopDoc = shopResult.docs[0] || null
  }

  const shopId = shopDoc?.id ? String(shopDoc.id) : null

  // Build shared query
  const shopWhere = shopId ? [{ shop: { equals: shopId } }] : []

  // Fetch live orders (pending + accepted/active)
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
        ...shopWhere,
      ],
    },
    depth: 3,
    limit: 200,
    sort: '-createdAt',
  })

  // Fetch today's cancelled/rejected orders
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
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
        { paymentStatus: { equals: 'paid' } },
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

  // Fetch baristas
  const { docs: baristas } = await req.payload.find({
    collection: 'admins',
    where: { role: { equals: 'barista' } },
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
      <Gutter>
        <ShopManagerDashboardClient
          initialOrders={liveOrders as any}
          initialCancelled={cancelledOrders as any}
          initialSlots={slots as any}
          initialBaristas={baristas as any}
          shopDoc={shopDoc as any}
        />
      </Gutter>
    </DefaultTemplate>
  )
}

export default ShopManagerDashboard
