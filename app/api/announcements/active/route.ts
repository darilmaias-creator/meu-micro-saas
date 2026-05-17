import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { mapAnnouncementRow } from "@/lib/announcements/rules";
import type { AnnouncementRow } from "@/lib/announcements/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para ver os avisos." },
      { status: 401 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("global_announcements")
      .select(
        "id, title, message, kind, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("starts_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const rows = (data as AnnouncementRow[] | null) ?? [];
    const now = new Date();
    const activeAnnouncement = rows.find((row) => isAnnouncementActiveNow(row, now));

    if (!activeAnnouncement) {
      return NextResponse.json(
        {
          ok: true,
          announcement: null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      announcement: mapAnnouncementRow(activeAnnouncement),
    });
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel carregar o aviso agora." },
      { status: 500 },
    );
  }
}
