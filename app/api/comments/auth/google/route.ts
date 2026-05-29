import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  COMMENT_AUTHOR_COOKIE,
  commentAuthorCookieOptions,
  createCommentAuthorToken,
} from "@/lib/comments/session";
import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";
import { sanitizePlainText, sanitizeUrl } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

function getGoogleClientId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    null
  );
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getCommentAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Nao foi possivel entrar para comentar.";
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  if (
    candidate.code === "42P01" ||
    message.includes("comment_authors") ||
    message.includes("does not exist")
  ) {
    return "As tabelas de comentarios ainda nao foram criadas no Supabase.";
  }

  if (
    candidate.code === "42501" ||
    message.toLowerCase().includes("permission") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return "A chave de comentarios precisa ser a service_role/secret key do Supabase.";
  }

  return "Nao foi possivel entrar para comentar agora.";
}

async function verifyGoogleCredential(credential: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      credential,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;
  const clientId = getGoogleClientId();

  if (!clientId || tokenInfo.aud !== clientId || !tokenInfo.sub) {
    return null;
  }

  return tokenInfo;
}

export async function POST(request: Request) {
  try {
    if (!isCommentsDatabaseConfigured()) {
      return NextResponse.json(
        { message: "Comentarios ainda nao configurados." },
        { status: 503 },
      );
    }

    let body: { credential?: unknown };

    try {
      body = (await request.json()) as { credential?: unknown };
    } catch {
      return NextResponse.json(
        { message: "Nao foi possivel ler o login do Google." },
        { status: 400 },
      );
    }

    if (typeof body.credential !== "string" || !body.credential.trim()) {
      return NextResponse.json(
        { message: "Login do Google incompleto." },
        { status: 400 },
      );
    }

    const googleUser = await verifyGoogleCredential(body.credential.trim());

    if (!googleUser) {
      return NextResponse.json(
        {
          message:
            "Nao foi possivel validar sua conta Google. Confira se o GOOGLE_CLIENT_ID e o mesmo do botao de comentarios.",
        },
        { status: 401 },
      );
    }

    const supabase = createCommentsSupabaseClient();
    const googleSubHash = hashValue(googleUser.sub!);
    const emailHash = googleUser.email ? hashValue(googleUser.email) : null;
    const displayName =
      sanitizePlainText(googleUser.name || "Visitante", 80) || "Visitante";
    const avatarUrl = googleUser.picture ? sanitizeUrl(googleUser.picture) : null;
    const now = new Date().toISOString();
    const { data: existingAuthor, error: findError } = await supabase
      .from("comment_authors")
      .select("id")
      .eq("google_sub_hash", googleSubHash)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    const authorId =
      (existingAuthor as { id?: string } | null)?.id ?? randomUUID();
    const { error: upsertError } = await supabase.from("comment_authors").upsert(
      {
        id: authorId,
        google_sub_hash: googleSubHash,
        email_hash: emailHash,
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: now,
        created_at: now,
      },
      {
        onConflict: "google_sub_hash",
      },
    );

    if (upsertError) {
      throw upsertError;
    }

    const response = NextResponse.json({
      author: {
        id: authorId,
        displayName,
        avatarUrl,
      },
      ok: true,
    });

    response.cookies.set(
      COMMENT_AUTHOR_COOKIE,
      createCommentAuthorToken(authorId),
      commentAuthorCookieOptions,
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: getCommentAuthErrorMessage(error) },
      { status: 500 },
    );
  }
}
