import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MemberRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan: string | null;
  auth_providers: string[] | null;
  backup_email: string | null;
  backup_frequency: string | null;
  stripe_subscription_status: string | null;
  founder_offer_applied: boolean | null;
  premium_trial_expires_at: string | null;
  premium_trial_used: boolean | null;
  email_verified_at?: string | null;
  email_verification_token_sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  active_seconds: number | null;
  activity_date: string;
  last_path: string | null;
  last_seen_at: string | null;
  page_views: number | null;
  user_id: string;
};

type MemberActivitySummary = {
  activeDays7d: number;
  activeSeconds7d: number;
  activeSecondsToday: number;
  lastPath: string | null;
  lastSeenAt: string | null;
  pageViewsToday: number;
};

type MembersStats = {
  activeTrialCount: number;
  activeTodayCount: number;
  averageTodayActiveSeconds: number;
  freeCount: number;
  last24hCount: number;
  last7dCount: number;
  paidPremiumCount: number;
  premiumCount: number;
  todayActiveSeconds: number;
  totalCount: number;
  unverifiedCount: number;
};

const MEMBER_BASE_SELECT_COLUMNS =
  "id, name, email, image, plan, auth_providers, backup_email, backup_frequency, stripe_subscription_status, founder_offer_applied, premium_trial_expires_at, premium_trial_used, created_at, updated_at";
const MEMBER_SELECT_COLUMNS = `${MEMBER_BASE_SELECT_COLUMNS}, email_verified_at, email_verification_token_sent_at`;

function isMembersDatabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (minutes > 0) {
    return `${minutes}min`;
  }

  return safeSeconds > 0 ? `${safeSeconds}s` : "-";
}

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

function getLocalDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return getLocalDateKey(date);
}

function getPlanLabel(member: MemberRow) {
  if (member.plan === "premium") {
    return "Premium";
  }

  if (isActivePremiumTrial(member)) {
    return "Teste Premium";
  }

  return "Grátis";
}

function isActivePremiumTrial(member: MemberRow, now = Date.now()) {
  const trialExpiresAt = member.premium_trial_expires_at
    ? new Date(member.premium_trial_expires_at).getTime()
    : 0;

  return member.plan !== "premium" && trialExpiresAt > now;
}

function getTrialRemainingLabel(member: MemberRow, now = Date.now()) {
  if (!member.premium_trial_expires_at) {
    return "-";
  }

  const expiresAt = new Date(member.premium_trial_expires_at).getTime();
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0) {
    return "Expirado";
  }

  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (days === 1) {
    return "1 dia restante";
  }

  return `${days} dias restantes`;
}

function getPlanClasses(member: MemberRow) {
  const planLabel = getPlanLabel(member);

  if (planLabel === "Premium") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (planLabel === "Teste Premium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getProvidersLabel(member: MemberRow) {
  const providers = Array.isArray(member.auth_providers)
    ? member.auth_providers
    : [];

  if (providers.length === 0) {
    return "Não informado";
  }

  return providers
    .map((provider) => (provider === "google" ? "Google" : "E-mail/senha"))
    .join(", ");
}

function getEmailStatusLabel(member: MemberRow) {
  if (member.email_verified_at) {
    return "Confirmado";
  }

  if (member.email_verification_token_sent_at) {
    return "Enviado";
  }

  return "Pendente";
}

function getEmailStatusClasses(member: MemberRow) {
  if (member.email_verified_at) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (member.email_verification_token_sent_at) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getDaysSince(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));

  if (days === 0) {
    return "Hoje";
  }

  if (days === 1) {
    return "Ha 1 dia";
  }

  return `Ha ${days} dias`;
}

function isMissingOptionalMemberColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";

  return (
    message.includes("email_verified_at") ||
    message.includes("email_verification_token_sent_at")
  );
}

function isMissingActivityTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";

  return (
    message.includes("user_activity") ||
    message.includes("Could not find the table")
  );
}

async function fetchMembers(columns: string) {
  const supabase = createSupabaseServerClient();

  return supabase
    .from("auth_users")
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);
}

async function fetchActivityRows() {
  const supabase = createSupabaseServerClient();
  const sinceDate = getLocalDateDaysAgo(6);

  return supabase
    .from("user_activity")
    .select(
      "user_id, activity_date, active_seconds, page_views, last_seen_at, last_path",
    )
    .gte("activity_date", sinceDate)
    .order("last_seen_at", { ascending: false })
    .limit(5000);
}

function buildActivitySummary(rows: ActivityRow[]) {
  const today = getLocalDateKey();
  const summaryByUserId = new Map<string, MemberActivitySummary>();

  for (const row of rows) {
    const existing = summaryByUserId.get(row.user_id) ?? {
      activeDays7d: 0,
      activeSeconds7d: 0,
      activeSecondsToday: 0,
      lastPath: null,
      lastSeenAt: null,
      pageViewsToday: 0,
    };
    const activeSeconds = Math.max(0, Number(row.active_seconds ?? 0));

    existing.activeDays7d += activeSeconds > 0 || (row.page_views ?? 0) > 0 ? 1 : 0;
    existing.activeSeconds7d += activeSeconds;

    if (row.activity_date === today) {
      existing.activeSecondsToday += activeSeconds;
      existing.pageViewsToday += Math.max(0, Number(row.page_views ?? 0));
    }

    if (
      row.last_seen_at &&
      (!existing.lastSeenAt ||
        new Date(row.last_seen_at).getTime() >
          new Date(existing.lastSeenAt).getTime())
    ) {
      existing.lastSeenAt = row.last_seen_at;
      existing.lastPath = row.last_path;
    }

    summaryByUserId.set(row.user_id, existing);
  }

  return summaryByUserId;
}

async function getMembersDashboardData() {
  if (!isMembersDatabaseConfigured()) {
    return {
      isConfigured: false,
      activeTrialMembers: [] as MemberRow[],
      members: [] as MemberRow[],
      stats: {
        activeTrialCount: 0,
        activeTodayCount: 0,
        averageTodayActiveSeconds: 0,
        freeCount: 0,
        last24hCount: 0,
        last7dCount: 0,
        paidPremiumCount: 0,
        premiumCount: 0,
        todayActiveSeconds: 0,
        totalCount: 0,
        unverifiedCount: 0,
      } satisfies MembersStats,
      activityByUserId: new Map<string, MemberActivitySummary>(),
    };
  }

  let response = await fetchMembers(MEMBER_SELECT_COLUMNS);

  if (response.error && isMissingOptionalMemberColumnError(response.error)) {
    response = await fetchMembers(MEMBER_BASE_SELECT_COLUMNS);
  }

  if (response.error) {
    throw response.error;
  }

  const members = ((response.data as unknown as MemberRow[] | null) ?? []).map(
    (member) => ({
      ...member,
      email_verified_at: member.email_verified_at ?? null,
      email_verification_token_sent_at:
        member.email_verification_token_sent_at ?? null,
    }),
  );
  const now = Date.now();
  const activeTrialMembers = members.filter((member) =>
    isActivePremiumTrial(member, now),
  );
  const paidPremiumMembers = members.filter((member) => member.plan === "premium");
  let activityRows: ActivityRow[] = [];
  const activityResponse = await fetchActivityRows();

  if (activityResponse.error && !isMissingActivityTableError(activityResponse.error)) {
    throw activityResponse.error;
  }

  if (!activityResponse.error) {
    activityRows = (activityResponse.data as unknown as ActivityRow[] | null) ?? [];
  }

  const activityByUserId = buildActivitySummary(activityRows);
  const todayActivitySummaries = Array.from(activityByUserId.values()).filter(
    (summary) => summary.activeSecondsToday > 0 || summary.pageViewsToday > 0,
  );
  const todayActiveSeconds = todayActivitySummaries.reduce(
    (total, summary) => total + summary.activeSecondsToday,
    0,
  );

  return {
    isConfigured: true,
    members,
    activeTrialMembers,
    activityByUserId,
    stats: {
      activeTrialCount: activeTrialMembers.length,
      activeTodayCount: todayActivitySummaries.length,
      averageTodayActiveSeconds:
        todayActivitySummaries.length > 0
          ? Math.round(todayActiveSeconds / todayActivitySummaries.length)
          : 0,
      freeCount: members.filter((member) => getPlanLabel(member) === "Grátis")
        .length,
      last24hCount: members.filter(
        (member) =>
          now - new Date(member.created_at).getTime() <= 24 * 60 * 60 * 1000,
      ).length,
      last7dCount: members.filter(
        (member) =>
          now - new Date(member.created_at).getTime() <=
          7 * 24 * 60 * 60 * 1000,
      ).length,
      paidPremiumCount: paidPremiumMembers.length,
      premiumCount: members.filter((member) => getPlanLabel(member) !== "Grátis")
        .length,
      todayActiveSeconds,
      totalCount: response.count ?? members.length,
      unverifiedCount: members.filter((member) => !member.email_verified_at)
        .length,
    } satisfies MembersStats,
  };
}

export default async function MembersAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/entrar");
  }

  if (!isAdminEmail(session.user.email)) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase text-red-700">
            Acesso restrito
          </p>
          <h1 className="mt-2 text-2xl font-bold">Novos membros</h1>
          <p className="mt-3 text-sm text-slate-600">
            Apenas e-mails cadastrados em ADMIN_EMAILS podem acessar a lista de
            membros.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Voltar para o app
          </Link>
        </div>
      </main>
    );
  }

  const { activeTrialMembers, activityByUserId, isConfigured, members, stats } =
    await getMembersDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-amber-700">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold">Novos membros</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Acompanhe os usuários cadastrados, plano atual, forma de login e
              confirmação de e-mail sem misturar com os dados da calculadora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/comentarios"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Comentários
            </Link>
            <Link
              href="/admin/sugestoes"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Sugestões
            </Link>
            <Link
              href="/admin/seguranca"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Segurança
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar para o app
            </Link>
          </div>
        </header>

        {!isConfigured && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Banco de membros ainda não configurado. Confira as variáveis
            NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.
          </section>
        )}

        <section className="grid gap-3 md:grid-cols-7">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Premium pago
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.paidPremiumCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Teste premium
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.activeTrialCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Grátis
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.freeCount}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-red-700">
              E-mail pendente
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.unverifiedCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Últimas 24h
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last24hCount}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Últimos 7 dias
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last7dCount}</p>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-cyan-700">
              Ativos hoje
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.activeTodayCount}</p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-cyan-700">
              Tempo total hoje
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatDuration(stats.todayActiveSeconds)}
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-cyan-700">
              Média por usuário
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatDuration(stats.averageTodayActiveSeconds)}
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-cyan-700">
              Janela medida
            </p>
            <p className="mt-2 text-3xl font-bold">7 dias</p>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Campanha para grátis
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-950">
              Chamada pronta para ativar teste Premium
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-950/80">
              Use esta campanha para usuários grátis que já confirmaram e-mail,
              mas ainda não testaram o Premium.
            </p>
            <Link
              href="/meu-negocio"
              className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Criar aviso no app
            </Link>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Modelo sugerido
            </p>
            <p className="mt-2 text-sm font-bold text-slate-950">
              Teste o Premium por 7 dias, sem cartão
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Você já pode testar materiais e produtos ilimitados, personalização
              e recursos extras da Calcula Artesão por 7 dias grátis. Não precisa
              de cartão. Clique no botão Premium dentro do app e ative quando quiser.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-lg font-bold text-amber-950">
              Usuários em teste premium
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Mostrando quem está usando o teste gratuito premium agora.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-100 text-sm">
              <thead className="bg-amber-50 text-left text-xs font-semibold uppercase text-amber-800">
                <tr>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Expira em</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {activeTrialMembers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Nenhum usuário usando teste premium ativo agora.
                    </td>
                  </tr>
                ) : (
                  activeTrialMembers.map((member) => (
                    <tr key={member.id} className="align-top hover:bg-amber-50/50">
                      <td className="px-4 py-3">
                        <div className="flex min-w-60 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                            {member.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {formatDate(member.premium_trial_expires_at)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          {getTrialRemainingLabel(member)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                          Teste ativo
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {getProvidersLabel(member)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold">Membros recentes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando os últimos 200 usuários cadastrados.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Ultimo acesso</th>
                  <th className="px-4 py-3">Uso</th>
                  <th className="px-4 py-3">Backup</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const activity = activityByUserId.get(member.id);

                    return (
                    <tr key={member.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-900">
                          {formatDate(member.created_at)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getDaysSince(member.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-60 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                            {member.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getPlanClasses(member)}`}
                        >
                          {getPlanLabel(member)}
                        </span>
                        {member.founder_offer_applied && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Founder
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {getProvidersLabel(member)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEmailStatusClasses(member)}`}
                        >
                          {getEmailStatusLabel(member)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <p className="font-medium text-slate-900">
                          {formatDate(activity?.lastSeenAt)}
                        </p>
                        {activity?.lastPath && (
                          <p className="mt-1 max-w-40 truncate text-xs text-slate-500">
                            {activity.lastPath}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <p className="font-semibold text-slate-900">
                          Hoje: {formatDuration(activity?.activeSecondsToday ?? 0)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          7 dias: {formatDuration(activity?.activeSeconds7d ?? 0)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Dias ativos: {activity?.activeDays7d ?? 0}/7
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="whitespace-nowrap">
                          {member.backup_frequency || "off"}
                        </p>
                        {member.backup_email && (
                          <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                            {member.backup_email}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {member.stripe_subscription_status || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(member.updated_at)}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
