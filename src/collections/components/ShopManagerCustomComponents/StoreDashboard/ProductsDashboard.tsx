import { DefaultTemplate } from '@payloadcms/next/templates'
import { AdminViewProps } from 'payload'
import React from 'react'
import { StoreProductsClient } from './StoreProductsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const ProductsDashboard: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { permissions, locale, req, visibleEntities } = initPageResult

  const { docs: products } = await req.payload.find({
    collection: 'web-products',
    limit: 500,
    depth: 2,
    sort: 'name',
    draft: true,
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
      <StoreProductsClient initialProducts={products as any} />
    </DefaultTemplate>
  )
}

export default ProductsDashboard
