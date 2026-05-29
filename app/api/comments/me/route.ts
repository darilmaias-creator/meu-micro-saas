import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COMMENT_AUTHOR_COOKIE, parseCommentAuthorToken } from "@/lib/comments/session";
import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isCommentsDatabaseConfigured()) {
    return NextResponse.json({ author: null, enabled: false });
  }

  const cookieStore = await cookies();
  const authorSession = parseCommentAuthorToken(
    cookieStore.get(COMMENT_AUTHOR_COOKIE)?.value,
  );

  if (!authorSession) {
    return NextResponse.json({ author: null, enabled: true });
  }

  const supabase = createCommentsSupabaseClient();
  const { data, error } = await supabase
    .from("comment_authors")
    .select("id, display_name, avatar_url")
    .eq("id", authorSession.authorId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ author: null, enabled: true });
  }

  const author = data as {
    avatar_url: string | null;
    display_name: string;
    id: string;
  };

  return NextResponse.json({
    author: {
      id: author.id,
      avatarUrl: author.avatar_url,
      displayName: author.display_name,
    },
    enabled: true,
  });
}
