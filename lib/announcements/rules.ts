import type {
  AnnouncementAudience,
  AnnouncementKind,
  AnnouncementRow,
  AnnouncementRecord,
} from "./types";
import { sanitizePlainText, sanitizeUrl } from "@/lib/sanitize";

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 90;
export const ANNOUNCEMENT_MESSAGE_MAX_LENGTH = 420;
export const ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH = 40;
export const ANNOUNCEMENT_CTA_URL_MAX_LENGTH = 280;
export const ANNOUNCEMENT_TARGET_EMAILS_MAX_COUNT = 60;

type AnnouncementPayload = {
  title?: unknown;
  message?: unknown;
  kind?: unknown;
  audience?: unknown;
  targetEmails?: unknown;
  ctaLabel?: unknown;
  ctaUrl?: unknown;
  endsAt?: unknown;
  sendEmailUsers?: unknown;
};

type ValidationResult =
  | {
      ok: true;
      data: {
        title: string;
        message: string;
        kind: AnnouncementKind;
        audience: AnnouncementAudience;
        targetEmails: string[];
        ctaLabel: string | null;
        ctaUrl: string | null;
        endsAt: string | null;
        sendEmailUsers: boolean;
      };
    }
  | {
      ok: false;
      message: string;
    };

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return sanitizePlainText(trimmedValue, maxLength);
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return sanitizePlainText(trimmedValue, maxLength);
}

function normalizeKind(value: unknown): AnnouncementKind {
  if (value === "success" || value === "warning") {
    return value;
  }

  return "info";
}

function normalizeAudience(value: unknown): AnnouncementAudience {
  if (value === "selected") {
    return "selected";
  }

  return "all";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeTargetEmails(value: unknown) {
  const values =
    typeof value === "string"
      ? value
          .split(/[\n,;]+/g)
          .map((entry) => entry.trim().toLowerCase())
      : Array.isArray(value)
        ? value
            .map((entry) =>
              typeof entry === "string" ? entry.trim().toLowerCase() : "",
            )
        : [];

  const uniqueEmails = Array.from(new Set(values.filter(Boolean)));

  return uniqueEmails
    .filter(isValidEmail)
    .slice(0, ANNOUNCEMENT_TARGET_EMAILS_MAX_COUNT);
}

function normalizeIsoDateString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function normalizeBoolean(value: unknown, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  return defaultValue;
}

function isValidAnnouncementCtaUrl(url: string) {
  return Boolean(sanitizeUrl(url));
}

export function validateAnnouncementPayload(
  payload: AnnouncementPayload,
): ValidationResult {
  const title = normalizeRequiredText(payload.title, ANNOUNCEMENT_TITLE_MAX_LENGTH);

  if (!title) {
    return {
      ok: false,
      message: "Informe um titulo curto para o aviso.",
    };
  }

  const message = normalizeRequiredText(
    payload.message,
    ANNOUNCEMENT_MESSAGE_MAX_LENGTH,
  );

  if (!message) {
    return {
      ok: false,
      message: "Informe a mensagem do aviso para os usuarios.",
    };
  }

  const kind = normalizeKind(payload.kind);
  const audience = normalizeAudience(payload.audience);
  const targetEmails = normalizeTargetEmails(payload.targetEmails);
  const ctaLabel = normalizeOptionalText(
    payload.ctaLabel,
    ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  );
  const rawCtaUrl = normalizeOptionalText(
    payload.ctaUrl,
    ANNOUNCEMENT_CTA_URL_MAX_LENGTH,
  );
  const ctaUrl = rawCtaUrl ? sanitizeUrl(rawCtaUrl) : null;
  const endsAt = normalizeIsoDateString(payload.endsAt);
  const sendEmailUsers = normalizeBoolean(payload.sendEmailUsers, false);

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return {
      ok: false,
      message: "Preencha os dois campos do botao (texto e link) ou deixe ambos vazios.",
    };
  }

  if (rawCtaUrl && !isValidAnnouncementCtaUrl(rawCtaUrl)) {
    return {
      ok: false,
      message:
        "O link do botao precisa ser um endereco valido (https://...) ou um caminho interno do app.",
    };
  }

  if (audience === "selected" && targetEmails.length === 0) {
    return {
      ok: false,
      message:
        "Para aviso direcionado, informe pelo menos um e-mail valido de destino.",
    };
  }

  return {
    ok: true,
    data: {
      title,
      message,
      kind,
      audience,
      targetEmails: audience === "selected" ? targetEmails : [],
      ctaLabel,
      ctaUrl,
      endsAt,
      sendEmailUsers,
    },
  };
}

export function isAnnouncementVisibleForEmail(input: {
  audience: AnnouncementAudience | null | undefined;
  targetEmails: string[] | null | undefined;
  userEmail: string | null | undefined;
}) {
  if (input.audience !== "selected") {
    return true;
  }

  const userEmail = input.userEmail?.trim().toLowerCase() ?? "";
  if (!userEmail) {
    return false;
  }

  const targets = (input.targetEmails ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return targets.includes(userEmail);
}

export function mapAnnouncementRow(row: AnnouncementRow): AnnouncementRecord {
  const audience = row.audience === "selected" ? "selected" : "all";
  const targetEmails = Array.isArray(row.target_emails)
    ? row.target_emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0)
    : [];

  return {
    id: row.id,
    title: sanitizePlainText(row.title, ANNOUNCEMENT_TITLE_MAX_LENGTH),
    message: sanitizePlainText(row.message, ANNOUNCEMENT_MESSAGE_MAX_LENGTH),
    kind: row.kind,
    audience,
    targetEmails: audience === "selected" ? targetEmails : [],
    ctaLabel: row.cta_label
      ? sanitizePlainText(row.cta_label, ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH)
      : null,
    ctaUrl: row.cta_url ? sanitizeUrl(row.cta_url) : null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdByUserId: row.created_by_user_id,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
