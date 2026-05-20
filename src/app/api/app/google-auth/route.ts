import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utilities/getPayload'
import { OAuth2Client } from "google-auth-library";
import { uploadGoogleImage } from '@/utilities/uploadGoogleImage';

const CLIENT_ID = process.env.GOOGLE_APP_CLIENT_ID;
const IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export async function POST(req: NextRequest) {
    const timerLabel = `[GoogleAuth-App-${Date.now()}]`;
    try {
        console.time(timerLabel);
        console.time('[GoogleAuth] Payload Init');
        const payload = await getPayload()
        console.timeEnd('[GoogleAuth] Payload Init');

        const body = await req.json();
        const { googleToken } = body;

        if (!googleToken) {
            console.timeEnd(timerLabel);
            return NextResponse.json({ error: 'Missing googleToken' }, { status: 400 })
        }

        try {
            console.time('[GoogleAuth] Token Verification');
            const ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: [CLIENT_ID!, IOS_CLIENT_ID].filter(Boolean) as string[],
            });

            const googlePayload = ticket.getPayload();
            console.timeEnd('[GoogleAuth] Token Verification');

            if (!googlePayload || !googlePayload.email) {
                console.timeEnd(timerLabel);
                return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 })
            }

            const { email, given_name, family_name, picture } = googlePayload;

            const firstName = given_name || ""
            const lastName = family_name || "";

            console.time('[GoogleAuth] DB Operations');
            // 1. Find or create the user
            const users = await payload.find({
                collection: 'users',
                where: { email: { equals: email } },
                limit: 1,
            });

            let userDoc = users.docs[0];
            const isNewUser = !userDoc;
            const randomPassword = Math.random().toString(36).slice(-10);

            let profileImageId: any = userDoc?.profileImage;

            // If new user and has picture, upload it
            if (isNewUser && picture) {
                console.time('[GoogleAuth] Image Upload');
                profileImageId = await uploadGoogleImage(payload, picture, firstName, lastName);
                console.timeEnd('[GoogleAuth] Image Upload');
            }

            if (isNewUser) {
                userDoc = await payload.create({
                    collection: 'users',
                    data: {
                        email,
                        firstName,
                        lastName,
                        profileImage: profileImageId,
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
            console.timeEnd('[GoogleAuth] DB Operations');

            console.timeEnd(timerLabel);
            return NextResponse.json({
                success: true,
                message: isNewUser ? 'User registered and logged in successfully' : 'User logged in successfully',
                user: loginResult.user,
                token: loginResult.token,
                isNewUser,
            }, { status: 200 });

        } catch (error: any) {
            console.error('[GoogleAuth] Token verification or login failed:', error);
            console.timeEnd(timerLabel);
            return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[GoogleAuth] Critical error:', error);
        try { console.timeEnd(timerLabel); } catch (e) { }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
