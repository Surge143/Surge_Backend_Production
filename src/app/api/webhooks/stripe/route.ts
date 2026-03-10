import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { handleInvoicePaid } from './_components/invoicePaid';
import { handleWebPaymentIntentSucceeded } from './_components/webPaymentIntentSucceeded';
import { handleAppPaymentIntentSucceeded } from './_components/appPaymentIntentSucceeded';
import { handleChargeRefunded } from './_components/chargeRefunded';
import { handleSubscriptionDeleted } from './_components/subscriptionDeleted';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);
    console.log(`🔔 Stripe Webhook received: ${event.type}`);

    switch (event.type) {
      case 'invoice.paid':
        console.log(JSON.stringify(event, null, 2));
        await handleInvoicePaid(event.data.object);
        break;

      case 'payment_intent.succeeded':
        const pi = event.data.object;
        console.log(`💰 Payment Intent Succeeded: ${pi.id}, Order Type: ${pi.metadata?.order_type}, Invoice: ${pi.invoice}`);

        // Only skip if it's a subscription-related payment intent (handled via invoice.paid)
        // One-time payments (cafe/store) might occasionally have an invoice but still need PI processing
        if (pi.invoice && pi.metadata?.order_type === 'subscription') {
          console.log(`⏭️ Skipping payment_intent.succeeded for subscription (invoice: ${pi.invoice})`);
          break;
        }

        if (pi.metadata?.order_type === 'store') {
          await handleWebPaymentIntentSucceeded(pi);
        } else if (pi.metadata?.order_type === 'cafe') {
          await handleAppPaymentIntentSucceeded(pi);
        } else {
          console.log(`⚠️ Unhandled order_type in payment_intent.succeeded: ${pi.metadata?.order_type}`);
        }
        break;

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const orderType = charge.metadata?.order_type;
        console.log(`🔄 Charge Refunded: order_type=${orderType}, db_order_id=${charge.metadata?.db_order_id}`);
        if (orderType === 'store' || orderType === 'cafe') {
          await handleChargeRefunded(charge);
        } else {
          console.log(`[charge.refunded] Unknown or missing order_type: ${orderType}, skipping`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        console.log(`🔴 Customer Subscription Deleted: ${sub.id}`);
        await handleSubscriptionDeleted(sub);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    if (err.stack) console.error(err.stack);
    return NextResponse.json({ error: 'Webhook Error', message: err.message }, { status: 400 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}