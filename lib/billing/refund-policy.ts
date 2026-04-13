export const PREMIUM_FULL_REFUND_WINDOW_DAYS = 7;

const PREMIUM_FULL_REFUND_WINDOW_MS =
  PREMIUM_FULL_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPremiumRefundDeadline(
  premiumActivatedAt: string | null | undefined,
) {
  const activatedAtTimestamp = toTimestamp(premiumActivatedAt);

  if (activatedAtTimestamp === null) {
    return null;
  }

  return new Date(activatedAtTimestamp + PREMIUM_FULL_REFUND_WINDOW_MS);
}

export function canRequestPremiumRefund(
  premiumActivatedAt: string | null | undefined,
  now = Date.now(),
) {
  const deadline = getPremiumRefundDeadline(premiumActivatedAt);

  if (!deadline) {
    return false;
  }

  return now <= deadline.getTime();
}

export function getPremiumRefundDaysRemaining(
  premiumActivatedAt: string | null | undefined,
  now = Date.now(),
) {
  const deadline = getPremiumRefundDeadline(premiumActivatedAt);

  if (!deadline) {
    return null;
  }

  const remainingMs = deadline.getTime() - now;

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}
