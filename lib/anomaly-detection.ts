import "server-only";

import { logSecurityEvent } from "@/lib/audit-log";
import { findUserById } from "@/lib/auth/user-store";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { sendSecurityAlertEmail } from "@/lib/security-alert-email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LOGIN_IP_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_BURST_WINDOW_MS = 5 * 60 * 1000;
const ALERT_DEDUP_WINDOW_MS = 60 * 60 * 1000;
const LOGIN_IP_THRESHOLD = 3;
const REQUEST_BURST_THRESHOLD = 100;

type AuditLogRow = {
  action: string;
  created_at: string;
  details: Record<string, unknown> | null;
  ip_hash: string | null;
  user_id: string | null;
};

type AnomalyKind = "multiple_login_ips" | "request_burst";

type DetectedAnomaly = {
  description: string;
  details: Record<string, unknown>;
  kind: AnomalyKind;
  severity: "warn" | "critical";
};

function getIsoDate(msAgo: number) {
  return new Date(Date.now() - msAgo).toISOString();
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

async function hasRecentAlert(input: {
  kind: AnomalyKind;
  userId: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("details")
    .eq("user_id", input.userId)
    .eq("action", "security.anomaly_alert.sent")
    .gte("created_at", getIsoDate(ALERT_DEDUP_WINDOW_MS))
    .limit(20);

  if (error) {
    if (isMissingAuditTableError(error)) {
      return true;
    }

    throw error;
  }

  return ((data as Pick<AuditLogRow, "details">[] | null) ?? []).some(
    (row) => row.details?.kind === input.kind,
  );
}

async function fetchUserAuditRows(input: {
  sinceIso: string;
  userId: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("action, created_at, details, ip_hash, user_id")
    .eq("user_id", input.userId)
    .gte("created_at", input.sinceIso)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (isMissingAuditTableError(error)) {
      return [];
    }

    throw error;
  }

  return ((data as AuditLogRow[] | null) ?? []).filter(
    (row) => row.user_id === input.userId,
  );
}

async function sendAnomalyAlert(input: {
  anomaly: DetectedAnomaly;
  userId: string;
}) {
  if (
    await hasRecentAlert({
      kind: input.anomaly.kind,
      userId: input.userId,
    })
  ) {
    return false;
  }

  const user = await findUserById(input.userId);

  await logSecurityEvent({
    action: "security.anomaly_detected",
    details: {
      ...input.anomaly.details,
      description: input.anomaly.description,
      kind: input.anomaly.kind,
    },
    severity: input.anomaly.severity,
    userId: input.userId,
  });

  if (user) {
    try {
      await sendSecurityAlertEmail({
        to: user.email,
        name: user.name,
        description: input.anomaly.description,
      });
    } catch (error) {
      captureServerException({
        scope: "security:anomaly-email",
        error,
        context: {
          anomalyKind: input.anomaly.kind,
          userId: input.userId,
        },
      });
    }
  }

  await logSecurityEvent({
    action: "security.anomaly_alert.sent",
    details: {
      kind: input.anomaly.kind,
      emailSent: Boolean(user),
    },
    severity: input.anomaly.severity,
    userId: input.userId,
  });

  return true;
}

export async function detectAnomalies(userId: string) {
  const sinceIso = getIsoDate(LOGIN_IP_WINDOW_MS);
  const rows = await fetchUserAuditRows({
    sinceIso,
    userId,
  });
  const loginRows = rows.filter((row) => row.action === "auth.login.success");
  const uniqueLoginIpHashes = new Set(
    loginRows.map((row) => row.ip_hash).filter(Boolean),
  );
  const burstSince = new Date(Date.now() - REQUEST_BURST_WINDOW_MS).getTime();
  const recentRows = rows.filter(
    (row) => new Date(row.created_at).getTime() >= burstSince,
  );
  const anomalies: DetectedAnomaly[] = [];

  if (uniqueLoginIpHashes.size > LOGIN_IP_THRESHOLD) {
    anomalies.push({
      kind: "multiple_login_ips",
      severity: "critical",
      description:
        "Detectamos logins de varios locais/dispositivos diferentes em menos de 1 hora.",
      details: {
        loginCount: loginRows.length,
        uniqueIpHashCount: uniqueLoginIpHashes.size,
        windowMinutes: 60,
      },
    });
  }

  if (recentRows.length > REQUEST_BURST_THRESHOLD) {
    anomalies.push({
      kind: "request_burst",
      severity: "warn",
      description:
        "Detectamos muitas acoes na sua conta em poucos minutos.",
      details: {
        requestCount: recentRows.length,
        threshold: REQUEST_BURST_THRESHOLD,
        windowMinutes: 5,
      },
    });
  }

  const alertsSent = await Promise.all(
    anomalies.map((anomaly) =>
      sendAnomalyAlert({
        anomaly,
        userId,
      }),
    ),
  );

  return {
    alertsSent: alertsSent.filter(Boolean).length,
    anomalies,
    checkedRows: rows.length,
    userId,
  };
}

export async function detectAnomaliesForRecentUsers() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("user_id")
    .not("user_id", "is", null)
    .gte("created_at", getIsoDate(LOGIN_IP_WINDOW_MS))
    .limit(1000);

  if (error) {
    if (isMissingAuditTableError(error)) {
      return {
        alertsSent: 0,
        checkedUsers: 0,
        results: [],
      };
    }

    throw error;
  }

  const userIds = Array.from(
    new Set(
      ((data as Pick<AuditLogRow, "user_id">[] | null) ?? [])
        .map((row) => row.user_id)
        .filter((candidate): candidate is string => Boolean(candidate)),
    ),
  );
  const results = [];
  let alertsSent = 0;

  for (const userId of userIds) {
    try {
      const result = await detectAnomalies(userId);
      alertsSent += result.alertsSent;
      results.push(result);
    } catch (error) {
      captureServerException({
        scope: "security:detect-anomalies:user",
        error,
        context: {
          userId,
        },
      });
    }
  }

  logServerEvent({
    scope: "security:detect-anomalies",
    message: "anomaly detection finished",
    context: {
      alertsSent,
      checkedUsers: userIds.length,
    },
  });

  return {
    alertsSent,
    checkedUsers: userIds.length,
    results,
  };
}
