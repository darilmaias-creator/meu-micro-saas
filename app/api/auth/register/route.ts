import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { createCredentialsUser } from "@/lib/auth/user-store";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

function validateRegisterPayload(body: RegisterPayload) {
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (name.length < 2) {
    return "Informe um nome com pelo menos 2 caracteres.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Informe um e-mail valido.";
  }

  if (password.length < 6) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return null;
}

export async function POST(request: Request) {
  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  const validationMessage = validateRegisterPayload(body);

  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password!);
  const user = await createCredentialsUser({
    name: body.name!.trim(),
    email: body.email!.trim(),
    passwordHash,
  });

  if (!user) {
    return NextResponse.json(
      { message: "Ja existe uma conta cadastrada com este e-mail." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      message: "Conta criada com sucesso.",
    },
    { status: 201 },
  );
}
