import type { AnnouncementKind, AnnouncementRow, AnnouncementRecord } from "./types";

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 90;
export const ANNOUNCEMENT_MESSAGE_MAX_LENGTH = 420;
export const ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH = 40;
export const ANNOUNCEMENT_CTA_URL_MAX_LENGTH = 280;

type AnnouncementPayload = {
  title?: unknown;
  message?: unknown;
  kind?: unknown;
  ctaLabel?: unknown;
  ctaUrl?: unknown;
  endsAt?: unknown;
};

type ValidationResult =
  | {
      ok: true;
      data: {
        title: string;
        message: string;
        kind: AnnouncementKind;
        ctaLabel: string | null;
        ctaUrl: string | null;
        endsAt: string | null;
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

  return trimmedValue.slice(0, maxLength);
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, maxLength);
}

function normalizeKind(value: unknown): AnnouncementKind {
  if (value === "success" || value === "warning") {
    return value;
  }

  return "info";
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

function isValidAnnouncementCtaUrl(url: string) {
  if (url.startsWith("/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
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
  const ctaLabel = normalizeOptionalText(
    payload.ctaLabel,
    ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  );
  const ctaUrl = normalizeOptionalText(payload.ctaUrl, ANNOUNCEMENT_CTA_URL_MAX_LENGTH);
  const endsAt = normalizeIsoDateString(payload.endsAt);

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return {
      ok: false,
      message: "Preencha os dois campos do botao (texto e link) ou deixe ambos vazios.",
    };
  }

  if (ctaUrl && !isValidAnnouncementCtaUrl(ctaUrl)) {
    return {
      ok: false,
      message:
        "O link do botao precisa ser um endereco valido (https://...) ou um caminho interno do app.",
    };
  }

  return {
    ok: true,
    data: {
      title,
      message,
      kind,
      ctaLabel,
      ctaUrl,
      endsAt,
    },
  };
}

export function mapAnnouncementRow(row: AnnouncementRow): AnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    kind: row.kind,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdByUserId: row.created_by_user_id,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
