import { encrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/emailConfig";
import { getOTPEmailTemplate } from "@/lib/emailTemplate";
import { PayloadHandler } from "payload";

export const sendOtpApp: PayloadHandler = async (req) => {
    const { payload } = req;

    try {
        if (!req.json) {
            return Response.json(
                { success: false, message: 'Invalid request context' },
                { status: 400 }
            )
        }

        const body = (await req.json()) as { email?: string }
        const { email } = body

        if (!email) {
            return Response.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        const now = new Date();
        const nowMs = now.getTime();
        const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

        let existingRecords;
        try {
            existingRecords = await payload.find({
                collection: 'otp',
                where: {
                    email: { equals: email },
                },
                limit: 1,

            });
        } catch (findError: any) {
            console.error("Error finding OTP record in sendOtpApp:", findError);
            return Response.json({ success: false, message: 'Failed to check existing OTP records' }, { status: 500 });
        }

        const record = existingRecords.docs[0];
        const otpHistory: number[] = (record?.requestHistory as number[]) || [];

        if (record) {
            const lastCreatedAt = new Date(record.updatedAt).getTime();
            if (nowMs < lastCreatedAt + 60 * 1000) {
                const waitSec = Math.ceil((lastCreatedAt + 60 * 1000 - nowMs) / 1000);
                return Response.json(
                    { success: false, message: `Please wait ${waitSec}s before requesting a new OTP` },
                    { status: 429 }
                );
            }
        }

        const oneHourAgo = nowMs - 60 * 60 * 1000;
        const recentRequests = otpHistory.filter((timestamp: number) => timestamp > oneHourAgo);

        if (recentRequests.length >= 3) {
            const oldestRequestTime = Math.min(...recentRequests);
            const waitTimeMs = (oldestRequestTime + 60 * 60 * 1000) - nowMs;
            const waitMinutes = Math.ceil(waitTimeMs / (60 * 1000));

            return Response.json(
                { success: false, message: `OTP limit reached. Try again in ${waitMinutes} minute(s).` },
                { status: 429 }
            );
        }

        recentRequests.push(nowMs);

        const encryptedOtp = encrypt({ otp: generatedOTP })

        try {
            if (record) {
                await payload.update({
                    collection: 'otp',
                    id: record.id,
                    data: {
                        otp: encryptedOtp,
                        isUsed: false,
                        expiresAt: new Date(nowMs + 5 * 60 * 1000).toISOString(),
                        requestHistory: recentRequests,
                    },
                });
            } else {
                await payload.create({
                    collection: 'otp',
                    data: {
                        email,
                        otp: encryptedOtp,
                        isUsed: false,
                        expiresAt: new Date(nowMs + 5 * 60 * 1000).toISOString(),
                        requestHistory: recentRequests,
                    },
                });
            }
        } catch (dbError: any) {
            console.error(`Error ${record ? 'updating' : 'creating'} OTP record in sendOtpApp:`, dbError);
            return Response.json({ success: false, message: 'Failed to save OTP record' }, { status: 500 });
        }

        const encryptedEmail = encrypt({ email })

        // 5. Send the Email
        try {
            console.log(`sendOtpApp: Triggering sendEmail for ${email}`);
            await sendEmail({
                to: email,
                subject: "Your Login Code",
                body: `Your verification code is: ${generatedOTP}. This code is valid for the next 5 minutes.`,
                html: getOTPEmailTemplate(generatedOTP),
            });
            console.log(`sendOtpApp: Email sent successfully for ${email}`);
        } catch (emailError: any) {
            console.error("Error sending OTP email in sendOtpApp:", emailError);
            return Response.json({ success: false, message: 'Failed to send OTP email' }, { status: 500 });
        }

        return Response.json({ success: true, email: encryptedEmail, message: 'OTP sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error("Critical error in sendOtpApp endpoint:", error);
        return Response.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
}
