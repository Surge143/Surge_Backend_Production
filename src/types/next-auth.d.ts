import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    payloadToken?: string
    isApplePrivateEmail?: boolean
    payloadUser?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    payloadToken?: string
    isApplePrivateEmail?: boolean
    payloadUser?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}