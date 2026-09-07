import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  console.log('Received login request for:', email)

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email and password are required' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })

    const user = await payload.login({
      collection: 'admins',
      data: {
        email,
        password,
      },
    })

    const allowedRoles = ['shop-manager', 'admin', 'super-admin']
    if (!user.user || !allowedRoles.includes(user.user.role as string)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only shop managers and admins can login here.' },
        { status: 403 },
      )
    }

    const res = NextResponse.json({ success: true, user: user.user })

    if (user.token) {
      res.cookies.set('payload_token', user.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
      })
    }

    return res

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 },
    )
  }
}
