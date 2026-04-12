import { NextResponse } from "next/server";

import {
  findUserByEmail,
  setUserPasswordResetRequest,
} from "@/lib/auth/user-store";
import {
  buildPasswordResetUrl,
  createPasswordResetRequest,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ForgotPasswordPayload = {
  email?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getBaseUrl(request: Request) {
  return process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
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

  const email = body.email?.trim().toLowerCase() ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { message: "Informe um e-mail valido para recuperar a senha." },
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !user.passwordHash) {
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

    return NextResponse.json({
      message:
        "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel iniciar a recuperacao de senha agora.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
