import { PayloadHandler } from 'payload'
import { NextResponse } from 'next/server'

export const subscription: PayloadHandler = async (req) => {
    try {

        if (!req.json) {
            return Response.json(
                { success: false, message: 'Invalid request context' },
                { status: 400 }
            )
        }

        const body = (await req.json()) as any
        const { email } = body


        return NextResponse.json({ success: true, message: "Subscription endpoint hit successfully" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}