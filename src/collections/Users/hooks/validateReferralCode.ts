import { CollectionBeforeChangeHook, ValidationError } from 'payload';

export const validateReferralCode: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req: { payload } }) => {
    const referralCodeInput: string | undefined = data?.referralCodeInput;

    // If no input provided, just pass through
    if (!referralCodeInput || referralCodeInput.trim() === '') {
        // Only set not_eligible on creation if no code is provided
        if (operation === 'create') {
            data.referralStatus = 'not_eligible';
        }
        return data;
    }

    // For updates (Almost There screen), check if user is eligible
    if (operation === 'update') {
        const currentStatus = originalDoc?.referralStatus;
        const currentReferredBy = originalDoc?.referredBy;

        // Block if already set or rewarded
        if (currentStatus === 'rewarded' || (currentStatus === 'pending' && currentReferredBy)) {
            return data;
        }

        // LOCK: Only allow referral within 24 hours of account creation
        if (originalDoc?.createdAt) {
            const createdAt = new Date(originalDoc.createdAt).getTime();
            const now = new Date().getTime();
            const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

            if (hoursSinceCreation > 24) {
                throw new ValidationError({
                    errors: [{ message: 'Referral codes can only be applied within 24 hours of account creation.', path: 'referralCodeInput' }],
                });
            }
        }
    }

    // Find a user whose referralCode matches the input
    let referrerResult;
    try {
        referrerResult = await payload.find({
            collection: 'users',
            where: {
                referralCode: { equals: referralCodeInput.trim() },
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        });
    } catch (err) {
        console.error('[validateReferralCode] Error looking up referral code:', err);
        throw new ValidationError({
            errors: [{ message: 'Could not validate referral code. Please try again.', path: 'referralCodeInput' }],
        });
    }

    if (!referrerResult || referrerResult.docs.length === 0) {
        throw new ValidationError({
            errors: [{ message: 'Invalid referral code.', path: 'referralCodeInput' }],
        });
    }

    const referrer = referrerResult.docs[0];

    // BLOCK: Self-referral
    if (operation === 'update' && String(referrer.id) === String(originalDoc?.id)) {
        throw new ValidationError({
            errors: [{ message: 'You cannot use your own referral code.', path: 'referralCodeInput' }],
        });
    }

    console.log(`[validateReferralCode] Valid code. Referrer: ${referrer.id}`);

    // Link them up
    data.referredBy = referrer.id;
    data.referralStatus = 'pending';

    return data;
};
