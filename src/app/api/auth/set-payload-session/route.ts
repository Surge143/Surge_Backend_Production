import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/auth'

/**
 * Bridge route: called as the NextAuth callbackUrl after Apple sign-in.
 * Reads the Payload token stored in the NextAuth session by the jwt callback,
 * sets it as the `payload-token` cookie (so the existing UserContext / Payload
 * endpoints work as normal), then redirects the user to /profile.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.payloadToken) {
    return NextResponse.redirect(new URL('/login?error=apple_auth_failed', req.url))
  }

  const res = NextResponse.redirect(new URL('/profile', req.url))

  res.cookies.set('payload-token', session.payloadToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return res
}
