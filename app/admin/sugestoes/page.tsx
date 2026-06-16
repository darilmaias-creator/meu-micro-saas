import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SUGGESTION_CATEGORY_LABELS,
  SUGGESTION_STATUS_LABELS,
  type SuggestionCategory,
  type SuggestionStatus,
} from "@/lib/suggestions";

import { AdminSuggestionActions } from "./AdminSuggestionActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SuggestionRow = {
  active_tab: string | null;
  category: SuggestionCategory;
  created_at: string;
  id: string;
  message: string;
  status: SuggestionStatus;
  updated_at: string;
  user_email: string;
  user_id: string;
  user_name: string;
  user_plan: string;
};

const STATUS_CLASSES: Record<SuggestionStatus, string> = {
  archived: "border-slate-200 bg-slate-50 text-slate-700",
  new: "border-blue-200 bg-blue-50 text-blue-700",
  planned: "border-purple-200 bg-purple-50 text-purple-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-800",
};

const CATEGORY_CLASSES: Record<SuggestionCategory, string> = {
  duvida: "border-sky-200 bg-sky-50 text-sky-700",
  erro: "border-red-200 bg-red-50 text-red-700",
  ideia: "border-amber-200 bg-amber-50 text-amber-800",
  melhoria: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const TAB_LABELS: Record<string, string> = {
  calculator: "Calcular Preco",
  dashboard: "Resumo",
  inventory: "Materiais",
  operationCosts: "Gastos",
  sales: "Vendas",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMessagePreview(message: string) {
  return message.length > 260 ? `${message.slice(0, 260)}...` : message;
}

function isSuggestionsTableMissing(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as { code?: string; message?: string };

  return (
    errorLike.code === "42P01" ||
    String(errorLike.message ?? "").includes("user_suggestions")
  );
}

async function getSuggestionsDashboardData() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_suggestions")
    .select(
      "id, user_id, user_name, user_email, user_plan, category, message, active_tab, status, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isSuggestionsTableMissing(error)) {
      return {
        isConfigured: false,
        suggestions: [] as SuggestionRow[],
        stats: {
          errorCount: 0,
          last24hCount: 0,
          newCount: 0,
          totalCount: 0,
        },
      };
    }

    throw error;
  }

  const suggestions = (data as SuggestionRow[] | null) ?? [];
  const now = Date.now();

  return {
    isConfigured: true,
    suggestions,
    stats: {
      errorCount: suggestions.filter((suggestion) => suggestion.category === "erro")
        .length,
      last24hCount: suggestions.filter(
        (suggestion) =>
          now - new Date(suggestion.created_at).getTime() <= 24 * 60 * 60 * 1000,
      ).length,
      newCount: suggestions.filter((suggestion) => suggestion.status === "new")
        .length,
      totalCount: suggestions.length,
    },
  };
}

export default async function SuggestionsAdminPage() {
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
          <h1 className="mt-2 text-2xl font-bold">Sugestões dos usuários</h1>
          <p className="mt-3 text-sm text-slate-600">
            Apenas e-mails cadastrados em ADMIN_EMAILS podem acessar as
            sugestoes enviadas dentro do app.
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

  const { isConfigured, stats, suggestions } = await getSuggestionsDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-amber-700">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold">Sugestões dos usuários</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Veja ideias, erros, duvidas e melhorias enviadas pelos usuarios
              diretamente dentro da calculadora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/membros"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Membros
            </Link>
            <Link
              href="/admin/comentarios"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
            A tabela user_suggestions ainda nao foi criada no Supabase. Rode o
            bloco novo do arquivo supabase/schema.sql no SQL Editor.
          </section>
        )}

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-blue-700">
              Novas
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.newCount}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-red-700">
              Erros
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.errorCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Ultimas 24h
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last24hCount}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold">Mensagens recentes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando as ultimas 200 sugestoes enviadas.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3">Aba</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      Nenhuma sugestao encontrada.
                    </td>
                  </tr>
                ) : (
                  suggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(suggestion.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">
                          {suggestion.user_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {suggestion.user_email || suggestion.user_id}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase text-amber-700">
                          {suggestion.user_plan === "premium" ? "Premium" : "Gratis"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${CATEGORY_CLASSES[suggestion.category]}`}
                        >
                          {SUGGESTION_CATEGORY_LABELS[suggestion.category]}
                        </span>
                      </td>
                      <td className="max-w-xl px-4 py-3 text-slate-700">
                        {getMessagePreview(suggestion.message)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {suggestion.active_tab
                          ? TAB_LABELS[suggestion.active_tab] ?? suggestion.active_tab
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[suggestion.status]}`}
                        >
                          {SUGGESTION_STATUS_LABELS[suggestion.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AdminSuggestionActions
                          currentStatus={suggestion.status}
                          suggestionId={suggestion.id}
                        />
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
