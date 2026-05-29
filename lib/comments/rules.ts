import { sanitizePlainText } from "@/lib/sanitize";

export const COMMENT_MAX_LENGTH = 500;
export const COMMENT_MIN_LENGTH = 3;
export const COMMENT_PAGE_PATH_MAX_LENGTH = 180;

export function normalizeCommentPagePath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const pagePath = sanitizePlainText(value, COMMENT_PAGE_PATH_MAX_LENGTH);

  if (!pagePath.startsWith("/") || pagePath.startsWith("//")) {
    return null;
  }

  return pagePath;
}

export function normalizeCommentContent(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const textOnly = sanitizePlainText(value, COMMENT_MAX_LENGTH)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (textOnly.length < COMMENT_MIN_LENGTH) {
    return null;
  }

  return textOnly;
}
