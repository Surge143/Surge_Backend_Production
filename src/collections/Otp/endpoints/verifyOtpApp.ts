import { decrypt } from "@/lib/crypto";
import { PayloadHandler } from "payload";

export const verifyOtpApp: PayloadHandler = async (req) => {
    const { payload } = req;

    try {
        if (!req.json) {
            return Response.json(
                { success: false, message: 'Invalid request context' },
                { status: 400 }
            )
        }

        const body = (await req.json()) as { email?: string, otp?: string }
        const { email, otp } = body

        if (!email || !otp) {
            return Response.json(
                { success: false, message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        const decryptedEmail = decrypt<{ email: string }>(email);

        const now = new Date();
        const nowMs = now.getTime();

        let existingRecords;
        try {
            existingRecords = await payload.find({
                collection: 'otp',
                where: {
                    email: { equals: decryptedEmail.email },
                },
                limit: 1,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (findError: any) {
            console.error("Error finding OTP record in verifyOtpApp:", findError);
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

        const MAX_OTP_ATTEMPTS = 5;
        if ((record.attempts || 0) >= MAX_OTP_ATTEMPTS) {
            return Response.json(
                { success: false, message: 'Too many incorrect attempts. Please request a new code.' },
                { status: 429 }
            );
        }

        const { otp: encryptedOtp } = decrypt<{ otp: string }>(record.otp as string);

        if (otp !== encryptedOtp) {
            try {
                await payload.update({
                    collection: 'otp',
                    id: record.id,
                    data: { attempts: (record.attempts || 0) + 1 },
                });
            } catch (attemptError: any) {
                console.error("Error incrementing OTP attempt count in verifyOtpApp:", attemptError);
            }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (updateOtpError: any) {
            console.error("Error marking OTP as used in verifyOtpApp:", updateOtpError);
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
                    email: { equals: decryptedEmail.email },
                },
                limit: 1,

            });
        } catch (findUserError: any) {
            console.error("Error finding user in verifyOtpApp:", findUserError);
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
                        email: decryptedEmail.email,
                        role: 'customer',
                        password: randomPassword,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,

                });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (userDbError: any) {
            console.error(`Error ${!isNewUser ? 'updating' : 'creating'} user in verifyOtpApp:`, userDbError);
            return Response.json({ success: false, message: 'Failed to prepare user session' }, { status: 500 });
        }

        // 2. Log the user in
        try {
            const result = await payload.login({
                collection: 'users',
                data: {
                    email: decryptedEmail.email,
                    password: randomPassword,
                },
                req,
            });

            return Response.json(
                {
                    success: true,
                    valid: true,
                    isNewUser,
                    message: 'OTP verified and logged in successfully',
                    user: result.user,
                    token: result.token
                },
                { status: 200 }
            );
        } catch (loginError: any) {
            console.error("Error logging in user in verifyOtpApp:", loginError);
            return Response.json({ success: false, message: 'OTP verified but login failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Critical error in verifyOtpApp endpoint:", error);
        return Response.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
