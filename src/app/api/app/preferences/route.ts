import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(req: NextRequest) {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        // Use req.headers directly — getNextHeaders() doesn't reliably
        // forward the Authorization header in API route handlers
        const { user } = await payload.auth({ headers: req.headers })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await payload.find({
            collection: 'user-preferences',
            where: { user: { equals: user.id } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })

        const preferences = result.docs[0] ?? null

        return NextResponse.json({
            userId: user.id,
            cafeProductPreferences: preferences?.cafeProductPreferences ?? [],
        })
    } catch (error: any) {
        console.error('[preferences] GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
