import NextAuth from 'next-auth'
import { getAuthOptions } from '@/auth'

function handler(req: Request, ctx: any) {
    return NextAuth(getAuthOptions())(req, ctx)
}

export { handler as GET, handler as POST }
