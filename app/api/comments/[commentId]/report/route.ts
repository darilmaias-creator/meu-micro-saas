import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";
import { sanitizePlainText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

const REPORT_REASON_MAX_LENGTH = 120;

function getClientIpHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return createHash("sha256").update(clientIp).digest("hex");
}

function normalizeReportReason(value: unknown) {
  if (typeof value !== "string") {
    return "user_report";
  }

  return sanitizePlainText(value, REPORT_REASON_MAX_LENGTH) || "user_report";
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

  let body: { reason?: unknown } = {};

  try {
    body = (await request.json()) as { reason?: unknown };
  } catch {
    body = {};
  }

  const supabase = createCommentsSupabaseClient();
  const reporterIpHash = getClientIpHash(request);
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

  const { error: reportError } = await supabase.from("comment_reports").insert({
    comment_id: commentId,
    reporter_ip_hash: reporterIpHash,
    reason: normalizeReportReason(body.reason),
  });

  if (reportError?.code === "23505") {
    return NextResponse.json(
      {
        message: "Voce ja denunciou este comentario.",
        ok: true,
      },
      { status: 200 },
    );
  }

  if (reportError) {
    throw reportError;
  }

  const currentReportCount =
    (commentData as { report_count?: number | null }).report_count ?? 0;
  const nextReportCount = currentReportCount + 1;
  const nextStatus = nextReportCount >= 3 ? "pending" : "approved";
  const { error: updateError } = await supabase
    .from("page_comments")
    .update({
      report_count: nextReportCount,
      status: nextStatus,
    })
    .eq("id", commentId);

  if (updateError) {
    throw updateError;
  }

  return NextResponse.json({
    hidden: nextStatus === "pending",
    message: "Obrigado. Vamos revisar esse comentario.",
    ok: true,
    reportCount: nextReportCount,
  });
}
