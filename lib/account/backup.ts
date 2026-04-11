import "server-only";

import {
  createDefaultAppDataState,
  normalizeAppDataState,
  type AppDataState,
} from "@/lib/app-data/defaults";
import type { StoredUser } from "@/lib/auth/user-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountBackupPayload = {
  exportedAt: string;
  account: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    plan: StoredUser["plan"];
    authProviders: StoredUser["authProviders"];
    freeNameChangesUsed: number;
    backupEmail: string | null;
    backupFrequency: StoredUser["backupFrequency"];
    backupLastSentAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  appData: AppDataState;
  appDataUpdatedAt: string | null;
};

type AppDataRow = {
  config: AppDataState["config"];
  insumos: AppDataState["insumos"];
  saved_products: AppDataState["savedProducts"];
  sales: AppDataState["sales"];
  quotes: AppDataState["quotes"];
  updated_at: string;
};

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

export async function getBackupPayloadForUser(
  user: StoredUser,
): Promise<AccountBackupPayload> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_app_data")
    .select("config, insumos, saved_products, sales, quotes, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const appDataRow = data as AppDataRow | null;

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      plan: user.plan,
      authProviders: user.authProviders,
      freeNameChangesUsed: user.freeNameChangesUsed,
      backupEmail: user.backupEmail ?? null,
      backupFrequency: user.backupFrequency,
      backupLastSentAt: user.backupLastSentAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    appData: buildAppDataStateFromRow(appDataRow),
    appDataUpdatedAt: appDataRow?.updated_at ?? null,
  };
}

export function buildBackupFileName(date = new Date()) {
  const safeIso = date.toISOString().replaceAll(":", "-");
  return `backup-calculadora-do-produtor-${safeIso}.json`;
}
