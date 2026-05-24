import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuditLogRow = {
  id: number;
  user_id: string | null;
  action: string;
  severity: "info" | "warn" | "critical";
  details: Record<string, unknown> | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  created_at: string;
};

const severityLabels: Record<AuditLogRow["severity"], string> = {
  info: "Info",
  warn: "Alerta",
  critical: "Critico",
};

const severityClasses: Record<AuditLogRow["severity"], string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDetailsPreview(details: Record<string, unknown> | null) {
  if (!details || Object.keys(details).length === 0) {
    return "Sem detalhes";
  }

  const preview = JSON.stringify(details);

  return preview.length > 180 ? `${preview.slice(0, 180)}...` : preview;
}

async function getAuditLogs() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, user_id, action, severity, details, ip_hash, user_agent_hash, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data as AuditLogRow[] | null) ?? [];
}

async function getAuditDashboardData() {
  const logs = await getAuditLogs();
  const now = Date.now();
  const last24h = logs.filter(
    (log) => now - new Date(log.created_at).getTime() <= 24 * 60 * 60 * 1000,
  );
  const counts = logs.reduce(
    (acc, log) => {
      acc[log.severity] += 1;
      return acc;
    },
    { critical: 0, info: 0, warn: 0 },
  );
  const uniqueUsers = new Set(logs.map((log) => log.user_id).filter(Boolean));

  return {
    counts,
    last24hCount: last24h.length,
    logs,
    uniqueUsersCount: uniqueUsers.size,
  };
}

export default async function SecurityAdminPage() {
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
          <h1 className="mt-2 text-2xl font-bold">Painel de seguranca</h1>
          <p className="mt-3 text-sm text-slate-600">
            Apenas e-mails cadastrados em ADMIN_EMAILS podem acessar os logs de
            auditoria.
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

  const { counts, last24hCount, logs, uniqueUsersCount } =
    await getAuditDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-amber-700">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold">Seguranca e auditoria</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Ultimos eventos registrados em audit_logs, com hashes de IP e
              navegador para investigacao sem expor dados brutos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/backup-restore-test"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Testar backup
            </a>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar para o app
            </Link>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Eventos
            </p>
            <p className="mt-2 text-3xl font-bold">{logs.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Ultimas 24h
            </p>
            <p className="mt-2 text-3xl font-bold">{last24hCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Alertas
            </p>
            <p className="mt-2 text-3xl font-bold">{counts.warn}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-red-700">
              Criticos
            </p>
            <p className="mt-2 text-3xl font-bold">{counts.critical}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Resumo</h2>
              <p className="text-sm text-slate-600">
                {uniqueUsersCount} usuario(s) com evento nos ultimos 100 logs.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Atualiza ao recarregar a pagina.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold">Eventos recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Severidade</th>
                  <th className="px-4 py-3">Acao</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Hash IP</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      Nenhum evento de auditoria encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${severityClasses[log.severity]}`}
                        >
                          {severityLabels[log.severity]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {log.action}
                      </td>
                      <td className="max-w-40 truncate px-4 py-3 text-slate-600">
                        {log.user_id ?? "Sem usuario"}
                      </td>
                      <td className="max-w-36 truncate px-4 py-3 font-mono text-xs text-slate-500">
                        {log.ip_hash ?? "-"}
                      </td>
                      <td className="max-w-xl px-4 py-3 font-mono text-xs text-slate-600">
                        {getDetailsPreview(log.details)}
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
