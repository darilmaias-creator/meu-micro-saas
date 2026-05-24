import { NextResponse } from "next/server";

import { captureServerException, logServerEvent } from "@/lib/observability/server-monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RETENTION_DAYS = 90;
const AUDIT_RETENTION_DAYS = 365;
const CLEANUP_TARGETS = {
  access_logs: "created_at",
  api_rate_limits: "updated_at",
  auth_rate_limits: "updated_at",
  audit_logs: "created_at",
} as const;

type CleanupTable = keyof typeof CLEANUP_TARGETS;

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  return candidate.code === "42P01" || message.includes("does not exist");
}

async function deleteOlderThan(input: {
  cutoffIso: string;
  table: CleanupTable;
}) {
  const column = CLEANUP_TARGETS[input.table];
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from(input.table)
    .delete()
    .lt(column, input.cutoffIso);

  if (error) {
    if (isMissingTableError(error)) {
      return {
        skipped: true,
        table: input.table,
      };
    }

    throw error;
  }

  return {
    skipped: false,
    table: input.table,
  };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cutoffIso = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const auditCutoffIso = new Date(
    Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const results = await Promise.all([
      deleteOlderThan({
        cutoffIso,
        table: "access_logs",
      }),
      deleteOlderThan({
        cutoffIso,
        table: "api_rate_limits",
      }),
      deleteOlderThan({
        cutoffIso,
        table: "auth_rate_limits",
      }),
      deleteOlderThan({
        cutoffIso: auditCutoffIso,
        table: "audit_logs",
      }),
    ]);

    logServerEvent({
      scope: "cron:cleanup-old-logs",
      message: "old temporary logs cleanup finished",
      context: {
        cutoffIso,
        auditCutoffIso,
        auditRetentionDays: AUDIT_RETENTION_DAYS,
        retentionDays: RETENTION_DAYS,
        results,
      },
    });

    return NextResponse.json({
      ok: true,
      cutoffIso,
      auditCutoffIso,
      auditRetentionDays: AUDIT_RETENTION_DAYS,
      retentionDays: RETENTION_DAYS,
      results,
    });
  } catch (error) {
    captureServerException({
      scope: "cron:cleanup-old-logs",
      error,
      context: {
        cutoffIso,
        auditCutoffIso,
        auditRetentionDays: AUDIT_RETENTION_DAYS,
        retentionDays: RETENTION_DAYS,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
