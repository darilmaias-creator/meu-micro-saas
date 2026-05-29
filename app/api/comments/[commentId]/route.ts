import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json(
      { message: "Comentarios ainda nao configurados." },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json(
      { message: "Apenas administradores podem excluir comentarios." },
      { status: 403 },
    );
  }

  const { commentId } = await context.params;

  if (!commentId) {
    return NextResponse.json(
      { message: "Comentario invalido." },
      { status: 400 },
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
