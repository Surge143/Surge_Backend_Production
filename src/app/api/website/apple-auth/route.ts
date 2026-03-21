import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utilities/getPayload'

const APPLE_ISSUER = 'https://appleid.apple.com'
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'

// Cache Apple's public keys for 1 hour to avoid repeated fetches
let cachedKeys: any[] = []
let keysCachedAt = 0
const KEYS_CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function getApplePublicKeys(): Promise<any[]> {
    const now = Date.now()
    if (cachedKeys.length > 0 && now - keysCachedAt < KEYS_CACHE_TTL) {
        return cachedKeys
    }
    const res = await fetch(APPLE_KEYS_URL)
    if (!res.ok) throw new Error('Failed to fetch Apple public keys')
    const { keys } = await res.json()
    cachedKeys = keys
    keysCachedAt = now
    return keys
}

async function verifyAppleToken(token: string): Promise<Record<string, any>> {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid Apple token format')

    const [headerB64, payloadB64, signatureB64] = parts

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
    const keys = await getApplePublicKeys()

    const jwk = keys.find((k: any) => k.kid === header.kid)
    if (!jwk) throw new Error('No matching Apple public key found for kid: ' + header.kid)

    // Import the RSA public key using Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
    )

    // Verify signature
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const signature = Buffer.from(signatureB64, 'base64url')

    const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature,
        signedData,
    )

    if (!isValid) throw new Error('Apple token signature verification failed')

    const applePayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))

    // Validate standard claims
    if (applePayload.iss !== APPLE_ISSUER) throw new Error('Invalid token issuer')
    if (applePayload.exp < Math.floor(Date.now() / 1000)) throw new Error('Apple token has expired')

    return applePayload
}

function isApplePrivateRelayEmail(email: string): boolean {
    return email.endsWith('@privaterelay.appleid.com')
}

export async function POST(req: NextRequest) {
    const timerLabel = `[AppleAuth-Website-${Date.now()}]`
    try {
        console.time(timerLabel)
        const payload = await getPayload()

        const body = await req.json()
        const { appleToken, firstName = '', lastName = '' } = body

        if (!appleToken) {
            console.timeEnd(timerLabel)
            return NextResponse.json({ error: 'Missing appleToken' }, { status: 400 })
        }

        try {
            console.time('[AppleAuth] Token Verification')
            const applePayload = await verifyAppleToken(appleToken)
            console.timeEnd('[AppleAuth] Token Verification')

            const appleSubId: string = applePayload.sub
            const email: string | undefined = applePayload.email
            const isPrivateEmail =
                applePayload.is_private_email === true ||
                applePayload.is_private_email === 'true' ||
                (email ? isApplePrivateRelayEmail(email) : false)

            if (!appleSubId) {
                return NextResponse.json({ error: 'Invalid Apple token: missing sub' }, { status: 400 })
            }

            if (!email) {
                return NextResponse.json({ error: 'Email scope not granted. Please allow email access.' }, { status: 400 })
            }

            console.time('[AppleAuth] DB Operations')

            let userDoc: any = null

            if (!isPrivateEmail) {
                // For real emails: search by email first
                const byEmail = await payload.find({
                    collection: 'users',
                    where: { email: { equals: email } },
                    limit: 1,
                })
                userDoc = byEmail.docs[0] || null
            }

            // If not found by email (or private email), search by appleSubId
            if (!userDoc) {
                const bySubId = await payload.find({
                    collection: 'users',
                    where: { appleSubId: { equals: appleSubId } },
                    limit: 1,
                })
                userDoc = bySubId.docs[0] || null
            }

            const isNewUser = !userDoc
            const randomPassword = Math.random().toString(36).slice(-10)

            if (isNewUser) {
                userDoc = await payload.create({
                    collection: 'users',
                    data: {
                        email,
                        firstName: firstName || '',
                        lastName: lastName || '',
                        role: 'customer',
                        password: randomPassword,
                        appleSubId,
                        isApplePrivateEmail: isPrivateEmail,
                    } as any,
                })
            } else {
                // Update password for login; also set appleSubId if not already stored
                const updateData: Record<string, any> = { password: randomPassword }
                if (!userDoc.appleSubId) {
                    updateData.appleSubId = appleSubId
                    updateData.isApplePrivateEmail = isPrivateEmail
                }
                userDoc = await payload.update({
                    collection: 'users',
                    id: userDoc.id,
                    data: updateData as any,
                })
            }

            // Log the user in using the email stored in the doc (handles private relay emails)
            const loginResult = await payload.login({
                collection: 'users',
                data: {
                    email: userDoc.email,
                    password: randomPassword,
                },
                req,
            })
            console.timeEnd('[AppleAuth] DB Operations')

            const token = loginResult.token

            const res = NextResponse.json({
                success: true,
                message: isNewUser ? 'User registered and logged in successfully' : 'User logged in successfully',
                user: loginResult.user,
                token,
                isNewUser,
            }, { status: 200 })

            if (token) {
                res.cookies.set('paylaod-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7,
                })
            }

            console.timeEnd(timerLabel)
            return res

        } catch (error: any) {
            console.error('[AppleAuth] Token verification or login failed:', error)
            console.timeEnd(timerLabel)
            return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[AppleAuth] Critical error:', error)
        try { console.timeEnd(timerLabel) } catch (e) { }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
