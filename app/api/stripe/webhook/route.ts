import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  createStripeServerClient,
  getStripeWebhookSecret,
} from "@/lib/billing/stripe";
import { syncSubscriptionState } from "@/lib/billing/subscription-sync";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const stripeSignature = request.headers.get("stripe-signature");

  if (!stripeSignature) {
    return NextResponse.json(
      { message: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = createStripeServerClient();
  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      stripeSignature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    logServerEvent({
      scope: "stripe:webhook:signature",
      level: "warn",
      message: "invalid webhook signature",
      context: {
        error:
          error instanceof Error && error.message ? error.message : String(error),
      },
    });
    return NextResponse.json(
      { message: "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (
          checkoutSession.mode === "subscription" &&
          typeof checkoutSession.subscription === "string"
        ) {
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription,
          );

          await syncSubscriptionState(subscription, {
            fallbackUserId:
              checkoutSession.metadata?.appUserId ??
              checkoutSession.client_reference_id,
            founderOfferApplied:
              checkoutSession.metadata?.founderOfferApplied === "true",
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionState(subscription);
        break;
      }
    }

    logServerEvent({
      scope: "stripe:webhook",
      message: "stripe webhook processed",
      context: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    captureServerException({
      scope: "stripe:webhook",
      error,
      context: {
        eventId: event.id,
        eventType: event.type,
      },
    });
    return NextResponse.json(
      { message: "Nao foi possivel processar o evento da Stripe." },
      { status: 500 },
    );
  }
}
