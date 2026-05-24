const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

const CONTROL_CHARACTERS_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const SCRIPT_TAG_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_PATTERN = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const EVENT_HANDLER_ATTRIBUTE_PATTERN =
  /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URL_PATTERN =
  /\s+(href|src)\s*=\s*(["'])\s*(?:javascript|data):[^"']*\2/gi;

export function stripUnsafeControlCharacters(value: string) {
  return value.replace(CONTROL_CHARACTERS_PATTERN, "");
}

export function escapeHTML(text: string) {
  return stripUnsafeControlCharacters(text).replace(
    /[&<>"']/g,
    (char) => HTML_ESCAPE_MAP[char] ?? char,
  );
}

export function sanitizeHTML(html: string) {
  return stripUnsafeControlCharacters(html)
    .replace(SCRIPT_TAG_PATTERN, "")
    .replace(STYLE_TAG_PATTERN, "")
    .replace(EVENT_HANDLER_ATTRIBUTE_PATTERN, "")
    .replace(DANGEROUS_URL_PATTERN, "");
}

export function sanitizePlainText(value: string, maxLength?: number) {
  const sanitized = stripUnsafeControlCharacters(value).trim();

  if (!maxLength) {
    return sanitized;
  }

  return sanitized.slice(0, maxLength);
}

export function sanitizeDisplayText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return sanitizePlainText(value);
}

export function sanitizeUrl(value: string) {
  const sanitized = stripUnsafeControlCharacters(value).trim();

  if (!sanitized) {
    return null;
  }

  if (sanitized.startsWith("/") && !sanitized.startsWith("//")) {
    return sanitized;
  }

  try {
    const url = new URL(sanitized);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}
