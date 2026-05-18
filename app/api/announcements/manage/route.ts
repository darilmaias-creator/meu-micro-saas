import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import {
  sendAnnouncementEmailToUsers,
  type AnnouncementEmailDispatchSummary,
  type AnnouncementEmailRecipient,
} from "@/lib/announcements/email";
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

const ANNOUNCEMENT_SELECT_FIELDS =
  "id, title, message, kind, audience, target_emails, cta_label, cta_url, starts_at, ends_at, is_active, created_by_user_id, created_by_email, created_at, updated_at";

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

function buildAnnouncementPublishMessage(input: {
  baseMessage: string;
  emailDelivery: AnnouncementEmailDispatchSummary | null;
}) {
  if (!input.emailDelivery) {
    return input.baseMessage;
  }

  if (!input.emailDelivery.enabled) {
    return `${input.baseMessage} Aviso por e-mail desativado para esta publicacao.`;
  }

  if (input.emailDelivery.attempted === 0) {
    return `${input.baseMessage} Nenhum e-mail encontrado para envio agora.`;
  }

  if (input.emailDelivery.failed > 0) {
    return `${input.baseMessage} E-mail enviado para ${input.emailDelivery.sent}/${input.emailDelivery.attempted} usuarios (${input.emailDelivery.failed} falharam).`;
  }

  return `${input.baseMessage} E-mail enviado para ${input.emailDelivery.sent} usuarios.`;
}

function hasResendEnvConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

function filterRecipientsByTargetEmails(
  recipients: AnnouncementEmailRecipient[],
  targetEmails: string[],
) {
  const targetSet = new Set(targetEmails.map((email) => email.trim().toLowerCase()));

  return recipients.filter((recipient) =>
    targetSet.has(recipient.email.trim().toLowerCase()),
  );
}

async function listAnnouncementEmailRecipients() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auth_users")
    .select("id, name, email");

  if (error) {
    throw error;
  }

  const rows = (data as Array<{ id: string; name: string | null; email: string | null }> | null) ?? [];

  return rows
    .filter((row) => typeof row.email === "string" && row.email.trim().length > 0)
    .map(
      (row): AnnouncementEmailRecipient => ({
        userId: row.id,
        email: row.email!.trim(),
        name: row.name,
      }),
    );
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
      .select(ANNOUNCEMENT_SELECT_FIELDS)
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
        audience: validation.data.audience,
        target_emails:
          validation.data.audience === "selected"
            ? validation.data.targetEmails
            : null,
        cta_label: validation.data.ctaLabel,
        cta_url: validation.data.ctaUrl,
        starts_at: new Date().toISOString(),
        ends_at: validation.data.endsAt,
        is_active: true,
        created_by_user_id: adminSession.session.user.id,
        created_by_email: adminEmail,
      })
      .select(ANNOUNCEMENT_SELECT_FIELDS)
      .single();

    if (error) {
      throw error;
    }

    const announcementRecord = mapAnnouncementRow(data as AnnouncementRow);
    let emailDelivery: AnnouncementEmailDispatchSummary | null = null;

    if (validation.data.sendEmailUsers) {
      if (!hasResendEnvConfigured()) {
        emailDelivery = {
          enabled: false,
          attempted: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
          sampleErrors: [
            "RESEND_API_KEY ou RESEND_FROM_EMAIL nao esta configurado.",
          ],
        };
      } else {
        try {
          const allRecipients = await listAnnouncementEmailRecipients();
          const recipients =
            validation.data.audience === "selected"
              ? filterRecipientsByTargetEmails(
                  allRecipients,
                  validation.data.targetEmails,
                )
              : allRecipients;

          emailDelivery = await sendAnnouncementEmailToUsers({
            announcement: announcementRecord,
            recipients,
          });
        } catch (emailError) {
          captureServerException({
            scope: "announcements:manage:post:email",
            error: emailError,
            context: {
              userId: adminSession.session.user.id,
              announcementId: (data as AnnouncementRow).id,
            },
          });

          emailDelivery = {
            enabled: true,
            attempted: 0,
            sent: 0,
            failed: 0,
            skipped: 0,
            sampleErrors: [
              emailError instanceof Error
                ? emailError.message
                : "Falha inesperada no envio por e-mail.",
            ],
          };
        }
      }
    }

    logServerEvent({
      scope: "announcements:manage:post",
      message: "announcement published",
      context: {
        userId: adminSession.session.user.id,
        deactivatedCount: (deactivatedRows ?? []).length,
        announcementId: (data as AnnouncementRow).id,
        audience: validation.data.audience,
        targetEmailsCount: validation.data.targetEmails.length,
        sendEmailUsers: validation.data.sendEmailUsers,
        emailAttempted: emailDelivery?.attempted ?? 0,
        emailSent: emailDelivery?.sent ?? 0,
        emailFailed: emailDelivery?.failed ?? 0,
      },
    });

    return NextResponse.json({
      ok: true,
      message: buildAnnouncementPublishMessage({
        baseMessage:
          validation.data.audience === "selected"
            ? `Aviso publicado para ${validation.data.targetEmails.length} usuario(s) direcionado(s).`
            : "Aviso publicado para todos os usuarios com sucesso.",
        emailDelivery,
      }),
      announcement: announcementRecord,
      emailDelivery,
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
      .select(ANNOUNCEMENT_SELECT_FIELDS)
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
