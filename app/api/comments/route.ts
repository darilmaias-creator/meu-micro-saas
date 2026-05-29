import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import {
  COMMENT_AUTHOR_COOKIE,
  parseCommentAuthorToken,
} from "@/lib/comments/session";
import { isCommentAdmin } from "@/lib/comments/admin";
import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";
import {
  normalizeCommentContent,
  normalizeCommentPagePath,
} from "@/lib/comments/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COMMENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const COMMENT_RATE_LIMIT_MAX_ATTEMPTS = 5;

type CommentRow = {
  id: string;
  page_path: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string | null;
  content: string;
  report_count: number | null;
  created_at: string;
  updated_at: string;
};

function getClientIpHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return createHash("sha256").update(clientIp).digest("hex");
}

async function consumeCommentRateLimit(input: {
  authorId: string;
  ipHash: string;
  pagePath: string;
}) {
  const supabase = createCommentsSupabaseClient();
  const now = Date.now();
  const windowStartedAt = new Date(now - COMMENT_RATE_LIMIT_WINDOW_MS).toISOString();
  const key = createHash("sha256")
    .update(`${input.authorId}:${input.ipHash}:${input.pagePath}`)
    .digest("hex");
  const { data: existing, error: findError } = await supabase
    .from("comment_rate_limits")
    .select("key, attempts, window_started_at")
    .eq("key", key)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  const row = existing as
    | { attempts: number | null; window_started_at: string | null }
    | null;
  const shouldReset =
    !row ||
    !row.window_started_at ||
    new Date(row.window_started_at).getTime() < new Date(windowStartedAt).getTime();
  const attempts = shouldReset ? 1 : (row.attempts ?? 0) + 1;

  if (!shouldReset && attempts > COMMENT_RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  const { error: upsertError } = await supabase.from("comment_rate_limits").upsert(
    {
      key,
      action: "create_comment",
      attempts,
      window_started_at: shouldReset ? new Date().toISOString() : row.window_started_at,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "key",
    },
  );

  if (upsertError) {
    throw upsertError;
  }

  return true;
}

async function getCurrentCommentAuthor() {
  const cookieStore = await cookies();
  const authorSession = parseCommentAuthorToken(
    cookieStore.get(COMMENT_AUTHOR_COOKIE)?.value,
  );

  if (!authorSession) {
    return null;
  }

  const supabase = createCommentsSupabaseClient();
  const { data, error } = await supabase
    .from("comment_authors")
    .select("id, display_name, avatar_url, email_hash")
    .eq("id", authorSession.authorId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as {
    avatar_url: string | null;
    display_name: string;
    email_hash: string | null;
    id: string;
  };
}

async function getCurrentCommentPermissions() {
  const [author, session] = await Promise.all([
    getCurrentCommentAuthor(),
    getServerSession(authOptions),
  ]);

  return {
    author,
    isAdmin: isCommentAdmin({
      authorEmailHash: author?.email_hash,
      sessionEmail: session?.user?.email,
    }),
  };
}

function formatCommentForClient(
  comment: CommentRow,
  permissions: { authorId?: string | null; isAdmin: boolean },
) {
  const isOwner = Boolean(
    permissions.authorId && permissions.authorId === comment.author_id,
  );

  return {
    id: comment.id,
    authorName: comment.author_display_name,
    authorAvatarUrl: comment.author_avatar_url,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    reportCount: comment.report_count ?? 0,
    canEdit: isOwner,
    canDelete: isOwner || permissions.isAdmin,
  };
}

export async function GET(request: Request) {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json({
      comments: [],
      enabled: false,
    });
  }

  const url = new URL(request.url);
  const pagePath = normalizeCommentPagePath(url.searchParams.get("page"));

  if (!pagePath) {
    return NextResponse.json(
      { message: "Pagina de comentarios invalida." },
      { status: 400 },
    );
  }

  const supabase = createCommentsSupabaseClient();
  const { author, isAdmin } = await getCurrentCommentPermissions();
  const { data, error } = await supabase
    .from("page_comments")
    .select(
      "id, page_path, author_id, author_display_name, author_avatar_url, content, report_count, created_at, updated_at",
    )
    .eq("page_path", pagePath)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  const comments = ((data as CommentRow[] | null) ?? []).map((comment) =>
    formatCommentForClient(comment, {
      authorId: author?.id,
      isAdmin,
    }),
  );

  return NextResponse.json({
    comments,
    enabled: true,
  });
}

export async function POST(request: Request) {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json(
      { message: "Comentarios ainda nao configurados." },
      { status: 503 },
    );
  }

  const author = await getCurrentCommentAuthor();

  if (!author) {
    return NextResponse.json(
      { message: "Use o Google para comentar com seu nome." },
      { status: 401 },
    );
  }

  let body: { content?: unknown; pagePath?: unknown };

  try {
    body = (await request.json()) as { content?: unknown; pagePath?: unknown };
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler o comentario." },
      { status: 400 },
    );
  }

  const pagePath = normalizeCommentPagePath(body.pagePath);
  const content = normalizeCommentContent(body.content);

  if (!pagePath || !content) {
    return NextResponse.json(
      { message: "Escreva um comentario de 3 a 500 caracteres." },
      { status: 400 },
    );
  }

  const allowed = await consumeCommentRateLimit({
    authorId: author.id,
    ipHash: getClientIpHash(request),
    pagePath,
  });

  if (!allowed) {
    return NextResponse.json(
      { message: "Muitos comentarios em pouco tempo. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const supabase = createCommentsSupabaseClient();
  const { data, error } = await supabase
    .from("page_comments")
    .insert({
      page_path: pagePath,
      author_id: author.id,
      author_display_name: author.display_name,
      author_avatar_url: author.avatar_url,
      content,
      status: "approved",
    })
    .select(
      "id, page_path, author_id, author_display_name, author_avatar_url, content, report_count, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  const comment = data as CommentRow;

  return NextResponse.json(
    {
      comment: formatCommentForClient(comment, {
        authorId: author.id,
        isAdmin: false,
      }),
      ok: true,
    },
    { status: 201 },
  );
}
