import "server-only";

import { createHash, randomBytes } from "node:crypto";

const PASSWORD_RESET_TOKEN_DURATION_MS = 1000 * 60 * 60;

export function createPasswordResetRequest() {
  const requestedAt = new Date();
  const expiresAt = new Date(
    requestedAt.getTime() + PASSWORD_RESET_TOKEN_DURATION_MS,
  );
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    requestedAt: requestedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpirationLabel(expiresAt: string) {
  const expiresDate = new Date(expiresAt);

  return expiresDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function buildPasswordResetUrl(baseUrl: string, token: string) {
  const resetUrl = new URL("/redefinir-senha", baseUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}
