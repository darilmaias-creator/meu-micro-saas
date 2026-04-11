import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getBackupPayloadForUser } from "@/lib/account/backup";
import { sendBackupEmail } from "@/lib/account/backup-email";
import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SendBackupEmailPayload = {
  backupEmail?: string;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para enviar o backup por e-mail." },
      { status: 401 },
    );
  }

  try {
    let body: SendBackupEmailPayload = {};

    try {
      body = (await request.json()) as SendBackupEmailPayload;
    } catch {
      body = {};
    }

    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    const requestedEmail = body.backupEmail?.trim().toLowerCase() ?? "";
    const destinationEmail = requestedEmail || user.backupEmail?.trim() || user.email;

    if (!destinationEmail) {
      return NextResponse.json(
        { message: "Defina um e-mail para receber o backup antes de enviar." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinationEmail)) {
      return NextResponse.json(
        { message: "Informe um e-mail valido para receber o backup." },
        { status: 400 },
      );
    }

    const payload = await getBackupPayloadForUser(user);
    await sendBackupEmail({
      to: destinationEmail,
      payload,
    });

    return NextResponse.json({
      message: `Backup enviado com sucesso para ${destinationEmail}.`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel enviar o backup por e-mail agora.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
