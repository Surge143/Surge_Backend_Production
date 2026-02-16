import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { calculateTaxAndShipping } from '../_components/calculateTaxAndShipping';

export async function POST(req: NextRequest) {
    try {
        const payloadConfig = await config;
        const payload = await getPayload({ config: payloadConfig });

        const body = await req.json();
        const { deliveryOption, shippingAddress } = body;

        if (!deliveryOption) {
            return NextResponse.json({ error: 'deliveryOption is required' }, { status: 400 });
        }

        const stats = await calculateTaxAndShipping(payload, deliveryOption, shippingAddress);

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Error calculating tax/shipping:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
