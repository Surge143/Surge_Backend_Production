import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { AdminViewProps } from 'payload'
import React from 'react'
import { OrderListClient } from './components/OrderListClient'

export const pendingOrders: React.FC<AdminViewProps> = async ({
    initPageResult,
    params,
    searchParams
}) => {
    const { permissions, locale, req, visibleEntities } = initPageResult

    // Fetch orders with status 'pending'
    const { docs: initialOrders } = await req.payload.find({
        collection: 'app-orders',
        where: {
            orderAcceptance: { equals: 'pending' },
        },
        depth: 2,
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
                <div style={{ marginTop: 'var(--gutter-v)' }}>
                    <h1 className="list-header__title" style={{ marginBottom: '2rem' }}>
                        Incoming Cafe Orders
                    </h1>

                    <OrderListClient initialOrders={initialOrders} />
                </div>
            </Gutter>
        </DefaultTemplate>
    )
}

export default pendingOrders