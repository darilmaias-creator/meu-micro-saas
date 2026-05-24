import { NextResponse } from "next/server";

import { logSecurityEvent } from "@/lib/audit-log";
import {
  normalizeEmailInput,
  validateEmailAddress,
} from "@/lib/auth/input-validation";
import {
  findUserByEmail,
  setUserPasswordResetRequest,
} from "@/lib/auth/user-store";
import {
  buildPasswordResetUrl,
  createPasswordResetRequest,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ForgotPasswordPayload = {
  email?: string;
  recaptchaToken?: string | null;
};

function getBaseUrl(request: Request) {
  return process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
}

function getForgotPasswordErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido na recuperacao.";

  if (
    message.includes("password_reset_token_hash") ||
    message.includes("password_reset_expires_at") ||
    message.includes("password_reset_requested_at")
  ) {
    return "As colunas da recuperacao de senha ainda nao foram criadas no Supabase. Rode o schema.sql atualizado.";
  }

  if (message.includes("RESEND_API_KEY")) {
    return "A chave da Resend ainda nao foi configurada para enviar a recuperacao de senha.";
  }

  if (message.includes("RESEND_FROM_EMAIL")) {
    return "O remetente da Resend ainda nao foi configurado.";
  }

  if (
    message.includes("status 403") ||
    message.includes("resend.dev") ||
    message.includes("testing emails") ||
    message.includes("verify a domain")
  ) {
    return "A recuperacao por e-mail ainda esta em modo de teste na Resend. Sem um dominio verificado, ela pode falhar para outros e-mails.";
  }

  return "Nao foi possivel iniciar a recuperacao de senha agora.";
}

export async function POST(request: Request) {
  let body: ForgotPasswordPayload;

  try {
    body = (await request.json()) as ForgotPasswordPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  const email = normalizeEmailInput(body.email);

  const rateLimitResult = await consumeAuthRateLimit({
    action: "forgot_password",
    email,
    headers: request.headers,
  });

  if (!rateLimitResult.ok) {
    await logSecurityEvent({
      action: "auth.forgot_password.rate_limited",
      details: {
        email,
        retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      },
      headers: request.headers,
      severity: "warn",
    });
    return NextResponse.json(
      { message: rateLimitResult.message },
      { status: 429 },
    );
  }

  const recaptchaResult = await verifyRecaptchaToken(body.recaptchaToken);

  if (!recaptchaResult.ok) {
    await logSecurityEvent({
      action: "auth.forgot_password.captcha_failed",
      details: {
        email,
      },
      headers: request.headers,
      severity: "warn",
    });
    return NextResponse.json(
      { message: recaptchaResult.message },
      { status: 400 },
    );
  }

  const emailValidationMessage = validateEmailAddress(email);

  if (emailValidationMessage) {
    return NextResponse.json(
      { message: "Informe um e-mail valido para recuperar a senha." },
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !user.passwordHash) {
      await logSecurityEvent({
        action: "auth.forgot_password.requested",
        details: {
          email,
          matchedAccount: false,
        },
        headers: request.headers,
        severity: "warn",
      });
      return NextResponse.json({
        message:
          "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
      });
    }

    const passwordResetRequest = createPasswordResetRequest();

    await setUserPasswordResetRequest({
      userId: user.id,
      tokenHash: passwordResetRequest.tokenHash,
      expiresAt: passwordResetRequest.expiresAt,
      requestedAt: passwordResetRequest.requestedAt,
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildPasswordResetUrl(getBaseUrl(request), passwordResetRequest.token),
      expiresAt: passwordResetRequest.expiresAt,
    });

    logServerEvent({
      scope: "auth:forgot-password",
      message: "password reset email requested",
      context: {
        userId: user.id,
        email: user.email,
      },
    });

    await logSecurityEvent({
      action: "auth.forgot_password.requested",
      details: {
        matchedAccount: true,
      },
      headers: request.headers,
      userId: user.id,
    });

    return NextResponse.json({
      message:
        "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
    });
  } catch (error) {
    captureServerException({
      scope: "auth:forgot-password",
      error,
      context: {
        email,
      },
    });

    return NextResponse.json(
      {
        message: getForgotPasswordErrorMessage(error),
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
