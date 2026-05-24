import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { isAdminEmail } from "@/lib/admin/access";
import { logSecurityEvent } from "@/lib/audit-log";
import { authOptions } from "@/lib/auth/options";
import { decryptSensitiveData } from "@/lib/crypto";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKUP_BUCKET = process.env.DATABASE_BACKUP_BUCKET ?? "database-backups";
const EXPECTED_BACKUP_TABLES = [
  "auth_users",
  "audit_logs",
  "user_app_data",
  "user_testimonials",
  "global_announcements",
] as const;

type BackupManifest = {
  algorithm?: unknown;
  createdAt?: unknown;
  encrypted?: unknown;
  format?: unknown;
  payload?: unknown;
  tables?: unknown;
  version?: unknown;
};

type BackupPayload = {
  createdAt?: unknown;
  tables?: unknown;
};

type BackupTableCounts = Record<(typeof EXPECTED_BACKUP_TABLES)[number], number>;

async function ensureAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Voce precisa estar logado para testar backups." },
        { status: 401 },
      ),
    };
  }

  if (!isAdminEmail(session.user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Apenas administradores podem testar backups." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

async function findLatestBackupPath() {
  const supabase = createSupabaseServerClient();
  const { data: dateFolders, error: foldersError } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list("database", {
      limit: 30,
      sortBy: { column: "name", order: "desc" },
    });

  if (foldersError) {
    throw new Error(`Falha ao listar pasta de backups: ${foldersError.message}`);
  }

  const folders = (dateFolders ?? [])
    .filter((item) => !item.name.endsWith(".json"))
    .map((item) => item.name)
    .sort()
    .reverse();

  for (const folder of folders) {
    const folderPath = `database/${folder}`;
    const { data: files, error: filesError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list(folderPath, {
        limit: 50,
        sortBy: { column: "name", order: "desc" },
      });

    if (filesError) {
      throw new Error(`Falha ao listar ${folderPath}: ${filesError.message}`);
    }

    const latestFile = (files ?? [])
      .map((item) => item.name)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .reverse()[0];

    if (latestFile) {
      return `${folderPath}/${latestFile}`;
    }
  }

  return null;
}

function validateBackupManifest(value: unknown): BackupManifest {
  if (!value || typeof value !== "object") {
    throw new Error("Manifesto do backup invalido.");
  }

  const manifest = value as BackupManifest;

  if (manifest.format !== "calcula-artesao-database-backup") {
    throw new Error("Formato do backup nao reconhecido.");
  }

  if (manifest.version !== 1) {
    throw new Error("Versao do backup nao suportada.");
  }

  if (manifest.algorithm !== "aes-256-gcm" || manifest.encrypted !== true) {
    throw new Error("Backup precisa estar criptografado com aes-256-gcm.");
  }

  if (typeof manifest.payload !== "string") {
    throw new Error("Payload criptografado nao encontrado.");
  }

  return manifest;
}

function validateBackupPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("Conteudo descriptografado do backup invalido.");
  }

  const payload = value as BackupPayload;

  if (typeof payload.createdAt !== "string") {
    throw new Error("Data de criacao do backup nao encontrada.");
  }

  if (!payload.tables || typeof payload.tables !== "object") {
    throw new Error("Tabelas do backup nao encontradas.");
  }

  const tables = payload.tables as Record<string, unknown>;
  const counts = {} as BackupTableCounts;

  for (const table of EXPECTED_BACKUP_TABLES) {
    if (!Array.isArray(tables[table])) {
      throw new Error(`Tabela ${table} ausente ou invalida no backup.`);
    }

    counts[table] = tables[table].length;
  }

  return {
    createdAt: payload.createdAt,
    counts,
  };
}

async function downloadLatestBackup() {
  const path = await findLatestBackupPath();

  if (!path) {
    throw new Error("Nenhum arquivo de backup foi encontrado no Storage.");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BACKUP_BUCKET).download(path);

  if (error) {
    throw new Error(`Falha ao baixar backup: ${error.message}`);
  }

  return {
    path,
    text: await data.text(),
  };
}

export async function GET(request: Request) {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  try {
    const backupFile = await downloadLatestBackup();
    const manifest = validateBackupManifest(JSON.parse(backupFile.text));
    const decrypted = decryptSensitiveData(manifest.payload as string);
    const validation = validateBackupPayload(JSON.parse(decrypted));

    await logSecurityEvent({
      action: "backup.restore_test.success",
      details: {
        backupCreatedAt: validation.createdAt,
        bucket: BACKUP_BUCKET,
        counts: validation.counts,
        path: backupFile.path,
      },
      headers: request.headers,
      userId: adminSession.session.user.id,
    });

    logServerEvent({
      scope: "admin:backup-restore-test",
      message: "backup restore test finished",
      context: {
        backupCreatedAt: validation.createdAt,
        counts: validation.counts,
        path: backupFile.path,
        userId: adminSession.session.user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Backup mais recente baixado, descriptografado e validado sem restaurar dados em producao.",
      backup: {
        bucket: BACKUP_BUCKET,
        path: backupFile.path,
        createdAt: validation.createdAt,
        counts: validation.counts,
      },
    });
  } catch (error) {
    await logSecurityEvent({
      action: "backup.restore_test.failed",
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
      headers: request.headers,
      severity: "warn",
      userId: adminSession.session.user.id,
    });

    captureServerException({
      scope: "admin:backup-restore-test",
      error,
      context: {
        userId: adminSession.session.user.id,
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
