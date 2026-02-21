import { decrypt } from "@/lib/crypto";
import { PayloadHandler } from "payload";

export const verifyChangeEmailApp: PayloadHandler = async (req) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (updateOtpError: any) {
            console.error("Error marking OTP as used in verifyOtpApp:", updateOtpError);
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
                    email: decryptedEmail.email,
                    password: randomPassword,
                },
            });
        } catch (updateUserError: any) {
            console.error("Error updating user email/password in verifyChangeEmailApp:", updateUserError);
            return Response.json({ success: false, message: 'Failed to update user profile' }, { status: 500 });
        }

        // 2. Refresh the session using payload.login
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
                    message: 'Email updated successfully',
                    user: result.user,
                    token: result.token
                },
                { status: 200 }
            );
        } catch (loginError: any) {
            console.error("Error refreshing session in verifyChangeEmailApp:", loginError);
            return Response.json({ success: false, message: 'Email updated but session refresh failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Critical error in verifyOtpApp endpoint:", error);
        return Response.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
