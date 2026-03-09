import { PayloadHandler } from 'payload';

export const validateReferral: PayloadHandler = async (req): Promise<Response> => {
    const { payload } = req;

    try {
        if (!req.json) {
            return Response.json(
                { valid: false, message: 'Invalid request context' },
                { status: 400 }
            );
        }

        const body = (await req.json()) as { referralCode?: string };
        const { referralCode } = body;

        if (!referralCode || typeof referralCode !== 'string') {
            return Response.json(
                { valid: false, message: 'Referral code is required.' },
                { status: 400 }
            );
        }

        const result = await payload.find({
            collection: 'users',
            where: {
                referralCode: { equals: referralCode.trim() },
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        });

        if (!result.docs || result.docs.length === 0) {
            return Response.json(
                { valid: false, message: 'Invalid referral code.' },
                { status: 404 }
            );
        }

        const referrer = result.docs[0];
        const referrerName = referrer.firstName
            ? `${referrer.firstName} ${referrer.lastName || ''}`.trim()
            : 'A friend';

        return Response.json({
            valid: true,
            message: 'Referral code is valid.',
            referrer: {
                id: referrer.id,
                name: referrerName,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('[validateReferral] Error:', error);
        return Response.json(
            { valid: false, message: 'Internal server error during validation.' },
            { status: 500 }
        );
    }
};
