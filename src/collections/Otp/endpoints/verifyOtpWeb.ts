import { decrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";
import { PayloadHandler } from "payload";

export const verifyOtpWeb: PayloadHandler = async (req) => {
    const { payload } = req;

    try {
        if (!req.json) {
            return Response.json(
                { success: false, message: 'Invalid request context' },
                { status: 400 }
            )
        }

        const body = (await req.json()) as { otp?: string, email?: string }
        const { otp, email } = body

        if (!otp) {
            return Response.json(
                { success: false, message: 'OTP is required' },
                { status: 400 }
            );
        }

        if (!email) {
            return Response.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        const now = new Date();
        const nowMs = now.getTime();

        let existingRecords: any;
        try {
            existingRecords = await payload.find({
                collection: 'otp',
                where: {
                    email: { equals: email },
                },
                limit: 1,

            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (findError: any) {
            console.error("Error finding OTP record in verifyOtpWeb:", findError);
            return Response.json({ success: false, message: 'Failed to verify OTP record' }, { status: 500 });
        }

        const record = existingRecords.docs[0];

        if (!record) {
            return Response.json(
                { success: false, message: 'OTP record not found for this email' },
                { status: 404 }
            );
        }

        if (record.isUsed) {
            return Response.json(
                { success: false, message: 'This OTP has already been used' },
                { status: 400 }
            );
        }

        const expiresAt = new Date(record.expiresAt).getTime();
        if (nowMs > expiresAt) {
            return Response.json(
                { success: false, message: 'OTP has expired' },
                { status: 400 }
            );
        }

        const { otp: encryptedOtp } = decrypt<{ otp: string }>(record.otp as string);

        if (otp !== encryptedOtp) {
            return Response.json(
                { success: true, valid: false, message: 'Invalid OTP' },
                { status: 200 }
            );
        }

        // Mark as used
        try {
            await payload.update({
                collection: 'otp',
                id: record.id,
                data: {
                    isUsed: true,
                },

            });
        } catch (updateOtpError: any) {
            console.error("Error marking OTP as used in verifyOtpWeb:", updateOtpError);
            return Response.json({ success: false, message: 'Failed to update OTP status' }, { status: 500 });
        }

        // 1. Find or create the user
        let user;
        const randomPassword = Math.random().toString(36).slice(-10);

        let users;
        try {
            users = await payload.find({
                collection: 'users',
                where: {
                    email: { equals: email },
                },
                limit: 1,

            });
        } catch (findUserError: any) {
            console.error("Error finding user in verifyOtpWeb:", findUserError);
            return Response.json({ success: false, message: 'Failed to access user information' }, { status: 500 });
        }

        const isNewUser = users.docs.length === 0;

        try {
            if (!isNewUser) {
                user = users.docs[0];
                await payload.update({
                    collection: 'users',
                    id: user.id,
                    data: {
                        password: randomPassword,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,

                });
            } else {
                user = await payload.create({
                    collection: 'users',
                    data: {
                        email: email,
                        role: 'customer',
                        password: randomPassword,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,

                });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (userDbError: any) {
            console.error(`Error ${!isNewUser ? 'updating' : 'creating'} user in verifyOtpWeb:`, userDbError);
            return Response.json({ success: false, message: 'Failed to prepare user session' }, { status: 500 });
        }

        // 2. Log the user in
        try {
            const result = await payload.login({
                collection: 'users',
                data: {
                    email: email,
                    password: randomPassword,
                },
                req,
            });

            const res = NextResponse.json(
                {
                    success: true,
                    valid: true,
                    isNewUser,
                    message: 'OTP verified and logged in successfully',
                    user: result.user,
                },
                { status: 200 }
            );



            if (result.token) {
                res.cookies.set('payload-token', result.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7,
                });
            }

            return res;

        } catch (loginError: any) {
            console.error("Error logging in user in verifyOtpWeb:", loginError);
            return Response.json({ success: false, message: 'OTP verified but login failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Critical error in verifyOtpWeb endpoint:", error);
        return Response.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
