import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { headers as getNextHeaders } from 'next/headers';
import { stripe } from '@/lib/stripe';

/**
 * Returns the authenticated user's saved Stripe card payment methods.
 * Safe to call from the frontend — the secret key never leaves the server.
 */
export async function GET(_req: NextRequest) {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const { user } = await payload.auth({ headers: await getNextHeaders() });

        if (!user) {
            return NextResponse.json({ paymentMethods: [] }, { status: 200 });
        }

        const userDoc = await payload.findByID({
            collection: 'users',
            id: user.id,
            depth: 0,
            overrideAccess: true,
        });

        const stripeCustomerId = (userDoc as any).stripeCustomerId;

        if (!stripeCustomerId) {
            return NextResponse.json({ paymentMethods: [] }, { status: 200 });
        }

        const pmList = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
            limit: 20, // Fetch more to allow for unique filtering
        });

        // Filter for unique cards using fingerprint
        const uniqueFingerprints = new Set();
        const uniquePaymentMethods: any[] = [];

        for (const pm of pmList.data) {
            const fingerprint = pm.card?.fingerprint;
            // Fallback key if fingerprint is missing (rare for cards)
            const fallbackKey = `${pm.card?.brand}-${pm.card?.last4}-${pm.card?.exp_month}-${pm.card?.exp_year}`;
            const key = fingerprint || fallbackKey;

            if (!uniqueFingerprints.has(key)) {
                uniqueFingerprints.add(key);
                uniquePaymentMethods.push(pm);
            }

            // Limit the final output to 3 unique cards
            if (uniquePaymentMethods.length >= 3) break;
        }

        const paymentMethods = uniquePaymentMethods.map((pm) => ({
            id: pm.id,
            brand: pm.card?.brand ?? 'card',
            last4: pm.card?.last4 ?? '****',
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
        }));

        return NextResponse.json({ paymentMethods }, { status: 200 });
    } catch (error: any) {
        console.error('[payment-methods] Error:', error);
        return NextResponse.json({ paymentMethods: [] }, { status: 200 });
    }
}
