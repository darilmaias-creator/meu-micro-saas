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
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
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

type AppDataConflictResponse = {
  code: "REMOTE_STATE_CONFLICT";
  data: AppDataState;
  message: string;
  updatedAt: string | null;
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

function serializeAppDataState(state: AppDataState) {
  return JSON.stringify(normalizeAppDataState(state));
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

    logServerEvent({
      scope: "app-data:get",
      message: "app data loaded",
      context: {
        userId: session.user.id,
        source: response.source,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    captureServerException({
      scope: "app-data:get",
      error,
      context: {
        userId: session.user.id,
      },
    });
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
  const baseUpdatedAtHeader = request.headers.get("x-app-data-base-updated-at");
  const baseUpdatedAt =
    baseUpdatedAtHeader && baseUpdatedAtHeader !== "null"
      ? baseUpdatedAtHeader
      : null;

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
    const currentUpdatedAt = (existingRow as AppDataRow | null)?.updated_at ?? null;
    const planLimitViolation = validateAppDataPlanLimits({
      currentState,
      isPremium: Boolean(session.user.isPremium),
      nextState: normalizedState,
    });

    if (planLimitViolation) {
      logServerEvent({
        scope: "app-data:put",
        level: "warn",
        message: "app data save blocked by plan limits",
        context: {
          userId: session.user.id,
          code: planLimitViolation.code,
        },
      });

      return NextResponse.json(
        {
          code: planLimitViolation.code,
          message: planLimitViolation.message,
        },
        { status: 403 },
      );
    }

    const currentSerializedState = serializeAppDataState(currentState);
    const nextSerializedState = serializeAppDataState(normalizedState);
    const hasRemoteVersionConflict =
      Boolean(currentUpdatedAt) &&
      currentUpdatedAt !== baseUpdatedAt &&
      currentSerializedState !== nextSerializedState;

    if (hasRemoteVersionConflict) {
      const conflictResponse: AppDataConflictResponse = {
        code: "REMOTE_STATE_CONFLICT",
        data: currentState,
        message:
          "Seus dados foram atualizados em outro aparelho. Recarregamos a versao mais recente para evitar perda de informacoes.",
        updatedAt: currentUpdatedAt,
      };

      logServerEvent({
        scope: "app-data:put",
        level: "warn",
        message: "app data save blocked by remote state conflict",
        context: {
          userId: session.user.id,
          baseUpdatedAt,
          currentUpdatedAt,
        },
      });

      return NextResponse.json(conflictResponse, { status: 409 });
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

    logServerEvent({
      scope: "app-data:put",
      message: "app data saved",
      context: {
        userId: session.user.id,
        updatedAt: (data as { updated_at?: string } | null)?.updated_at ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      updatedAt: (data as { updated_at?: string } | null)?.updated_at ?? null,
    });
  } catch (error) {
    captureServerException({
      scope: "app-data:put",
      error,
      context: {
        userId: session.user.id,
      },
    });
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
