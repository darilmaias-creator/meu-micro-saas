import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import {
  isAnnouncementVisibleForEmail,
  mapAnnouncementRow,
} from "@/lib/announcements/rules";
import type { AnnouncementRow } from "@/lib/announcements/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ANNOUNCEMENT_SELECT_FIELDS =
  "id, title, message, kind, audience, target_emails, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at";

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
      .select(ANNOUNCEMENT_SELECT_FIELDS)
      .eq("is_active", true)
      .order("starts_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const rows = (data as AnnouncementRow[] | null) ?? [];
    const now = new Date();
    const activeAnnouncement = rows.find(
      (row) =>
        isAnnouncementActiveNow(row, now) &&
        isAnnouncementVisibleForEmail({
          audience: row.audience,
          targetEmails: row.target_emails,
          userEmail: session.user.email,
        }),
    );

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
