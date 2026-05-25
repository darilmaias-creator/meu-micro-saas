import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isMissingVerificationColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  return (
    candidate.code === "42703" ||
    message.includes("email_verified_at") ||
    message.includes("email_verification_token_sent_at")
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para verificar seu e-mail." },
      { status: 401 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("auth_users")
      .select("email_verified_at")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      if (isMissingVerificationColumnError(error)) {
        return NextResponse.json(
          {
            emailVerified: false,
            schemaMissing: true,
            message:
              "As colunas de verificacao de e-mail ainda nao existem no Supabase. Rode o schema.sql atualizado.",
          },
          { status: 409 },
        );
      }

      throw error;
    }

    const row = data as { email_verified_at?: string | null } | null;
    const emailVerifiedAt = row?.email_verified_at ?? null;

    return NextResponse.json({
      emailVerified: Boolean(emailVerifiedAt),
      emailVerifiedAt,
      schemaMissing: false,
    });
  } catch {
    return NextResponse.json(
      {
        emailVerified: false,
        message: "Nao foi possivel verificar o status do e-mail agora.",
      },
      { status: 500 },
    );
  }
}
