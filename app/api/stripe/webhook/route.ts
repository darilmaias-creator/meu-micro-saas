import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  createStripeServerClient,
  getStripeWebhookSecret,
  isFounderPriceId,
} from "@/lib/billing/stripe";
import {
  findUserById,
  findUserByStripeCustomerId,
  findUserByStripeSubscriptionId,
  updateUserBillingState,
} from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PREMIUM_ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

function shouldGrantPremium(status: Stripe.Subscription.Status) {
  return PREMIUM_ACTIVE_STATUSES.has(status);
}

function toIsoStringFromUnixTimestamp(value: number | null | undefined) {
  if (typeof value !== "number") {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

async function resolveBillingUserId(input: {
  metadataUserId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (input.metadataUserId) {
    const user = await findUserById(input.metadataUserId);
    if (user) {
      return user.id;
    }
  }

  if (input.stripeSubscriptionId) {
    const user = await findUserByStripeSubscriptionId(input.stripeSubscriptionId);
    if (user) {
      return user.id;
    }
  }

  if (input.stripeCustomerId) {
    const user = await findUserByStripeCustomerId(input.stripeCustomerId);
    if (user) {
      return user.id;
    }
  }

  return null;
}

async function syncSubscriptionState(
  subscription: Stripe.Subscription,
  options?: {
    fallbackUserId?: string | null;
    founderOfferApplied?: boolean;
  },
) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  const stripeSubscriptionId = subscription.id;
  const firstSubscriptionItem = subscription.items.data[0];
  const stripePriceId = firstSubscriptionItem?.price?.id ?? null;
  const userId = await resolveBillingUserId({
    metadataUserId: subscription.metadata.appUserId ?? options?.fallbackUserId,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  if (!userId) {
    throw new Error("Nao foi possivel localizar o usuario da assinatura Stripe.");
  }

  const founderOfferApplied =
    options?.founderOfferApplied === true ||
    subscription.metadata.founderOfferApplied === "true" ||
    isFounderPriceId(stripePriceId);

  await updateUserBillingState({
    userId,
    plan: shouldGrantPremium(subscription.status) ? "premium" : "free",
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSubscriptionStatus: subscription.status,
    stripePriceId,
    stripeCurrentPeriodEnd: toIsoStringFromUnixTimestamp(
      firstSubscriptionItem?.current_period_end,
    ),
    founderOfferApplied,
  });
}

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
    console.error("[stripe:webhook:signature]", error);
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe:webhook]", error);
    return NextResponse.json(
      { message: "Nao foi possivel processar o evento da Stripe." },
      { status: 500 },
    );
  }
}
