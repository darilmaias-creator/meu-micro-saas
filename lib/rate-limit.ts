import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type HeaderBag =
  | Headers
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

type ApiRateLimitAction =
  | "ai_assistant_gemini"
  | "billing_checkout"
  | "marketing_generate"
  | "user_suggestion";

type ApiRateLimitRule = {
  action: ApiRateLimitAction;
  blockDurationMs?: number;
  maxRequests: number;
  windowMs: number;
};

type ApiRateLimitRow = {
  action: string;
  attempts: number | null;
  blocked_until: string | null;
  created_at: string;
  key: string;
  updated_at: string;
  window_started_at: string;
};

type ApiRateLimitResult =
  | {
      ok: true;
    }
  | {
      message: string;
      ok: false;
      retryAfterSeconds: number;
    };

const RATE_LIMIT_SELECT_COLUMNS =
  "key, action, attempts, window_started_at, blocked_until, created_at, updated_at";
const API_RATE_LIMIT_RULES: Record<ApiRateLimitAction, ApiRateLimitRule> = {
  ai_assistant_gemini: {
    action: "ai_assistant_gemini",
    blockDurationMs: 15 * 60 * 1000,
    maxRequests: 60,
    windowMs: 60 * 60 * 1000,
  },
  billing_checkout: {
    action: "billing_checkout",
    blockDurationMs: 30 * 60 * 1000,
    maxRequests: 12,
    windowMs: 60 * 60 * 1000,
  },
  marketing_generate: {
    action: "marketing_generate",
    blockDurationMs: 15 * 60 * 1000,
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  },
  user_suggestion: {
    action: "user_suggestion",
    blockDurationMs: 15 * 60 * 1000,
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
};

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

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildRateLimitKey(input: {
  action: ApiRateLimitAction;
  identifier: string;
}) {
  return hashIdentifier(`${input.action}:ip:${input.identifier}`);
}

function isSupabaseRateLimitStoreEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

function mapRateLimitRow(row: ApiRateLimitRow | null | undefined) {
  if (!row) {
    return null;
  }

  return {
    attempts: row.attempts ?? 0,
    blockedUntil: row.blocked_until ?? null,
    createdAt: row.created_at,
    key: row.key,
    updatedAt: row.updated_at,
    windowStartedAt: row.window_started_at,
  };
}

function buildRateLimitMessage(retryAfterSeconds: number) {
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return `Muitas requisicoes agora. Aguarde cerca de ${retryAfterMinutes} minuto(s) antes de tentar de novo.`;
}

async function findRateLimitRecord(key: string) {
  if (!isSupabaseRateLimitStoreEnabled()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("api_rate_limits")
    .select(RATE_LIMIT_SELECT_COLUMNS)
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapRateLimitRow(data as ApiRateLimitRow | null);
}

async function persistRateLimitRecord(input: {
  action: ApiRateLimitAction;
  attempts: number;
  blockedUntil: string | null;
  createdAt: string;
  key: string;
  updatedAt: string;
  windowStartedAt: string;
}) {
  if (!isSupabaseRateLimitStoreEnabled()) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("api_rate_limits").upsert(
    {
      action: input.action,
      attempts: input.attempts,
      blocked_until: input.blockedUntil,
      created_at: input.createdAt,
      key: input.key,
      updated_at: input.updatedAt,
      window_started_at: input.windowStartedAt,
    },
    {
      onConflict: "key",
    },
  );

  if (error) {
    throw error;
  }
}

export async function consumeApiRateLimit(input: {
  action: ApiRateLimitAction;
  headers?: HeaderBag;
}): Promise<ApiRateLimitResult> {
  const rule = API_RATE_LIMIT_RULES[input.action];
  const clientIp = getClientIpFromHeaders(input.headers);
  const now = Date.now();
  const key = buildRateLimitKey({
    action: input.action,
    identifier: clientIp,
  });

  try {
    const existingRecord = await findRateLimitRecord(key);

    if (existingRecord?.blockedUntil) {
      const blockedUntilTime = new Date(existingRecord.blockedUntil).getTime();

      if (blockedUntilTime > now) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((blockedUntilTime - now) / 1000),
        );

        return {
          message: buildRateLimitMessage(retryAfterSeconds),
          ok: false,
          retryAfterSeconds,
        };
      }
    }

    const windowStartedAtTime = existingRecord
      ? new Date(existingRecord.windowStartedAt).getTime()
      : now;
    const isSameWindow =
      existingRecord && now - windowStartedAtTime < rule.windowMs;
    const attempts = isSameWindow ? existingRecord.attempts + 1 : 1;
    const windowStartedAt = isSameWindow
      ? existingRecord.windowStartedAt
      : new Date(now).toISOString();
    const blockedUntil =
      attempts > rule.maxRequests
        ? new Date(now + (rule.blockDurationMs ?? rule.windowMs)).toISOString()
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
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((new Date(blockedUntil).getTime() - now) / 1000),
      );

      return {
        message: buildRateLimitMessage(retryAfterSeconds),
        ok: false,
        retryAfterSeconds,
      };
    }
  } catch (error) {
    console.warn("[api-rate-limit:consume]", error);
  }

  return {
    ok: true,
  };
}
