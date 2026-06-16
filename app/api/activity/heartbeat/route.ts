import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_HEARTBEAT_SECONDS = 120;

function getLocalDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Cuiaba",
    year: "numeric",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function normalizePath(value: unknown) {
  if (typeof value !== "string") {
    return "/";
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/")) {
    return "/";
  }

  return trimmed.slice(0, 200);
}

function normalizeActiveSeconds(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.min(MAX_HEARTBEAT_SECONDS, Math.round(numeric));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Você precisa estar logado para registrar atividade." },
      { status: 401 },
    );
  }

  let body: {
    activeSeconds?: unknown;
    isPageView?: unknown;
    path?: unknown;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const activeSeconds = normalizeActiveSeconds(body.activeSeconds);
  const isPageView = body.isPageView === true;
  const now = new Date().toISOString();
  const activityDate = getLocalDateKey();
  const lastPath = normalizePath(body.path);

  try {
    const supabase = createSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("user_activity")
      .select("active_seconds, page_views")
      .eq("user_id", session.user.id)
      .eq("activity_date", activityDate)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const currentActiveSeconds =
      typeof existing?.active_seconds === "number" ? existing.active_seconds : 0;
    const currentPageViews =
      typeof existing?.page_views === "number" ? existing.page_views : 0;

    const { error } = await supabase.from("user_activity").upsert(
      {
        active_seconds: currentActiveSeconds + activeSeconds,
        activity_date: activityDate,
        first_seen_at: existing ? undefined : now,
        ip_address: getClientIp(request),
        last_path: lastPath,
        last_seen_at: now,
        page_views: currentPageViews + (isPageView ? 1 : 0),
        user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
        user_id: session.user.id,
      },
      {
        onConflict: "user_id,activity_date",
      },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[activity:heartbeat]", error);

    return NextResponse.json(
      { message: "Não foi possível registrar a atividade agora." },
      { status: 500 },
    );
  }
}
