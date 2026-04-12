import "server-only";

import Stripe from "stripe";

import type { PremiumOfferTier } from "@/lib/billing/plans";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const stripeFounderPriceId = process.env.STRIPE_PRICE_ID_FOUNDER?.trim();
const stripeStandardPriceId = process.env.STRIPE_PRICE_ID_STANDARD?.trim();

export function isStripeBillingConfigured() {
  return Boolean(
    stripeSecretKey &&
      stripeWebhookSecret &&
      stripeFounderPriceId &&
      stripeStandardPriceId,
  );
}

export function createStripeServerClient() {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(stripeSecretKey);
}

export function getStripeWebhookSecret() {
  if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return stripeWebhookSecret;
}

export function getStripePriceIdForTier(tier: PremiumOfferTier) {
  const priceId = tier === "founder" ? stripeFounderPriceId : stripeStandardPriceId;

  if (!priceId) {
    throw new Error(
      tier === "founder"
        ? "STRIPE_PRICE_ID_FOUNDER is not configured."
        : "STRIPE_PRICE_ID_STANDARD is not configured.",
    );
  }

  return priceId;
}

export function isFounderPriceId(priceId: string | null | undefined) {
  return Boolean(priceId && stripeFounderPriceId && priceId === stripeFounderPriceId);
}

