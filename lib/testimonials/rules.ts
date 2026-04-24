export const TESTIMONIAL_MINIMUM_ACCOUNT_AGE_DAYS = 7;
export const TESTIMONIAL_MIN_LENGTH = 40;
export const TESTIMONIAL_MAX_LENGTH = 320;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toTimestamp(value: string | Date) {
  return typeof value === "string" ? new Date(value).getTime() : value.getTime();
}

export function normalizeTestimonialMessage(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getTestimonialEligibleAt(value: string | Date) {
  return new Date(
    toTimestamp(value) + TESTIMONIAL_MINIMUM_ACCOUNT_AGE_DAYS * MS_PER_DAY,
  );
}

export function getTestimonialRemainingDays(
  createdAt: string | Date,
  now: string | Date = new Date(),
) {
  const eligibleAt = getTestimonialEligibleAt(createdAt).getTime();
  const nowTimestamp = toTimestamp(now);

  if (nowTimestamp >= eligibleAt) {
    return 0;
  }

  return Math.ceil((eligibleAt - nowTimestamp) / MS_PER_DAY);
}

export function canSubmitTestimonial(
  createdAt: string | Date,
  now: string | Date = new Date(),
) {
  return getTestimonialRemainingDays(createdAt, now) === 0;
}

export function validateTestimonialMessage(value: string) {
  const normalized = normalizeTestimonialMessage(value);

  if (normalized.length < TESTIMONIAL_MIN_LENGTH) {
    return {
      ok: false as const,
      code: "TOO_SHORT",
      normalized,
    };
  }

  if (normalized.length > TESTIMONIAL_MAX_LENGTH) {
    return {
      ok: false as const,
      code: "TOO_LONG",
      normalized,
    };
  }

  return {
    ok: true as const,
    normalized,
  };
}
