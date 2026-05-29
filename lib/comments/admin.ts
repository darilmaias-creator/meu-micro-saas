import "server-only";

import { createHash } from "node:crypto";

import { getAdminEmails, isAdminEmail } from "@/lib/admin/access";

function hashEmail(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function isCommentAdmin(input: {
  authorEmailHash?: string | null;
  sessionEmail?: string | null;
}) {
  if (isAdminEmail(input.sessionEmail)) {
    return true;
  }

  if (!input.authorEmailHash) {
    return false;
  }

  return getAdminEmails().some(
    (adminEmail) => hashEmail(adminEmail) === input.authorEmailHash,
  );
}
