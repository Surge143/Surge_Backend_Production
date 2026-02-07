import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { AdminViewProps } from 'payload'
import React from 'react'
import { AcceptedOrdersClient } from './components/AcceptedOrdersClient'

export const OrdersDashboard: React.FC<AdminViewProps> = async ({
    initPageResult,
    params,
    searchParams
}) => {
    const { permissions, locale, req, visibleEntities } = initPageResult
    const currentUser = req.user

    const query: any = {
        orderAcceptance: { equals: 'accepted' },
    }

    if (currentUser && currentUser.role === 'barista') {
        query.barista = { equals: currentUser.id }
    }

    // Fetch orders with status 'accepted'
    const { docs: initialOrders } = await req.payload.find({
        collection: 'app-orders',
        where: query,
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
                        Accepted Orders - Barista Dashboard
                    </h1>

                    <AcceptedOrdersClient
                        initialOrders={initialOrders}
                        currentUser={currentUser ? { id: currentUser.id, role: currentUser.role } : null}
                    />
                </div>
            </Gutter>
        </DefaultTemplate>
    )
}

export default OrdersDashboard
