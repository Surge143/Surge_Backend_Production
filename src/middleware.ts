import { NextRequest, NextResponse } from 'next/server'

/**
 * All origins permitted to make credentialed (cookie-carrying) cross-origin
 * requests to this API.  Must stay in sync with payload.config.ts `cors` array.
 */
const ALLOWED_ORIGINS = [
    'http://localhost:3000',       // Web frontend (dev)
    'http://localhost:8100',       // Ionic / Capacitor dev server
    'https://localhost',           // Capacitor iOS/Android (prod)
    'capacitor://localhost',       // Capacitor native scheme (prod)
    process.env.PAYLOAD_PUBLIC_SERVER_URL,  // Production frontend URL
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL,
].filter(Boolean) as string[]

const CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
}

export function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') ?? ''
    const isAllowed = ALLOWED_ORIGINS.includes(origin)

    // ── Preflight (OPTIONS) ──────────────────────────────────────────────────
    if (req.method === 'OPTIONS') {
        const res = new NextResponse(null, { status: 204 })
        if (isAllowed) {
            res.headers.set('Access-Control-Allow-Origin', origin)
        }
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
        return res
    }

    // ── Normal request ───────────────────────────────────────────────────────
    const res = NextResponse.next()
    if (isAllowed) {
        res.headers.set('Access-Control-Allow-Origin', origin)
    }
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
}

export const config = {
    // Run on all /api/* routes only – keeps the middleware lightweight
    matcher: '/api/:path*',
}
