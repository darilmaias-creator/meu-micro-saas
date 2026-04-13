export const PREMIUM_ACTIVE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export type PremiumActiveSubscriptionStatus =
  (typeof PREMIUM_ACTIVE_SUBSCRIPTION_STATUSES)[number];

export function isPremiumActiveSubscriptionStatus(
  value: string | null | undefined,
) {
  return PREMIUM_ACTIVE_SUBSCRIPTION_STATUSES.includes(
    value as PremiumActiveSubscriptionStatus,
  );
}

