import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  createDefaultAppDataState,
  normalizeAppDataState,
  type AppDataState,
} from "@/lib/app-data/defaults";
import { authOptions } from "@/lib/auth/options";
import {
  deleteUserById,
  findUserById,
} from "@/lib/auth/user-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DELETE_CONFIRMATION_TEXT = "EXCLUIR";

type AppDataRow = {
  config: AppDataState["config"];
  insumos: AppDataState["insumos"];
  saved_products: AppDataState["savedProducts"];
  sales: AppDataState["sales"];
  quotes: AppDataState["quotes"];
  updated_at: string;
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

function buildAppDataStateFromRow(row: AppDataRow | null) {
  if (!row) {
    return createDefaultAppDataState();
  }

  return normalizeAppDataState({
    config: row.config,
    insumos: row.insumos,
    savedProducts: row.saved_products,
    sales: row.sales,
    quotes: row.quotes,
  });
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
    const [user, appDataResponse] = await Promise.all([
      findUserById(userId),
      createSupabaseServerClient()
        .from("user_app_data")
        .select("config, insumos, saved_products, sales, quotes, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    if (appDataResponse.error) {
      throw appDataResponse.error;
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        plan: user.plan,
        authProviders: user.authProviders,
        freeNameChangesUsed: user.freeNameChangesUsed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      appData: buildAppDataStateFromRow(appDataResponse.data as AppDataRow | null),
      appDataUpdatedAt:
        (appDataResponse.data as AppDataRow | null)?.updated_at ?? null,
    });
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
