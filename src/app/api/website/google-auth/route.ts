import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_APP_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export async function POST(req: NextRequest) {
    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const body = await req.json();
        const { googleToken } = body;

        if (!googleToken) {
            return NextResponse.json({ error: 'Missing googleToken' }, { status: 400 })
        }

        try {
            const ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: CLIENT_ID,
            });

            const googlePayload = ticket.getPayload();
            if (!googlePayload || !googlePayload.email) {
                return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 })
            }

            const { email, given_name, family_name, picture } = googlePayload;

            const firstName = given_name || ""
            const lastName = family_name || "";

            // 1. Find or create the user
            const users = await payload.find({
                collection: 'users',
                where: { email: { equals: email } },
                limit: 1,
            });

            let userDoc = users.docs[0];
            const isNewUser = !userDoc;
            const randomPassword = Math.random().toString(36).slice(-10);

            if (isNewUser) {
                userDoc = await payload.create({
                    collection: 'users',
                    data: {
                        email,
                        firstName,
                        lastName,
                        profileImage: picture,
                        role: 'customer',
                        password: randomPassword,
                    } as any,
                });
            } else {
                userDoc = await payload.update({
                    collection: 'users',
                    id: userDoc.id,
                    data: {
                        password: randomPassword,
                    } as any,
                });
            }

            // 2. Log the user in
            const loginResult = await payload.login({
                collection: 'users',
                data: {
                    email: email,
                    password: randomPassword,
                },
                req,
            });

            const token = loginResult.token;

            const res = NextResponse.json({
                success: true,
                message: isNewUser ? 'User registered and logged in successfully' : 'User logged in successfully',
                user: loginResult.user,
                isNewUser,
            }, { status: 200 });

            if (token) {
                res.cookies.set('payload-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7,
                });
            }

            return res;

        } catch (error: any) {
            console.error('[GoogleAuth] Token verification or login failed:', error);
            return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[GoogleAuth] Critical error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}