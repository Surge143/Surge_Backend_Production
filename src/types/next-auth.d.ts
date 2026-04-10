import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    payloadToken?: string
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
    payloadUser?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}
