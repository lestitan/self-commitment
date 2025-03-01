import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import { PaymentService } from "@/services/payment.service";
import type Stripe from "stripe";

// You'll need to set this in your .env file
// Replace with your Stripe webhook secret when ready
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event: Stripe.Event | null = null;
  let paymentIntent: Stripe.PaymentIntent | null = null;

  try {
    if (!sig || !endpointSecret) {
      console.warn(
        "Webhook signature verification skipped: missing signature or secret."
      );
      // If we can't verify the signature, we shouldn't process the event
      return NextResponse.json(
        { received: true, warning: "Webhook signature verification skipped" },
        { status: 200 }
      );
    }

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        
        // Process successful payment
        await PaymentService.handleSuccessfulPayment(paymentIntent.id);
        break;
        
      case "payment_intent.payment_failed":
        paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        
        // Process failed payment
        await PaymentService.handleFailedPayment(paymentIntent.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
}