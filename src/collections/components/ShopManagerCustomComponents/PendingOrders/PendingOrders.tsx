import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { AdminViewProps } from 'payload'
import React from 'react'
import { OrderListClient } from './components/OrderListClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const pendingOrders: React.FC<AdminViewProps> = async ({
    initPageResult,
    params,
    searchParams
}) => {
    const { permissions, locale, req, visibleEntities } = initPageResult

    const { docs: initialOrders } = await req.payload.find({
        collection: 'app-orders',
        where: {
            orderAcceptance: { equals: 'pending' },
        },
        depth: 2,
    })

    let allAdmins: any[] = []
    let fetchError: string | null = null

    try {
        const adminResult = await req.payload.find({
            collection: 'admins',
            limit: 100,
            overrideAccess: true,
            showHiddenFields: true,
            depth: 0,
        })

        allAdmins = adminResult.docs || []

        console.log('DEBUG: All Admins Found:', allAdmins.length)
        console.log('DEBUG: Roles present:', [...new Set(allAdmins.map(a => a.role))])
    } catch (err: any) {
        console.error('CRITICAL: Admin fetch failed:', err)
        fetchError = err.message || 'Unknown error'
    }

    const baristas = allAdmins.filter(a => a.role === 'barista')
    const totalAdminsFound = allAdmins.length

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
                    <OrderListClient
                        initialOrders={initialOrders}
                        baristas={baristas}
                    />
                </div>
            </Gutter>
        </DefaultTemplate>
    )
}

export default pendingOrders