import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { handleInvoicePaid } from './_components/invoicePaid';
import { handlePaymentIntentSucceeded } from './_components/paymentIntentSucceeded';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);

    switch (event.type) {
      case 'invoice.paid':
        console.log(JSON.stringify(event, null, 2));
        await handleInvoicePaid(event.data.object);
        break;

      case 'payment_intent.succeeded':
        const pi = event.data.object;

        // 1. Check if this PI was created by a subscription invoice
        if (pi.invoice) {
          break;
        }
        // 2. Otherwise, treat it as a One-Time Order
        console.log('✅ Processing One-Time Order...');
        await handlePaymentIntentSucceeded(pi);
        break;

      case 'refund.created':
        console.log('Refund Created:', event.data.object);
        break;

      case 'charge.refunded':
        console.log('Charge Refunded:', event.data.object);
        break;

      case 'customer.subscription.deleted':
        console.log('Customer Subscription Deleted:', event.data.object);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}