import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  createDefaultAppDataState,
  normalizeAppDataState,
  type AppDataResponse,
  type AppDataState,
} from "@/lib/app-data/defaults";
import { validateAppDataPlanLimits } from "@/lib/app-data/plan-limits";
import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AppDataRow = {
  user_id: string;
  config: AppDataState["config"];
  insumos: AppDataState["insumos"];
  saved_products: AppDataState["savedProducts"];
  sales: AppDataState["sales"];
  quotes: AppDataState["quotes"];
  updated_at: string;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildAppDataStateFromRow(row: AppDataRow | null): AppDataState {
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para acessar seus dados." },
      { status: 401 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_app_data")
      .select("user_id, config, insumos, saved_products, sales, quotes, updated_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const response: AppDataResponse = {
      data: buildAppDataStateFromRow(data as AppDataRow | null),
      source: data ? "database" : "default",
      updatedAt: (data as AppDataRow | null)?.updated_at ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Nao foi possivel carregar os dados do aplicativo.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para salvar seus dados." },
      { status: 401 },
    );
  }

  let body: Partial<AppDataState>;

  try {
    body = (await request.json()) as Partial<AppDataState>;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  const normalizedState = normalizeAppDataState(body);

  try {
    const supabase = createSupabaseServerClient();
    const { data: existingRow, error: existingRowError } = await supabase
      .from("user_app_data")
      .select("user_id, config, insumos, saved_products, sales, quotes, updated_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (existingRowError) {
      throw existingRowError;
    }

    const currentState = buildAppDataStateFromRow(existingRow as AppDataRow | null);
    const planLimitViolation = validateAppDataPlanLimits({
      currentState,
      isPremium: Boolean(session.user.isPremium),
      nextState: normalizedState,
    });

    if (planLimitViolation) {
      return NextResponse.json(
        {
          code: planLimitViolation.code,
          message: planLimitViolation.message,
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("user_app_data")
      .upsert(
        {
          user_id: session.user.id,
          config: normalizedState.config,
          insumos: normalizedState.insumos,
          saved_products: normalizedState.savedProducts,
          sales: normalizedState.sales,
          quotes: normalizedState.quotes,
        },
        {
          onConflict: "user_id",
        },
      )
      .select("updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      updatedAt: (data as { updated_at?: string } | null)?.updated_at ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Nao foi possivel salvar os dados do aplicativo.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
