import "server-only";

import * as Sentry from "@sentry/nextjs";

type MonitoringContext = Record<string, unknown>;
type MonitoringLevel = "info" | "warn" | "error";

function normalizeContextValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.map(normalizeContextValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nestedValue]) => [key, normalizeContextValue(nestedValue)])
        .filter(([, nestedValue]) => nestedValue !== undefined),
    );
  }

  return value;
}

function normalizeContext(context?: MonitoringContext) {
  if (!context) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(context)
      .map(([key, value]) => [key, normalizeContextValue(value)])
      .filter(([, value]) => value !== undefined),
  );
}

export function logServerEvent(input: {
  scope: string;
  message: string;
  level?: MonitoringLevel;
  context?: MonitoringContext;
}) {
  const level = input.level ?? "info";
  const payload = {
    scope: input.scope,
    message: input.message,
    timestamp: new Date().toISOString(),
    ...normalizeContext(input.context),
  };

  if (level === "error") {
    console.error(`[${input.scope}] ${input.message}`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[${input.scope}] ${input.message}`, payload);
    return;
  }

  console.info(`[${input.scope}] ${input.message}`, payload);
}

export function captureServerException(input: {
  scope: string;
  error: unknown;
  message?: string;
  context?: MonitoringContext;
}) {
  const message =
    input.message ??
    (input.error instanceof Error ? input.error.message : String(input.error));
  const context = normalizeContext(input.context);

  console.error(
    `[${input.scope}] ${message}`,
    {
      scope: input.scope,
      timestamp: new Date().toISOString(),
      ...context,
    },
    input.error,
  );

  Sentry.withScope((sentryScope) => {
    sentryScope.setTag("server.scope", input.scope);
    sentryScope.setLevel("error");

    Object.entries(context).forEach(([key, value]) => {
      sentryScope.setExtra(key, value);
    });

    if (input.error instanceof Error) {
      Sentry.captureException(input.error);
      return;
    }

    Sentry.captureException(new Error(message));
  });
}
