const STORAGE_PREFIX = "calcula-artesao";

export const ONBOARDING_GLOBAL_COMPLETED_KEY = "onboarding_completed";

export const getOnboardingCompletedKey = (userId: string) =>
  `${STORAGE_PREFIX}:onboarding-completed:${userId}`;

export const getOnboardingProgressKey = (userId: string) =>
  `${STORAGE_PREFIX}:onboarding-progress:${userId}`;
