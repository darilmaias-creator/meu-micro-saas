import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  isValidBackupFrequency,
  normalizeBackupFrequency,
} from "@/lib/account/backup-config";
import { getBackupPayloadForUser } from "@/lib/account/backup";
import { authOptions } from "@/lib/auth/options";
import {
  deleteUserById,
  findUserById,
  getSessionUserFromStoredUser,
  updateUserBackupSettings,
} from "@/lib/auth/user-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DELETE_CONFIRMATION_TEXT = "EXCLUIR";

type UpdateBackupSettingsPayload = {
  backupEmail?: string | null;
  backupFrequency?: string;
};

type DeleteAccountPayload = {
  confirmationText?: string;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);

  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para exportar seus dados." },
      { status: 401 },
    );
  }

  try {
    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    return NextResponse.json(await getBackupPayloadForUser(user));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel exportar os dados da conta.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para atualizar o backup." },
      { status: 401 },
    );
  }

  let body: UpdateBackupSettingsPayload;

  try {
    body = (await request.json()) as UpdateBackupSettingsPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados de backup enviados." },
      { status: 400 },
    );
  }

  const backupEmail = body.backupEmail?.trim().toLowerCase() ?? "";
  const backupFrequency = normalizeBackupFrequency(body.backupFrequency);

  if (
    body.backupFrequency !== undefined &&
    !isValidBackupFrequency(body.backupFrequency)
  ) {
    return NextResponse.json(
      { message: "A frequencia escolhida para o backup nao e valida." },
      { status: 400 },
    );
  }

  if (
    backupEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backupEmail)
  ) {
    return NextResponse.json(
      { message: "Informe um e-mail valido para receber os backups." },
      { status: 400 },
    );
  }

  if (backupFrequency !== "off" && !backupEmail) {
    return NextResponse.json(
      {
        message:
          "Informe um e-mail para receber os backups automaticos antes de ativar a frequencia.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await updateUserBackupSettings({
      userId,
      backupEmail: backupEmail || null,
      backupFrequency,
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message:
        backupFrequency === "off"
          ? "Backup automatico desativado com sucesso."
          : "Preferencias de backup automatico salvas com sucesso.",
      user: getSessionUserFromStoredUser(result.user),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel salvar as preferencias de backup agora.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para excluir a conta." },
      { status: 401 },
    );
  }

  let body: DeleteAccountPayload;

  try {
    body = (await request.json()) as DeleteAccountPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler a confirmacao da exclusao." },
      { status: 400 },
    );
  }

  if (body.confirmationText?.trim().toUpperCase() !== DELETE_CONFIRMATION_TEXT) {
    return NextResponse.json(
      {
        message:
          'Para excluir a conta, digite exatamente "EXCLUIR" no campo de confirmacao.',
      },
      { status: 400 },
    );
  }

  try {
    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { error: deleteAppDataError } = await supabase
      .from("user_app_data")
      .delete()
      .eq("user_id", userId);

    if (deleteAppDataError) {
      throw deleteAppDataError;
    }

    await deleteUserById(userId);

    return NextResponse.json({
      message: "Sua conta e os dados vinculados foram excluidos com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel excluir a conta agora.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
