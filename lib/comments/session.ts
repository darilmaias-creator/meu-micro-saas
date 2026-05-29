import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const COMMENT_AUTHOR_COOKIE = "ca_comment_author";
const COMMENT_SESSION_DAYS = 30;
const COMMENT_SESSION_TTL_MS = COMMENT_SESSION_DAYS * 24 * 60 * 60 * 1000;

function getSigningSecret() {
  const secret = process.env.COMMENTS_SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("COMMENTS_SESSION_SECRET or NEXTAUTH_SECRET is required.");
  }

  return secret;
}

function signPayload(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCommentAuthorToken(authorId: string) {
  const expiresAt = Date.now() + COMMENT_SESSION_TTL_MS;
  const payload = `${authorId}.${expiresAt}`;
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function parseCommentAuthorToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [authorId, expiresAtRaw, signature] = token.split(".");

  if (!authorId || !expiresAtRaw || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const payload = `${authorId}.${expiresAtRaw}`;

  if (!safeCompare(signPayload(payload), signature)) {
    return null;
  }

  return {
    authorId,
    expiresAt,
  };
}

export const commentAuthorCookieOptions = {
  httpOnly: true,
  maxAge: COMMENT_SESSION_DAYS * 24 * 60 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
