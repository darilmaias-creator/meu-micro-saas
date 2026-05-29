import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
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
import { normalizeCommentContent } from "@/lib/comments/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

type CommentRow = {
  id: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string | null;
  content: string;
  report_count: number | null;
  created_at: string;
  updated_at: string;
};

async function getCurrentActor() {
  const [cookieStore, session] = await Promise.all([
    cookies(),
    getServerSession(authOptions),
  ]);
  const authorSession = parseCommentAuthorToken(
    cookieStore.get(COMMENT_AUTHOR_COOKIE)?.value,
  );

  const authorId = authorSession?.authorId ?? null;
  const supabase = createCommentsSupabaseClient();
  const { data: author } = authorId
    ? await supabase
        .from("comment_authors")
        .select("email_hash")
        .eq("id", authorId)
        .maybeSingle()
    : { data: null };

  return {
    authorId,
    isAdmin: isCommentAdmin({
      authorEmailHash: (author as { email_hash?: string | null } | null)?.email_hash,
      sessionEmail: session?.user?.email,
    }),
  };
}

async function getCommentOrResponse(commentId: string) {
  const supabase = createCommentsSupabaseClient();
  const { data, error } = await supabase
    .from("page_comments")
    .select(
      "id, author_id, author_display_name, author_avatar_url, content, report_count, created_at, updated_at",
    )
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      response: NextResponse.json(
        { message: "Comentario nao encontrado." },
        { status: 404 },
      ),
    };
  }

  return {
    comment: data as CommentRow,
  };
}

function canEditComment(comment: CommentRow, actor: Awaited<ReturnType<typeof getCurrentActor>>) {
  return actor.authorId === comment.author_id;
}

function canDeleteComment(
  comment: CommentRow,
  actor: Awaited<ReturnType<typeof getCurrentActor>>,
) {
  return actor.isAdmin || actor.authorId === comment.author_id;
}

function formatCommentForClient(
  comment: CommentRow,
  actor: Awaited<ReturnType<typeof getCurrentActor>>,
) {
  return {
    id: comment.id,
    authorName: comment.author_display_name,
    authorAvatarUrl: comment.author_avatar_url,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    reportCount: comment.report_count ?? 0,
    canEdit: canEditComment(comment, actor),
    canDelete: canDeleteComment(comment, actor),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json(
      { message: "Comentarios ainda nao configurados." },
      { status: 503 },
    );
  }

  const { commentId } = await context.params;

  if (!commentId) {
    return NextResponse.json(
      { message: "Comentario invalido." },
      { status: 400 },
    );
  }

  const { comment, response } = await getCommentOrResponse(commentId);

  if (response) {
    return response;
  }

  const actor = await getCurrentActor();

  if (!canEditComment(comment, actor)) {
    return NextResponse.json(
      { message: "Voce so pode editar comentarios que publicou." },
      { status: 403 },
    );
  }

  let body: { content?: unknown };

  try {
    body = (await request.json()) as { content?: unknown };
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler o comentario." },
      { status: 400 },
    );
  }

  const content = normalizeCommentContent(body.content);

  if (!content) {
    return NextResponse.json(
      { message: "Escreva um comentario de 3 a 500 caracteres." },
      { status: 400 },
    );
  }

  const supabase = createCommentsSupabaseClient();
  const { data, error } = await supabase
    .from("page_comments")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select(
      "id, author_id, author_display_name, author_avatar_url, content, report_count, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return NextResponse.json({
    comment: formatCommentForClient(data as CommentRow, actor),
    ok: true,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json(
      { message: "Comentarios ainda nao configurados." },
      { status: 503 },
    );
  }

  const { commentId } = await context.params;

  if (!commentId) {
    return NextResponse.json(
      { message: "Comentario invalido." },
      { status: 400 },
    );
  }

  const { comment, response } = await getCommentOrResponse(commentId);

  if (response) {
    return response;
  }

  const actor = await getCurrentActor();

  if (!canDeleteComment(comment, actor)) {
    return NextResponse.json(
      { message: "Voce so pode excluir seus comentarios." },
      { status: 403 },
    );
  }

  const supabase = createCommentsSupabaseClient();
  const { error } = await supabase.from("page_comments").delete().eq("id", commentId);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    ok: true,
  });
}
