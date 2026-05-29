import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

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

function getClientIpHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return createHash("sha256").update(clientIp).digest("hex");
}

export async function POST(request: Request, context: RouteContext) {
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

  const supabase = createCommentsSupabaseClient();
  const reporterIpHash = getClientIpHash(request);
  const { error: reportError } = await supabase.from("comment_reports").insert({
    comment_id: commentId,
    reporter_ip_hash: reporterIpHash,
    reason: "user_report",
  });

  if (reportError && reportError.code !== "23505") {
    throw reportError;
  }

  const { data: commentData, error: findError } = await supabase
    .from("page_comments")
    .select("id, report_count")
    .eq("id", commentId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (!commentData) {
    return NextResponse.json(
      { message: "Comentario nao encontrado." },
      { status: 404 },
    );
  }

  const currentReportCount =
    (commentData as { report_count?: number | null }).report_count ?? 0;
  const nextReportCount =
    reportError?.code === "23505" ? currentReportCount : currentReportCount + 1;
  const { error: updateError } = await supabase
    .from("page_comments")
    .update({
      report_count: nextReportCount,
      status: nextReportCount >= 3 ? "pending" : "approved",
    })
    .eq("id", commentId);

  if (updateError) {
    throw updateError;
  }

  return NextResponse.json({
    message: "Obrigado. Vamos revisar esse comentario.",
    ok: true,
  });
}
