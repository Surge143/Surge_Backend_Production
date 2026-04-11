import crypto from 'crypto'
import type { NextAuthOptions } from 'next-auth'
import AppleProvider from 'next-auth/providers/apple'
import { getPayload } from '@/utilities/getPayload'

/**
 * Generates the Apple client_secret — a short-lived JWT signed with
 * the Apple private key. Valid for up to 6 months.
 * Apple requires this format instead of a static secret.
 */
function generateAppleClientSecret(): string {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)

  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid: process.env.APPLE_KEY_ID }),
  ).toString('base64url')

  const jwtPayload = Buffer.from(
    JSON.stringify({
      iss: process.env.APPLE_TEAM_ID,
      iat: now,
      exp: now + 15777000, // ~6 months max
      aud: 'https://appleid.apple.com',
      sub: process.env.APPLE_ID,
    }),
  ).toString('base64url')

  const signingInput = `${header}.${jwtPayload}`
  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  // Apple requires IEEE P1363 format (raw r||s), not DER
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url')

  return `${signingInput}.${signature}`
}

export const authOptions: NextAuthOptions = {
  providers: [
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      // Lazily generated per cold-start so env vars are always available
      clientSecret: generateAppleClientSecret(),
      authorization: {
        params: {
          // Apple requires form_post when requesting name/email scopes.
          // Without this, Apple sends the callback as a GET with no user info
          // in the body, and profile.email / profile.name will be undefined.
          scope: 'name email',
          response_mode: 'form_post',
        },
      },
      // Apple's form_post callback is a cross-origin POST — the browser drops
      // SameSite=Lax cookies, so the PKCE code_verifier cookie never arrives.
      // Disable PKCE and use state verification instead (Apple supports state).
      checks: ['state'],
    }),
  ],

  callbacks: {
    /**
     * On first Apple sign-in: find or create the user in Payload CMS,
     * then store the Payload token + user in the NextAuth JWT so the
     * bridge route can set the Payload cookie without an extra DB call.
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === 'apple') {
        try {
          const payload = await getPayload()

          // Apple only sends the full profile on the FIRST sign-in.
          // On subsequent calls (token refresh), profile is undefined.
          // account.providerAccountId is always the Apple sub (unique user ID).
          const appleSubId: string =
            (profile?.sub as string) || account.providerAccountId || ''
          const email: string = (profile?.email as string) || ''
          const firstName: string = (profile as any)?.name?.firstName || ''
          const lastName: string = (profile as any)?.name?.lastName || ''
          const isPrivateEmail =
            (profile as any)?.is_private_email === true ||
            (profile as any)?.is_private_email === 'true' ||
            email.endsWith('@privaterelay.appleid.com')

          // 1. Try to find existing user by appleSubId first (works across logins),
          //    then fall back to email match
          let userDoc: any = null

          if (appleSubId) {
            const bySubId = await payload.find({
              collection: 'users',
              where: { appleSubId: { equals: appleSubId } },
              limit: 1,
            })
            userDoc = bySubId.docs[0] || null
          }

          if (!userDoc && !isPrivateEmail && email) {
            const byEmail = await payload.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            })
            userDoc = byEmail.docs[0] || null
          }

          // If we found a user, just log them in with their existing password
          // (we re-set it to a new random value each time so it can't be guessed)
          const randomPassword = crypto.randomBytes(16).toString('hex')

          if (!userDoc) {
            // New user — require at least an email (Apple private relay is fine too)
            if (!email && !isPrivateEmail) {
              throw new Error('Apple returned no email — cannot create user without email')
            }
            userDoc = await payload.create({
              collection: 'users',
              data: {
                email,
                firstName,
                lastName,
                role: 'customer',
                password: randomPassword,
                appleSubId,
                isApplePrivateEmail: isPrivateEmail,
              } as any,
            })
          } else {
            const updateData: Record<string, any> = { password: randomPassword }
            if (!userDoc.appleSubId && appleSubId) {
              updateData.appleSubId = appleSubId
              updateData.isApplePrivateEmail = isPrivateEmail
            }
            userDoc = await payload.update({
              collection: 'users',
              id: userDoc.id,
              data: updateData as any,
            })
          }

          // 3. Login to get a Payload JWT token
          const loginResult = await payload.login({
            collection: 'users',
            data: { email: userDoc.email, password: randomPassword },
          })

          token.payloadToken = loginResult.token
          token.payloadUser = {
            id: String(loginResult.user?.id),
            email: loginResult.user?.email || '',
            firstName: (loginResult.user as any)?.firstName,
            lastName: (loginResult.user as any)?.lastName,
          }
        } catch (err) {
          console.error('[NextAuth Apple] Payload bridge error:', err)
        }
      }
      return token
    },

    async session({ session, token }) {
      session.payloadToken = token.payloadToken
      session.payloadUser = token.payloadUser
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
}
