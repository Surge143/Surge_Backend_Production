import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOptions } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions())

  if (!session?.payloadToken) {
    return NextResponse.redirect(new URL('/login?error=apple_auth_failed', req.url))
  }

  const res = NextResponse.redirect(new URL('/profile', req.url))
  res.cookies.set('payload-token', session.payloadToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return res
}
