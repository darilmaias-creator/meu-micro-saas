import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import {
  mapAnnouncementRow,
  validateAnnouncementPayload,
} from "@/lib/announcements/rules";
import type { AnnouncementRow } from "@/lib/announcements/types";
import {
  captureServerException,
  logServerEvent,
} from "@/lib/observability/server-monitoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DeactivateAnnouncementPayload = {
  id?: unknown;
};

function isAnnouncementActiveNow(row: AnnouncementRow, now: Date) {
  const startsAt = new Date(row.starts_at);
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;

  if (Number.isNaN(startsAt.getTime())) {
    return false;
  }

  if (startsAt.getTime() > now.getTime()) {
    return false;
  }

  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() < now.getTime()) {
    return false;
  }

  return row.is_active;
}

function getAnnouncementPayloadError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
}

async function ensureAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Voce precisa estar logado para gerenciar avisos." },
        { status: 401 },
      ),
    };
  }

  if (!isAdminEmail(session.user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Apenas administradores podem gerenciar avisos globais." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export async function GET() {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("global_announcements")
      .select(
        "id, title, message, kind, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      throw error;
    }

    const rows = (data as AnnouncementRow[] | null) ?? [];
    const now = new Date();
    const activeAnnouncement = rows.find((row) => isAnnouncementActiveNow(row, now));

    return NextResponse.json({
      ok: true,
      activeAnnouncement: activeAnnouncement
        ? mapAnnouncementRow(activeAnnouncement)
        : null,
      recentAnnouncements: rows.map(mapAnnouncementRow),
    });
  } catch (error) {
    captureServerException({
      scope: "announcements:manage:get",
      error,
      context: {
        userId: adminSession.session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Nao foi possivel carregar os avisos agora." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados do aviso." },
      { status: 400 },
    );
  }

  const validation = validateAnnouncementPayload(body);

  if (!validation.ok) {
    return NextResponse.json(
      {
        message: validation.message,
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const adminEmail = adminSession.session.user.email?.toLowerCase() ?? "";
    const { data: deactivatedRows, error: deactivateError } = await supabase
      .from("global_announcements")
      .update({ is_active: false })
      .eq("is_active", true)
      .select("id");

    if (deactivateError) {
      throw deactivateError;
    }

    const { data, error } = await supabase
      .from("global_announcements")
      .insert({
        id: randomUUID(),
        title: validation.data.title,
        message: validation.data.message,
        kind: validation.data.kind,
        cta_label: validation.data.ctaLabel,
        cta_url: validation.data.ctaUrl,
        starts_at: new Date().toISOString(),
        ends_at: validation.data.endsAt,
        is_active: true,
        created_by_user_id: adminSession.session.user.id,
        created_by_email: adminEmail,
      })
      .select(
        "id, title, message, kind, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    logServerEvent({
      scope: "announcements:manage:post",
      message: "announcement published",
      context: {
        userId: adminSession.session.user.id,
        deactivatedCount: (deactivatedRows ?? []).length,
        announcementId: (data as AnnouncementRow).id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Aviso publicado para todos os usuarios com sucesso.",
      announcement: mapAnnouncementRow(data as AnnouncementRow),
    });
  } catch (error) {
    captureServerException({
      scope: "announcements:manage:post",
      error,
      context: {
        userId: adminSession.session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Nao foi possivel publicar o aviso agora.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getAnnouncementPayloadError(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  let body: DeactivateAnnouncementPayload;

  try {
    body = (await request.json()) as DeactivateAnnouncementPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  if (typeof body.id !== "string" || !body.id.trim()) {
    return NextResponse.json(
      { message: "Informe o aviso que deve ser encerrado." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("global_announcements")
      .update({ is_active: false })
      .eq("id", body.id.trim())
      .select(
        "id, title, message, kind, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { message: "Nao encontramos esse aviso para encerrar." },
        { status: 404 },
      );
    }

    logServerEvent({
      scope: "announcements:manage:patch",
      message: "announcement deactivated",
      context: {
        userId: adminSession.session.user.id,
        announcementId: body.id.trim(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Aviso encerrado com sucesso.",
      announcement: mapAnnouncementRow(data as AnnouncementRow),
    });
  } catch (error) {
    captureServerException({
      scope: "announcements:manage:patch",
      error,
      context: {
        userId: adminSession.session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Nao foi possivel encerrar o aviso agora." },
      { status: 500 },
    );
  }
}
