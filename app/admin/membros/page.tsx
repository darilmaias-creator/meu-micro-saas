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

type MembersStats = {
  freeCount: number;
  last24hCount: number;
  last7dCount: number;
  premiumCount: number;
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

function getPlanLabel(member: MemberRow) {
  const trialExpiresAt = member.premium_trial_expires_at
    ? new Date(member.premium_trial_expires_at).getTime()
    : 0;

  if (member.plan === "premium") {
    return "Premium";
  }

  if (trialExpiresAt > Date.now()) {
    return "Teste Premium";
  }

  return "Gratis";
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
    return "Nao informado";
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

async function fetchMembers(columns: string) {
  const supabase = createSupabaseServerClient();

  return supabase
    .from("auth_users")
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);
}

async function getMembersDashboardData() {
  if (!isMembersDatabaseConfigured()) {
    return {
      isConfigured: false,
      members: [] as MemberRow[],
      stats: {
        freeCount: 0,
        last24hCount: 0,
        last7dCount: 0,
        premiumCount: 0,
        totalCount: 0,
        unverifiedCount: 0,
      } satisfies MembersStats,
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

  return {
    isConfigured: true,
    members,
    stats: {
      freeCount: members.filter((member) => getPlanLabel(member) === "Gratis")
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
      premiumCount: members.filter((member) => getPlanLabel(member) !== "Gratis")
        .length,
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

  const { isConfigured, members, stats } = await getMembersDashboardData();

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
              Acompanhe os usuarios cadastrados, plano atual, forma de login e
              confirmacao de e-mail sem misturar com os dados da calculadora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/comentarios"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Comentarios
            </Link>
            <Link
              href="/admin/seguranca"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Seguranca
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
            Banco de membros ainda nao configurado. Confira as variaveis
            NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.
          </section>
        )}

        <section className="grid gap-3 md:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Premium/teste
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.premiumCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Gratis
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
              Ultimas 24h
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last24hCount}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Ultimos 7 dias
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last7dCount}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold">Membros recentes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando os ultimos 200 usuarios cadastrados.
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
                  <th className="px-4 py-3">Backup</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
