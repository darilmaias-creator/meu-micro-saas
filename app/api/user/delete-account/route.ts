import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logSecurityEvent } from "@/lib/audit-log";
import { authOptions } from "@/lib/auth/options";
import { deleteUserById, findUserById } from "@/lib/auth/user-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DELETE_CONFIRMATION_TEXT = "EXCLUIR";

type DeleteAccountPayload = {
  confirmationText?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

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

    await logSecurityEvent({
      action: "lgpd.account_erasure.requested",
      details: {
        email: user.email,
      },
      headers: request.headers,
      severity: "critical",
      userId,
    });

    await deleteUserById(userId);

    return NextResponse.json({
      message: "Conta deletada com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel excluir a conta agora.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
