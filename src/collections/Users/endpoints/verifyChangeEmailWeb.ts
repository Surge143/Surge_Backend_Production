import { decrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";
import { PayloadHandler } from "payload";

export const verifyChangeEmailWeb: PayloadHandler = async (req) => {
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

        if (!req.user) {
            return Response.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        if (!req.user) {
            return Response.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const randomPassword = Math.random().toString(36).slice(-10);

        // 1. Update the user's email and password
        try {
            await payload.update({
                collection: 'users',
                id: req.user.id,
                data: {
                    email: email,
                    password: randomPassword,
                },
            });
        } catch (updateUserError: any) {
            console.error("Error updating user email/password in verifyChangeEmailWeb:", updateUserError);
            return Response.json({ success: false, message: 'Failed to update user profile' }, { status: 500 });
        }

        // 2. Refresh the session using payload.login
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
                    message: 'Email updated successfully',
                    user: result.user,
                },
                { status: 200 }
            );

            res.cookies.set('pendingLogin', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 0,
            });

            if (result.token) {
                res.cookies.set('payload-token', result.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 7,
                });
            }

            return res;

        } catch (loginError: any) {
            console.error("Error refreshing session in verifyChangeEmailWeb:", loginError);
            return Response.json({ success: false, message: 'Email updated but session refresh failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Critical error in verifyOtpWeb endpoint:", error);
        return Response.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
