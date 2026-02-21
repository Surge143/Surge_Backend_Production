import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { headers as getNextHeaders } from 'next/headers';
import { stripe } from '@/lib/stripe';

/**
 * Creates a Stripe CustomerSession client secret.
 * The frontend uses this to initialise the Stripe Payment Element
 * with the customer's saved payment methods — no secret key exposed.
 */
export async function GET(req: NextRequest) {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const { user } = await payload.auth({ headers: await getNextHeaders() });

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch stripeCustomerId from the users collection
        const userDoc = await payload.findByID({
            collection: 'users',
            id: user.id,
            depth: 0,
            overrideAccess: true,
        });

        const stripeCustomerId = (userDoc as any).stripeCustomerId;

        if (!stripeCustomerId) {
            // No Stripe customer yet — tell the frontend to show the new card form only
            return NextResponse.json({ customerSessionClientSecret: null }, { status: 200 });
        }

        const customerSession = await stripe.customerSessions.create({
            customer: stripeCustomerId,
            components: {
                payment_element: {
                    enabled: true,
                    features: {
                        payment_method_redisplay: 'enabled',
                        payment_method_save: 'enabled',
                        payment_method_save_usage: 'off_session',
                        payment_method_remove: 'enabled',
                    },
                },
            },
        });

        return NextResponse.json({
            customerSessionClientSecret: customerSession.client_secret,
            stripeCustomerId,
        }, { status: 200 });

    } catch (error: any) {
        console.error('[customer-session] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
