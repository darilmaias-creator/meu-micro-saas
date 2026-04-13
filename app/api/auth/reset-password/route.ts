import { NextResponse } from "next/server";

import { validatePasswordForStorage } from "@/lib/auth/input-validation";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { updateUserPasswordFromReset } from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResetPasswordPayload = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

function validateResetPasswordPayload(body: ResetPasswordPayload) {
  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!token) {
    return "O link de recuperacao esta incompleto ou invalido.";
  }

  const passwordValidationMessage = validatePasswordForStorage(password);

  if (passwordValidationMessage) {
    return passwordValidationMessage.replace("A senha", "A nova senha");
  }

  if (password !== confirmPassword) {
    return "A confirmacao da senha precisa ser igual a nova senha.";
  }

  return null;
}

export async function POST(request: Request) {
  let body: ResetPasswordPayload;

  try {
    body = (await request.json()) as ResetPasswordPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  const rateLimitResult = await consumeAuthRateLimit({
    action: "reset_password",
    headers: request.headers,
  });

  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { message: rateLimitResult.message },
      { status: 429 },
    );
  }

  const validationMessage = validateResetPasswordPayload(body);

  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(body.password!);
    const result = await updateUserPasswordFromReset({
      token: body.token!.trim(),
      passwordHash,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          message:
            result.code === "EXPIRED_TOKEN"
              ? "Esse link de recuperacao expirou. Peca um novo e-mail para continuar."
              : "Esse link de recuperacao nao e mais valido.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Senha redefinida com sucesso. Agora voce ja pode entrar.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel redefinir a senha agora.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
