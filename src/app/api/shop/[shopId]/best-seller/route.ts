import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params
        const payload = await getPayload({ config })

        const numericShopId = parseInt(shopId, 10)
        if (isNaN(numericShopId)) {
            return NextResponse.json({ error: 'Invalid shopId' }, { status: 400 })
        }

        const result = await payload.find({
            collection: 'app-best-seller',
            where: { shop: { equals: numericShopId } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })

        if (result.docs.length === 0) {
            return NextResponse.json({ shopId: numericShopId, productIds: [] })
        }

        const doc = result.docs[0]

        // products is stored as an array of relationship objects or IDs at depth:0
        // Extract just the IDs
        const productIds = (doc.products || []).map((p: any) => {
            if (typeof p === 'object' && p !== null) {
                // polymorphic relationship: { relationTo, value }
                return p.value ?? p.id ?? p
            }
            return p
        })

        return NextResponse.json({
            shopId: numericShopId,
            productIds,
        })
    } catch (error: any) {
        console.error('[best-seller] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
