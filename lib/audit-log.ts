import "server-only";

import { createHash } from "node:crypto";

import { logServerEvent } from "@/lib/observability/server-monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLogDetails = Record<string, unknown>;
type AuditLogSeverity = "info" | "warn" | "critical";

const SENSITIVE_DETAIL_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "recaptchaToken",
  "secret",
  "authorization",
  "cookie",
]);

function getHeaderValue(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | undefined,
  key: string,
) {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const value = headers[key] ?? headers[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function hashAuditValue(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return createHash("sha256").update(trimmedValue).digest("hex");
}

function getClientIpHash(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | undefined,
) {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");
  const realIp = getHeaderValue(headers, "x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp;

  return hashAuditValue(clientIp);
}

function getUserAgentHash(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | undefined,
) {
  return hashAuditValue(getHeaderValue(headers, "user-agent"));
}

function sanitizeAuditDetails(details: AuditLogDetails) {
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key, value]) => value !== undefined && !SENSITIVE_DETAIL_KEYS.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" && value.length > 500
          ? `${value.slice(0, 500)}...`
          : value,
      ]),
  );
}

function isMissingAuditTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  return candidate.code === "42P01" || message.includes("does not exist");
}

export async function logSecurityEvent(input: {
  action: string;
  details?: AuditLogDetails;
  headers?:
    | Headers
    | Record<string, string | string[] | undefined>
    | undefined;
  severity?: AuditLogSeverity;
  userId?: string | null;
}) {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("audit_logs").insert({
      action: input.action,
      details: sanitizeAuditDetails(input.details ?? {}),
      ip_hash: getClientIpHash(input.headers),
      severity: input.severity ?? "info",
      user_agent_hash: getUserAgentHash(input.headers),
      user_id: input.userId ?? null,
    });

    if (error) {
      if (isMissingAuditTableError(error)) {
        logServerEvent({
          scope: "audit-log",
          level: "warn",
          message: "audit_logs table is not available",
          context: {
            action: input.action,
          },
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    logServerEvent({
      scope: "audit-log",
      level: "warn",
      message: "security event could not be persisted",
      context: {
        action: input.action,
        error,
      },
    });
  }
}
