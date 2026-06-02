import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { stripe } from '@/lib/stripe'
import { handleWebPaymentIntentSucceeded } from './_components/webPaymentIntentSucceeded'
import { handleAppPaymentIntentSucceeded } from './_components/appPaymentIntentSucceeded'
import { handleChargeRefunded } from './_components/chargeRefunded'

// Allow up to 60s on Vercel Pro. On hobby the limit is 10s but the response
// is already sent before heavy processing starts, so Stripe never times out.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: any

  // Signature verification is fast (<100ms) — do this before responding
  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!)
    console.log(`🔔 Stripe Webhook received: ${event.type}`)
  } catch (err: any) {
    console.error('❌ Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Webhook Error', message: err.message }, { status: 400 })
  }

  // Return 200 to Stripe immediately — Payload init + DB work runs in the same
  // warm function instance AFTER the response is sent, so Stripe never sees a timeout.
  // On Vercel, we MUST use waitUntil to ensure the background promise is not killed.
  waitUntil(
    processEvent(event).catch((err) =>
      console.error('❌ Webhook background processing error:', err.message),
    ),
  )

  return NextResponse.json({ received: true }, { status: 200 })
}

async function processEvent(event: any) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      console.log(
        `💰 Payment Intent Succeeded: ${pi.id}, Order Type: ${pi.metadata?.order_type}`,
      )
      if (pi.metadata?.order_type === 'store') {
        await handleWebPaymentIntentSucceeded(pi)
      } else if (pi.metadata?.order_type === 'cafe') {
        await handleAppPaymentIntentSucceeded(pi)
      } else {
        console.log(`⚠️ Unhandled order_type: ${pi.metadata?.order_type}`)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as any
      const orderType = charge.metadata?.order_type
      console.log(
        `🔄 Charge Refunded: order_type=${orderType}, db_order_id=${charge.metadata?.db_order_id}`,
      )
      if (orderType === 'store' || orderType === 'cafe') {
        await handleChargeRefunded(charge)
      } else {
        console.log(`[charge.refunded] Unknown or missing order_type: ${orderType}, skipping`)
      }
      break
    }

    default:
      console.log('Unhandled event type:', event.type)
  }
}
