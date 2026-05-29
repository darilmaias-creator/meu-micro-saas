import "server-only";

import { createClient } from "@supabase/supabase-js";

const commentsSupabaseUrl = process.env.COMMENTS_SUPABASE_URL?.trim();
const commentsSupabaseSecretKey =
  process.env.COMMENTS_SUPABASE_SECRET_KEY?.trim();

function normalizeSupabaseProjectUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function isCommentsDatabaseConfigured() {
  return Boolean(commentsSupabaseUrl && commentsSupabaseSecretKey);
}

export function createCommentsSupabaseClient() {
  if (!commentsSupabaseUrl) {
    throw new Error("COMMENTS_SUPABASE_URL is not configured.");
  }

  if (!commentsSupabaseSecretKey) {
    throw new Error("COMMENTS_SUPABASE_SECRET_KEY is not configured.");
  }

  return createClient(
    normalizeSupabaseProjectUrl(commentsSupabaseUrl),
    commentsSupabaseSecretKey,
    {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    },
  );
}
