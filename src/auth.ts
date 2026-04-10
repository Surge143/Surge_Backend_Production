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
      clientSecret: generateAppleClientSecret(),
    }),
  ],

  callbacks: {
    /**
     * On first Apple sign-in: find or create the user in Payload CMS,
     * then store the Payload token + user in the NextAuth JWT so the
     * bridge route can set the Payload cookie without an extra DB call.
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === 'apple' && profile) {
        try {
          const payload = await getPayload()

          const appleSubId: string = profile.sub as string
          const email: string = (profile.email as string) || ''
          const firstName: string = (profile as any).name?.firstName || ''
          const lastName: string = (profile as any).name?.lastName || ''
          const isPrivateEmail =
            (profile as any).is_private_email === true ||
            (profile as any).is_private_email === 'true' ||
            email.endsWith('@privaterelay.appleid.com')

          // 1. Try to find existing user
          let userDoc: any = null

          if (!isPrivateEmail && email) {
            const byEmail = await payload.find({
              collection: 'users',
              where: { email: { equals: email } },
              limit: 1,
            })
            userDoc = byEmail.docs[0] || null
          }

          if (!userDoc && appleSubId) {
            const bySubId = await payload.find({
              collection: 'users',
              where: { appleSubId: { equals: appleSubId } },
              limit: 1,
            })
            userDoc = bySubId.docs[0] || null
          }

          // 2. Create or update
          const randomPassword = crypto.randomBytes(16).toString('hex')

          if (!userDoc) {
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
