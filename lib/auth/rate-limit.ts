import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeEmailInput } from "@/lib/auth/input-validation";

type HeaderBag =
  | Headers
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

type AuthRateLimitAction =
  | "login"
  | "register"
  | "forgot_password"
  | "reset_password";
type AuthRateLimitScope = "ip" | "email";

type StoredRateLimitRecord = {
  action: AuthRateLimitAction;
  attempts: number;
  blockedUntil: string | null;
  createdAt: string;
  key: string;
  updatedAt: string;
  windowStartedAt: string;
};

type AuthRateLimitRow = {
  action: string;
  attempts: number | null;
  blocked_until: string | null;
  created_at: string;
  key: string;
  updated_at: string;
  window_started_at: string;
};

type AuthRateLimitRule = {
  blockDurationMs: number;
  maxAttempts: number;
  scope: AuthRateLimitScope;
  windowMs: number;
};

type AuthRateLimitResult =
  | {
      ok: true;
    }
  | {
      message: string;
      ok: false;
      retryAfterSeconds: number;
    };

const dataDirectory = path.join(process.cwd(), "data");
const rateLimitFilePath = path.join(dataDirectory, "auth-rate-limits.json");
const RATE_LIMIT_SELECT_COLUMNS =
  "key, action, attempts, window_started_at, blocked_until, created_at, updated_at";
const RATE_LIMIT_RULES: Record<AuthRateLimitAction, AuthRateLimitRule[]> = {
  forgot_password: [
    {
      blockDurationMs: 60 * 60 * 1000,
      maxAttempts: 3,
      scope: "email",
      windowMs: 60 * 60 * 1000,
    },
    {
      blockDurationMs: 30 * 60 * 1000,
      maxAttempts: 10,
      scope: "ip",
      windowMs: 30 * 60 * 1000,
    },
  ],
  login: [
    {
      blockDurationMs: 15 * 60 * 1000,
      maxAttempts: 5,
      scope: "email",
      windowMs: 15 * 60 * 1000,
    },
    {
      blockDurationMs: 15 * 60 * 1000,
      maxAttempts: 15,
      scope: "ip",
      windowMs: 15 * 60 * 1000,
    },
  ],
  register: [
    {
      blockDurationMs: 60 * 60 * 1000,
      maxAttempts: 3,
      scope: "email",
      windowMs: 60 * 60 * 1000,
    },
    {
      blockDurationMs: 30 * 60 * 1000,
      maxAttempts: 8,
      scope: "ip",
      windowMs: 30 * 60 * 1000,
    },
  ],
  reset_password: [
    {
      blockDurationMs: 30 * 60 * 1000,
      maxAttempts: 10,
      scope: "ip",
      windowMs: 30 * 60 * 1000,
    },
  ],
};

function logRateLimitWarning(context: string, error: unknown) {
  console.warn(`[auth-rate-limit:${context}]`, error);
}

function isSupabaseRateLimitStoreEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

function getHeaderValue(headers: HeaderBag, headerName: string) {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(headerName);
  }

  const value = headers[headerName] ?? headers[headerName.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getClientIpFromHeaders(headers: HeaderBag) {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    getHeaderValue(headers, "x-real-ip")?.trim() ||
    getHeaderValue(headers, "cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function buildRateLimitKey(input: {
  action: AuthRateLimitAction;
  identifier: string;
  scope: AuthRateLimitScope;
}) {
  return createHash("sha256")
    .update(`${input.action}:${input.scope}:${input.identifier}`)
    .digest("hex");
}

function mapRateLimitRow(row: AuthRateLimitRow | null | undefined) {
  if (!row) {
    return null;
  }

  return {
    action:
      row.action === "login" ||
      row.action === "register" ||
      row.action === "forgot_password" ||
      row.action === "reset_password"
        ? row.action
        : "login",
    attempts: row.attempts ?? 0,
    blockedUntil: row.blocked_until ?? null,
    createdAt: row.created_at,
    key: row.key,
    updatedAt: row.updated_at,
    windowStartedAt: row.window_started_at,
  } satisfies StoredRateLimitRecord;
}

function buildRateLimitRow(record: StoredRateLimitRecord) {
  return {
    action: record.action,
    attempts: record.attempts,
    blocked_until: record.blockedUntil,
    created_at: record.createdAt,
    key: record.key,
    updated_at: record.updatedAt,
    window_started_at: record.windowStartedAt,
  };
}

async function ensureRateLimitFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(rateLimitFilePath, "utf8");
  } catch {
    await writeFile(rateLimitFilePath, "[]", "utf8");
  }
}

async function readRateLimitsFromFile() {
  try {
    await ensureRateLimitFile();

    const fileContents = await readFile(rateLimitFilePath, "utf8");
    const parsed = JSON.parse(fileContents);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((record) => {
        if (!record || typeof record !== "object") {
          return null;
        }

        const candidate = record as Partial<StoredRateLimitRecord>;

        if (
          !candidate.key ||
          !candidate.createdAt ||
          !candidate.updatedAt ||
          !candidate.windowStartedAt
        ) {
          return null;
        }

        return {
          action:
            candidate.action === "register" ||
            candidate.action === "forgot_password" ||
            candidate.action === "reset_password"
              ? candidate.action
              : "login",
          attempts:
            typeof candidate.attempts === "number" ? candidate.attempts : 0,
          blockedUntil:
            typeof candidate.blockedUntil === "string"
              ? candidate.blockedUntil
              : null,
          createdAt: candidate.createdAt,
          key: candidate.key,
          updatedAt: candidate.updatedAt,
          windowStartedAt: candidate.windowStartedAt,
        } satisfies StoredRateLimitRecord;
      })
      .filter((record): record is StoredRateLimitRecord => record !== null);
  } catch (error) {
    logRateLimitWarning("read-file", error);
    return [];
  }
}

async function writeRateLimitsToFile(records: StoredRateLimitRecord[]) {
  await ensureRateLimitFile();
  await writeFile(rateLimitFilePath, JSON.stringify(records, null, 2), "utf8");
}

async function findSupabaseRateLimitRecord(key: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auth_rate_limits")
    .select(RATE_LIMIT_SELECT_COLUMNS)
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapRateLimitRow(data as AuthRateLimitRow | null);
}

async function upsertSupabaseRateLimitRecord(record: StoredRateLimitRecord) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("auth_rate_limits")
    .upsert(buildRateLimitRow(record), {
      onConflict: "key",
    });

  if (error) {
    throw error;
  }
}

async function deleteSupabaseRateLimitRecord(key: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("auth_rate_limits").delete().eq("key", key);

  if (error) {
    throw error;
  }
}

async function findRateLimitRecord(key: string) {
  if (isSupabaseRateLimitStoreEnabled()) {
    return findSupabaseRateLimitRecord(key);
  }

  const records = await readRateLimitsFromFile();
  return records.find((record) => record.key === key) ?? null;
}

async function persistRateLimitRecord(record: StoredRateLimitRecord) {
  if (isSupabaseRateLimitStoreEnabled()) {
    await upsertSupabaseRateLimitRecord(record);
    return;
  }

  const records = await readRateLimitsFromFile();
  const existingRecordIndex = records.findIndex(
    (currentRecord) => currentRecord.key === record.key,
  );

  if (existingRecordIndex >= 0) {
    records[existingRecordIndex] = record;
  } else {
    records.push(record);
  }

  await writeRateLimitsToFile(records);
}

async function removeRateLimitRecord(key: string) {
  if (isSupabaseRateLimitStoreEnabled()) {
    await deleteSupabaseRateLimitRecord(key);
    return;
  }

  const records = await readRateLimitsFromFile();
  const nextRecords = records.filter((record) => record.key !== key);

  if (nextRecords.length !== records.length) {
    await writeRateLimitsToFile(nextRecords);
  }
}

async function consumeRateLimitRule(input: {
  action: AuthRateLimitAction;
  identifier: string;
  rule: AuthRateLimitRule;
}) {
  const now = Date.now();
  const key = buildRateLimitKey({
    action: input.action,
    identifier: input.identifier,
    scope: input.rule.scope,
  });

  const existingRecord = await findRateLimitRecord(key);

  if (existingRecord?.blockedUntil) {
    const blockedUntilTime = new Date(existingRecord.blockedUntil).getTime();

    if (blockedUntilTime > now) {
      return {
        ok: false as const,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((blockedUntilTime - now) / 1000),
        ),
      };
    }
  }

  const windowStartedAtTime = existingRecord
    ? new Date(existingRecord.windowStartedAt).getTime()
    : now;
  const isSameWindow =
    existingRecord && now - windowStartedAtTime < input.rule.windowMs;
  const attempts = isSameWindow ? existingRecord.attempts + 1 : 1;
  const windowStartedAt = isSameWindow
    ? existingRecord.windowStartedAt
    : new Date(now).toISOString();
  const blockedUntil =
    attempts > input.rule.maxAttempts
      ? new Date(now + input.rule.blockDurationMs).toISOString()
      : null;
  const createdAt = existingRecord?.createdAt ?? new Date(now).toISOString();

  await persistRateLimitRecord({
    action: input.action,
    attempts,
    blockedUntil,
    createdAt,
    key,
    updatedAt: new Date(now).toISOString(),
    windowStartedAt,
  });

  if (blockedUntil) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((new Date(blockedUntil).getTime() - now) / 1000),
      ),
    };
  }

  return {
    ok: true as const,
  };
}

function buildRateLimitMessage(input: {
  action: AuthRateLimitAction;
  retryAfterSeconds: number;
}) {
  const retryAfterMinutes = Math.max(1, Math.ceil(input.retryAfterSeconds / 60));

  switch (input.action) {
    case "login":
      return `Muitas tentativas de login agora. Aguarde cerca de ${retryAfterMinutes} minuto(s) antes de tentar de novo.`;
    case "register":
      return `Muitas tentativas de cadastro agora. Aguarde cerca de ${retryAfterMinutes} minuto(s) antes de tentar de novo.`;
    case "forgot_password":
      return `Muitos pedidos de recuperacao de senha agora. Aguarde cerca de ${retryAfterMinutes} minuto(s) antes de tentar de novo.`;
    case "reset_password":
      return `Muitas tentativas de redefinicao de senha agora. Aguarde cerca de ${retryAfterMinutes} minuto(s) antes de tentar de novo.`;
    default:
      return "Muitas tentativas agora. Aguarde alguns minutos antes de tentar novamente.";
  }
}

function buildRateLimitIdentifiers(input: {
  email?: string | null;
  headers?: HeaderBag;
}) {
  return {
    email: normalizeEmailInput(input.email),
    ip: getClientIpFromHeaders(input.headers),
  };
}

export async function consumeAuthRateLimit(input: {
  action: AuthRateLimitAction;
  email?: string | null;
  headers?: HeaderBag;
}): Promise<AuthRateLimitResult> {
  const identifiers = buildRateLimitIdentifiers(input);
  const rules = RATE_LIMIT_RULES[input.action];

  try {
    for (const rule of rules) {
      const identifier =
        rule.scope === "email" ? identifiers.email : identifiers.ip;

      if (!identifier) {
        continue;
      }

      const result = await consumeRateLimitRule({
        action: input.action,
        identifier,
        rule,
      });

      if (!result.ok) {
        return {
          message: buildRateLimitMessage({
            action: input.action,
            retryAfterSeconds: result.retryAfterSeconds,
          }),
          ok: false,
          retryAfterSeconds: result.retryAfterSeconds,
        };
      }
    }
  } catch (error) {
    logRateLimitWarning("consume", error);
  }

  return {
    ok: true,
  };
}

export async function clearAuthRateLimit(input: {
  action: AuthRateLimitAction;
  email?: string | null;
  headers?: HeaderBag;
}) {
  const identifiers = buildRateLimitIdentifiers(input);
  const rules = RATE_LIMIT_RULES[input.action];

  try {
    await Promise.all(
      rules.map(async (rule) => {
        const identifier =
          rule.scope === "email" ? identifiers.email : identifiers.ip;

        if (!identifier) {
          return;
        }

        await removeRateLimitRecord(
          buildRateLimitKey({
            action: input.action,
            identifier,
            scope: rule.scope,
          }),
        );
      }),
    );
  } catch (error) {
    logRateLimitWarning("clear", error);
  }
}
