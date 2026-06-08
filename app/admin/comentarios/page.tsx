import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import {
  createCommentsSupabaseClient,
  isCommentsDatabaseConfigured,
} from "@/lib/comments/server";

import { AdminCommentActions } from "./AdminCommentActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CommentStatus = "approved" | "pending" | "rejected";

type CommentRow = {
  id: string;
  page_path: string;
  author_display_name: string;
  author_avatar_url: string | null;
  content: string;
  status: CommentStatus;
  report_count: number | null;
  created_at: string;
  updated_at: string;
};

type ReportRow = {
  comment_id: string;
  reason: string;
  created_at: string;
};

type CommentWithReport = CommentRow & {
  latestReport?: ReportRow;
};

const statusLabels: Record<CommentStatus, string> = {
  approved: "Publicado",
  pending: "Em revisao",
  rejected: "Rejeitado",
};

const statusClasses: Record<CommentStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getContentPreview(value: string) {
  return value.length > 220 ? `${value.slice(0, 220)}...` : value;
}

async function getCommentsDashboardData() {
  if (!isCommentsDatabaseConfigured()) {
    return {
      comments: [] as CommentWithReport[],
      isConfigured: false,
      stats: {
        approvedCount: 0,
        last24hCount: 0,
        pendingCount: 0,
        reportedCount: 0,
        totalCount: 0,
      },
    };
  }

  const supabase = createCommentsSupabaseClient();
  const { data: commentsData, error: commentsError } = await supabase
    .from("page_comments")
    .select(
      "id, page_path, author_display_name, author_avatar_url, content, status, report_count, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (commentsError) {
    throw commentsError;
  }

  const comments = (commentsData as CommentRow[] | null) ?? [];
  const commentIds = comments.map((comment) => comment.id);
  const { data: reportsData, error: reportsError } = commentIds.length
    ? await supabase
        .from("comment_reports")
        .select("comment_id, reason, created_at")
        .in("comment_id", commentIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (reportsError) {
    throw reportsError;
  }

  const latestReportByComment = new Map<string, ReportRow>();

  for (const report of (reportsData as ReportRow[] | null) ?? []) {
    if (!latestReportByComment.has(report.comment_id)) {
      latestReportByComment.set(report.comment_id, report);
    }
  }

  const now = Date.now();
  const commentsWithReport = comments.map((comment) => ({
    ...comment,
    latestReport: latestReportByComment.get(comment.id),
  }));

  return {
    comments: commentsWithReport,
    isConfigured: true,
    stats: {
      approvedCount: comments.filter((comment) => comment.status === "approved").length,
      last24hCount: comments.filter(
        (comment) =>
          now - new Date(comment.created_at).getTime() <= 24 * 60 * 60 * 1000,
      ).length,
      pendingCount: comments.filter((comment) => comment.status === "pending").length,
      reportedCount: comments.filter((comment) => (comment.report_count ?? 0) > 0).length,
      totalCount: comments.length,
    },
  };
}

export default async function CommentsAdminPage() {
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
          <h1 className="mt-2 text-2xl font-bold">Comentarios das paginas</h1>
          <p className="mt-3 text-sm text-slate-600">
            Apenas e-mails cadastrados em ADMIN_EMAILS podem acessar os
            comentarios das paginas.
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

  const { comments, isConfigured, stats } = await getCommentsDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-amber-700">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold">Comentarios das paginas</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Acompanhe comentarios novos, denuncias e paginas onde visitantes
              deixaram duvidas ou experiencias.
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
              href="/admin/sugestoes"
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Sugestoes
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
            Comentarios ainda nao configurados. Confira as variaveis
            COMMENTS_SUPABASE_URL, COMMENTS_SUPABASE_SECRET_KEY e
            COMMENTS_SESSION_SECRET.
          </section>
        )}

        <section className="grid gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Publicados
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.approvedCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Revisao
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.pendingCount}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-red-700">
              Denunciados
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.reportedCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Ultimas 24h
            </p>
            <p className="mt-2 text-3xl font-bold">{stats.last24hCount}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold">Comentarios recentes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando os ultimos 200 comentarios registrados.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pagina</th>
                  <th className="px-4 py-3">Autor</th>
                  <th className="px-4 py-3">Comentario</th>
                  <th className="px-4 py-3">Denuncias</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      Nenhum comentario encontrado.
                    </td>
                  </tr>
                ) : (
                  comments.map((comment) => (
                    <tr key={comment.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(comment.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses[comment.status]}`}
                        >
                          {statusLabels[comment.status]}
                        </span>
                      </td>
                      <td className="max-w-52 px-4 py-3">
                        <Link
                          href={comment.page_path}
                          className="font-semibold text-amber-700 hover:text-amber-900"
                        >
                          {comment.page_path}
                        </Link>
                      </td>
                      <td className="max-w-44 px-4 py-3 font-medium text-slate-800">
                        {comment.author_display_name}
                      </td>
                      <td className="max-w-xl px-4 py-3 text-slate-700">
                        <p className="whitespace-pre-wrap leading-6">
                          {getContentPreview(comment.content)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">
                          {comment.report_count ?? 0}
                        </p>
                        {comment.latestReport && (
                          <p className="mt-1 max-w-48 text-xs text-slate-500">
                            Ultima: {comment.latestReport.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AdminCommentActions commentId={comment.id} />
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
