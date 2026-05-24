import { NextResponse } from "next/server";

import { encryptSensitiveData } from "@/lib/crypto";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKUP_BUCKET = process.env.DATABASE_BACKUP_BUCKET ?? "database-backups";
const BACKUP_PAGE_SIZE = 1000;
const BACKUP_TABLES = [
  "auth_users",
  "user_app_data",
  "user_testimonials",
  "global_announcements",
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];
type BackupRows = Record<string, unknown>[];

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function getBackupPath(createdAt: string) {
  const date = createdAt.slice(0, 10);
  const safeTimestamp = createdAt.replace(/[:.]/g, "-");

  return `database/${date}/backup-${safeTimestamp}.json`;
}

async function fetchAllRows(table: BackupTable) {
  const supabase = createSupabaseServerClient();
  const rows: BackupRows = [];
  let page = 0;

  while (true) {
    const from = page * BACKUP_PAGE_SIZE;
    const to = from + BACKUP_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`Falha ao exportar ${table}: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...(data as BackupRows));

    if (data.length < BACKUP_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return rows;
}

async function ensureBackupBucket() {
  const supabase = createSupabaseServerClient();
  const { error: getBucketError } = await supabase.storage.getBucket(
    BACKUP_BUCKET,
  );

  if (!getBucketError) {
    return;
  }

  const { error: createBucketError } = await supabase.storage.createBucket(
    BACKUP_BUCKET,
    {
      public: false,
    },
  );

  if (createBucketError) {
    throw new Error(
      `Falha ao preparar bucket de backup: ${createBucketError.message}`,
    );
  }
}

async function saveBackupToStorage(input: {
  content: string;
  createdAt: string;
}) {
  await ensureBackupBucket();

  const supabase = createSupabaseServerClient();
  const path = getBackupPath(input.createdAt);
  const { error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(path, Buffer.from(input.content, "utf8"), {
      cacheControl: "no-store",
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha ao salvar backup no Storage: ${error.message}`);
  }

  return {
    bucket: BACKUP_BUCKET,
    path,
  };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const createdAt = new Date().toISOString();

  try {
    const exportedTables = await Promise.all(
      BACKUP_TABLES.map(async (table) => {
        const rows = await fetchAllRows(table);

        return [table, rows] as const;
      }),
    );
    const tables = Object.fromEntries(exportedTables) as Record<
      BackupTable,
      BackupRows
    >;
    const encryptedPayload = encryptSensitiveData(
      JSON.stringify({
        createdAt,
        tables,
      }),
    );
    const backupFile = JSON.stringify(
      {
        algorithm: "aes-256-gcm",
        createdAt,
        encrypted: true,
        format: "calcula-artesao-database-backup",
        tables: BACKUP_TABLES,
        version: 1,
        payload: encryptedPayload,
      },
      null,
      2,
    );
    const storage = await saveBackupToStorage({
      content: backupFile,
      createdAt,
    });
    const counts = Object.fromEntries(
      BACKUP_TABLES.map((table) => [table, tables[table].length]),
    );

    logServerEvent({
      scope: "cron:backup-database",
      message: "database backup finished",
      context: {
        counts,
        storage,
      },
    });

    return NextResponse.json({
      ok: true,
      createdAt,
      counts,
      storage,
    });
  } catch (error) {
    captureServerException({
      scope: "cron:backup-database",
      error,
      context: {
        createdAt,
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
