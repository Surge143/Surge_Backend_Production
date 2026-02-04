import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        const allowedOrigins = [
            'http://localhost:8100',
            'http://localhost:5173',
            process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
        ].filter(Boolean)

        const origin = request.headers.get('origin') || ''
        const isAllowedOrigin = allowedOrigins.includes(origin)

        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/api/:path*',
}
