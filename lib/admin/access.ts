import "server-only";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getAdminEmails() {
  const rawValue = process.env.ADMIN_EMAILS ?? "";

  return rawValue
    .split(",")
    .map(normalizeEmail)
    .filter((email) => email.length > 0);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const normalized = normalizeEmail(email);

  return getAdminEmails().includes(normalized);
}
