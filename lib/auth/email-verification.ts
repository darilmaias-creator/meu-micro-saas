import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const EMAIL_VERIFICATION_TOKEN_DURATION_MS = 1000 * 60 * 60 * 24;

type EmailVerificationTokenPayload = {
  email: string;
  exp: number;
  nonce: string;
  userId: string;
};

function getEmailVerificationSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured.");
  }

  return secret;
}

function signTokenPayload(encodedPayload: string) {
  return createHmac("sha256", getEmailVerificationSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodePayload(payload: EmailVerificationTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string) {
  const parsedPayload = JSON.parse(
    Buffer.from(value, "base64url").toString("utf8"),
  ) as Partial<EmailVerificationTokenPayload>;

  if (
    typeof parsedPayload.email !== "string" ||
    typeof parsedPayload.exp !== "number" ||
    typeof parsedPayload.nonce !== "string" ||
    typeof parsedPayload.userId !== "string"
  ) {
    return null;
  }

  return parsedPayload as EmailVerificationTokenPayload;
}

export function createEmailVerificationToken(input: {
  email: string;
  userId: string;
}) {
  const payload: EmailVerificationTokenPayload = {
    email: input.email,
    exp: Date.now() + EMAIL_VERIFICATION_TOKEN_DURATION_MS,
    nonce: randomBytes(16).toString("hex"),
    userId: input.userId,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signTokenPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function buildEmailVerificationUrl(baseUrl: string, token: string) {
  const verificationUrl = new URL("/api/auth/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);
  return verificationUrl.toString();
}

export function verifyEmailVerificationToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = decodePayload(encodedPayload);

    if (!payload || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
