import { NextResponse } from "next/server";

import { logSecurityEvent } from "@/lib/audit-log";
import {
  normalizeEmailInput,
  normalizeNameInput,
  validateEmailAddress,
  validateName,
  validatePasswordForStorage,
} from "@/lib/auth/input-validation";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { createCredentialsUser } from "@/lib/auth/user-store";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
} from "@/lib/auth/email-verification";
import { sendEmailVerificationEmail } from "@/lib/auth/email-verification-email";
import { markEmailVerificationSent } from "@/lib/auth/email-verification-store";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

function getBaseUrl(request: Request) {
  return process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
}

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
  recaptchaToken?: string | null;
};

function validateRegisterPayload(body: RegisterPayload) {
  const name = normalizeNameInput(body.name);
  const email = normalizeEmailInput(body.email);
  const password = body.password ?? "";

  const nameValidationMessage = validateName(name);

  if (nameValidationMessage) {
    return nameValidationMessage;
  }

  const emailValidationMessage = validateEmailAddress(email);

  if (emailValidationMessage) {
    return emailValidationMessage;
  }

  const passwordValidationMessage = validatePasswordForStorage(password);

  if (passwordValidationMessage) {
    return passwordValidationMessage;
  }

  return null;
}

function getRegisterErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido no cadastro.";

  if (
    message.includes("auth_users") ||
    message.includes("relation") ||
    message.includes("does not exist")
  ) {
    return "A tabela de usuários ainda não foi criada no Supabase.";
  }

  if (message.includes("SUPABASE_SECRET_KEY")) {
    return "A chave secreta do Supabase não está configurada na Vercel.";
  }

  if (message.includes("NEXT_PUBLIC_SUPABASE_URL")) {
    return "A URL do Supabase não está configurada na Vercel.";
  }

  return "Não foi possível criar sua conta agora.";
}

export async function POST(request: Request) {
  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler os dados enviados." },
      { status: 400 },
    );
  }

  const rateLimitResult = await consumeAuthRateLimit({
    action: "register",
    email: body.email,
    headers: request.headers,
  });

  if (!rateLimitResult.ok) {
    await logSecurityEvent({
      action: "auth.register.rate_limited",
      details: {
        email: normalizeEmailInput(body.email),
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
      action: "auth.register.captcha_failed",
      details: {
        email: normalizeEmailInput(body.email),
      },
      headers: request.headers,
      severity: "warn",
    });
    return NextResponse.json(
      { message: recaptchaResult.message },
      { status: 400 },
    );
  }

  const validationMessage = validateRegisterPayload(body);

  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(body.password!);
    const user = await createCredentialsUser({
      name: normalizeNameInput(body.name),
      email: normalizeEmailInput(body.email),
      passwordHash,
    });

    if (!user) {
      await logSecurityEvent({
        action: "auth.register.duplicate_email",
        details: {
          email: normalizeEmailInput(body.email),
        },
        headers: request.headers,
        severity: "warn",
      });
      return NextResponse.json(
        { message: "Ja existe uma conta cadastrada com este e-mail." },
        { status: 409 },
      );
    }

    let verificationEmailSent = false;

    try {
      const token = createEmailVerificationToken({
        email: user.email,
        userId: user.id,
      });

      await sendEmailVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: buildEmailVerificationUrl(getBaseUrl(request), token),
      });
      await markEmailVerificationSent(user.id);
      verificationEmailSent = true;
    } catch (verificationError) {
      console.warn("[auth:register:email-verification]", verificationError);
    }

    await logSecurityEvent({
      action: "auth.register.success",
      details: {
        verificationEmailSent,
      },
      headers: request.headers,
      userId: user.id,
    });

    return NextResponse.json(
      {
        message: verificationEmailSent
          ? "Conta criada com sucesso. Enviamos um e-mail de confirmação."
          : "Conta criada com sucesso. Entre na sua área e reenvie o e-mail de confirmação.",
        verificationEmailSent,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getRegisterErrorMessage(error),
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
