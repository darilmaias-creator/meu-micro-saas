export type UserPlan = "free" | "premium";

export const FREE_NAME_CHANGE_LIMIT = 1;
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 800 * 1024;
export const MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 1_500_000;

export function getRemainingFreeNameChanges(freeNameChangesUsed: number) {
  return Math.max(0, FREE_NAME_CHANGE_LIMIT - freeNameChangesUsed);
}

export function isPremiumPlan(plan: UserPlan) {
  return plan === "premium";
}
