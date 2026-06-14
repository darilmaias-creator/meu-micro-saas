import { NextResponse } from "next/server";

import { verifyEmailVerificationToken } from "@/lib/auth/email-verification";
import { markUserEmailVerified } from "@/lib/auth/email-verification-store";
import { findUserById } from "@/lib/auth/user-store";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type VerifyEmailPayload = {
  token?: string;
};

async function verifyEmailToken(token: string) {
  const payload = verifyEmailVerificationToken(token);

  if (!payload) {
    return {
      ok: false as const,
      message: "Esse link de confirmação expirou ou não é mais válido.",
    };
  }

  const user = await findUserById(payload.userId);

  if (!user || user.email !== payload.email) {
    return {
      ok: false as const,
      message: "Não encontramos uma conta válida para este link.",
    };
  }

  const result = await markUserEmailVerified({
    email: payload.email,
    userId: payload.userId,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      message:
        result.message.includes("email_verified_at") ||
        result.message.includes("email_verification_token_sent_at")
          ? "As colunas de verificação de e-mail ainda não foram criadas no Supabase. Rode o schema.sql atualizado."
          : "Não foi possível confirmar o e-mail agora.",
    };
  }

  logServerEvent({
    scope: "auth:verify-email",
    message: "email verified",
    context: {
      userId: payload.userId,
    },
  });

  return {
    ok: true as const,
    message: "E-mail confirmado com sucesso.",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";

  try {
    const result = token
      ? await verifyEmailToken(token)
      : {
          ok: false as const,
          message: "O link de confirmação está incompleto.",
        };
    const redirectUrl = new URL("/entrar", request.url);
    redirectUrl.searchParams.set(
      "emailVerified",
      result.ok ? "success" : "error",
    );

    if (!result.ok) {
      redirectUrl.searchParams.set("message", result.message);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    captureServerException({
      scope: "auth:verify-email:get",
      error,
    });

    const redirectUrl = new URL("/entrar", request.url);
    redirectUrl.searchParams.set("emailVerified", "error");
    redirectUrl.searchParams.set(
      "message",
      "Não foi possível confirmar o e-mail agora.",
    );
    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(request: Request) {
  let body: VerifyEmailPayload;

  try {
    body = (await request.json()) as VerifyEmailPayload;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler os dados enviados." },
      { status: 400 },
    );
  }

  const token = body.token?.trim() ?? "";

  if (!token) {
    return NextResponse.json(
      { message: "Informe o token de verificacao." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyEmailToken(token);

    return NextResponse.json(
      { message: result.message },
      { status: result.ok ? 200 : 400 },
    );
  } catch (error) {
    captureServerException({
      scope: "auth:verify-email:post",
      error,
    });

    return NextResponse.json(
      { message: "Não foi possível confirmar o e-mail agora." },
      { status: 500 },
    );
  }
}
