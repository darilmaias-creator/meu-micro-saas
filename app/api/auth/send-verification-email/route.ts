import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
} from "@/lib/auth/email-verification";
import { sendEmailVerificationEmail } from "@/lib/auth/email-verification-email";
import { markEmailVerificationSent } from "@/lib/auth/email-verification-store";
import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl(request: Request) {
  return process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
}

function getVerificationEmailErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido na verificacao.";

  if (message.includes("NEXTAUTH_SECRET")) {
    return "O segredo de autenticacao ainda nao esta configurado.";
  }

  if (message.includes("RESEND_API_KEY")) {
    return "A chave da Resend ainda nao foi configurada para enviar e-mails.";
  }

  if (message.includes("RESEND_FROM_EMAIL")) {
    return "O remetente da Resend ainda nao foi configurado.";
  }

  return "Nao foi possivel enviar o e-mail de verificacao agora.";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para confirmar seu e-mail." },
      { status: 401 },
    );
  }

  try {
    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    const token = createEmailVerificationToken({
      email: user.email,
      userId: user.id,
    });
    const verificationUrl = buildEmailVerificationUrl(getBaseUrl(request), token);

    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });
    await markEmailVerificationSent(user.id);

    logServerEvent({
      scope: "auth:send-verification-email",
      message: "email verification requested",
      context: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Enviamos um link de confirmacao para seu e-mail.",
    });
  } catch (error) {
    captureServerException({
      scope: "auth:send-verification-email",
      error,
      context: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: getVerificationEmailErrorMessage(error),
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
