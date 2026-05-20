import { NextRequest, NextResponse } from 'next/server'

const ANDROID_PACKAGE = process.env.ANDROID_APP_PACKAGE || 'com.whitemantis.app'

export async function POST(req: NextRequest) {
    try {
        // Apple sends application/x-www-form-urlencoded
        const formData = await req.formData()
        const idToken = formData.get('id_token') as string | null
        // Apple sends user JSON only on first login: { name: { firstName, lastName }, email }
        const userJson = formData.get('user') as string | null

        if (!idToken) {
            const errorIntent = `intent://apple-auth?error=missing_token#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
            return NextResponse.redirect(errorIntent, { status: 302 })
        }

        let firstName = '', lastName = ''
        if (userJson) {
            try {
                const u = JSON.parse(userJson)
                firstName = u?.name?.firstName || ''
                lastName = u?.name?.lastName || ''
            } catch { /* malformed user field — name stays empty */ }
        }

        // Hand off to Android app — app calls POST /api/app/apple-auth with this token
        const params = new URLSearchParams({ token: idToken, firstName, lastName })
        const intentUri = `intent://apple-auth?${params}#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`

        return NextResponse.redirect(intentUri, { status: 302 })
    } catch (err: any) {
        console.error('[AppleAuth Android Callback] Error:', err)
        const errorIntent = `intent://apple-auth?error=server_error#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};end;`
        return NextResponse.redirect(errorIntent, { status: 302 })
    }
}
