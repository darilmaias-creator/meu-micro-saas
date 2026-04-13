import "server-only";

import type Stripe from "stripe";

import { isFounderPriceId } from "@/lib/billing/stripe";
import {
  findUserById,
  findUserByStripeCustomerId,
  findUserByStripeSubscriptionId,
  updateUserBillingState,
} from "@/lib/auth/user-store";

const PREMIUM_ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

export function shouldGrantPremium(status: Stripe.Subscription.Status) {
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

export async function syncSubscriptionState(
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

  const existingUser = await findUserById(userId);

  if (!existingUser) {
    throw new Error("Nao foi possivel localizar a conta interna da assinatura.");
  }

  const founderOfferApplied =
    options?.founderOfferApplied === true ||
    subscription.metadata.founderOfferApplied === "true" ||
    isFounderPriceId(stripePriceId);
  const grantsPremium = shouldGrantPremium(subscription.status);
  const premiumActivatedAt = grantsPremium
    ? existingUser.plan === "premium" &&
      existingUser.stripeSubscriptionId === stripeSubscriptionId &&
      existingUser.premiumActivatedAt
      ? existingUser.premiumActivatedAt
      : new Date().toISOString()
    : null;

  await updateUserBillingState({
    userId,
    plan: grantsPremium ? "premium" : "free",
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSubscriptionStatus: subscription.status,
    stripePriceId,
    stripeCurrentPeriodEnd: toIsoStringFromUnixTimestamp(
      firstSubscriptionItem?.current_period_end,
    ),
    premiumActivatedAt,
    founderOfferApplied,
    founderOfferRevokedAt: existingUser.founderOfferRevokedAt ?? null,
  });

  return {
    userId,
    confirmed: grantsPremium,
    status: subscription.status,
  };
}
