import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markUserEmailVerified(input: {
  email: string;
  userId: string;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SECRET_KEY?.trim()
  ) {
    return {
      ok: false as const,
      message:
        "A verificacao persistente de e-mail exige Supabase configurado.",
    };
  }

  const verifiedAt = new Date().toISOString();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("auth_users")
    .update({
      email_verification_token_sent_at: null,
      email_verified_at: verifiedAt,
    })
    .eq("id", input.userId)
    .eq("email", input.email);

  if (error) {
    return {
      ok: false as const,
      message: error.message,
    };
  }

  return {
    ok: true as const,
    verifiedAt,
  };
}

export async function markEmailVerificationSent(userId: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SECRET_KEY?.trim()
  ) {
    return;
  }

  const supabase = createSupabaseServerClient();
  await supabase
    .from("auth_users")
    .update({
      email_verification_token_sent_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
