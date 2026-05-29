"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { COMMENT_MAX_LENGTH } from "@/lib/comments/rules";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (input: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: {
        shape?: "pill" | "rectangular";
        size?: "large" | "medium" | "small";
        text?: "continue_with" | "signin_with";
        theme?: "outline" | "filled_blue";
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

type CommentAuthor = {
  avatarUrl?: string | null;
  displayName: string;
  id: string;
};

type PageComment = {
  authorAvatarUrl?: string | null;
  authorName: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
  canEdit: boolean;
  id: string;
  reportCount: number;
  updatedAt: string;
};

type PageCommentsProps = {
  pagePath: string;
};

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function wasCommentEdited(comment: PageComment) {
  return (
    Math.abs(
      new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime(),
    ) > 1000
  );
}

export function PageComments({ pagePath }: PageCommentsProps) {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [author, setAuthor] = useState<CommentAuthor | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [comments, setComments] = useState<PageComment[]>([]);
  const [content, setContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCommentsEnabled, setIsCommentsEnabled] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const loadComments = useCallback(async () => {
    const response = await fetch(
      `/api/comments?page=${encodeURIComponent(pagePath)}`,
      {
        cache: "no-store",
      },
    );
    const result = (await response.json().catch(() => null)) as
      | { comments?: PageComment[]; enabled?: boolean }
      | null;

    if (result?.enabled === false) {
      setIsCommentsEnabled(false);
      setComments([]);
      return;
    }

    setIsCommentsEnabled(true);
    setComments(result?.comments ?? []);
  }, [pagePath]);

  const loadAuthor = useCallback(async () => {
    const response = await fetch("/api/comments/me", {
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as
      | { author?: CommentAuthor | null; enabled?: boolean }
      | null;

    if (result?.enabled === false) {
      setIsCommentsEnabled(false);
      return;
    }

    setAuthor(result?.author ?? null);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);

      try {
        const configResponse = await fetch("/api/comments/auth/config", {
          cache: "no-store",
        });
        const config = (await configResponse.json().catch(() => null)) as
          | { clientId?: string | null }
          | null;

        if (!isActive) {
          return;
        }

        setClientId(config?.clientId ?? null);
        await Promise.all([loadAuthor(), loadComments()]);
      } catch {
        if (isActive) {
          setIsCommentsEnabled(false);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isActive = false;
    };
  }, [loadAuthor, loadComments]);

  useEffect(() => {
    const googleClientId = clientId;

    if (!googleClientId || author || !googleButtonRef.current) {
      return;
    }

    const activeGoogleClientId: string = googleClientId;

    function renderGoogleButton() {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: activeGoogleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setFeedback("Nao foi possivel ler o retorno do Google.");
            return;
          }

          setFeedback(null);

          const authResponse = await fetch("/api/comments/auth/google", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: response.credential,
            }),
          });
          const result = (await authResponse.json().catch(() => null)) as
            | { author?: CommentAuthor; message?: string }
            | null;

          if (!authResponse.ok || !result?.author) {
            setFeedback(
              result?.message ?? "Nao foi possivel entrar para comentar.",
            );
            return;
          }

          setAuthor(result.author);
          void loadComments();
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        shape: "pill",
        size: "large",
        text: "continue_with",
        theme: "outline",
      });

      return true;
    }

    if (renderGoogleButton()) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      renderGoogleButton();
    };
    document.head.appendChild(script);
  }, [author, clientId, loadComments]);

  async function handleSubmitComment() {
    if (!content.trim()) {
      setFeedback("Escreva seu comentario antes de enviar.");
      return;
    }

    setIsPosting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          pagePath,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { comment?: PageComment; message?: string }
        | null;

      if (!response.ok || !result?.comment) {
        setFeedback(result?.message ?? "Nao foi possivel enviar o comentario.");
        return;
      }

      setComments((currentComments) => [result.comment!, ...currentComments]);
      setContent("");
      setFeedback("Comentario publicado.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleReportComment(commentId: string) {
    const response = await fetch(`/api/comments/${commentId}/report`, {
      method: "POST",
    });
    const result = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    setFeedback(
      result?.message ??
        (response.ok
          ? "Obrigado. Vamos revisar esse comentario."
          : "Nao foi possivel denunciar agora."),
    );
  }

  function startEditingComment(comment: PageComment) {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setFeedback(null);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingContent("");
  }

  async function handleUpdateComment(commentId: string) {
    if (!editingContent.trim()) {
      setFeedback("Escreva seu comentario antes de salvar.");
      return;
    }

    setIsSavingEdit(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editingContent,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { comment?: PageComment; message?: string }
        | null;

      if (!response.ok || !result?.comment) {
        setFeedback(result?.message ?? "Nao foi possivel editar o comentario.");
        return;
      }

      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === commentId ? result.comment! : comment,
        ),
      );
      cancelEditingComment();
      setFeedback("Comentario atualizado.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const shouldDelete = window.confirm("Excluir este comentario?");

    if (!shouldDelete) {
      return;
    }

    setDeletingCommentId(commentId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback(result?.message ?? "Nao foi possivel excluir o comentario.");
        return;
      }

      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
      setFeedback("Comentario excluido.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  if (!isCommentsEnabled) {
    return null;
  }

  return (
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-14">
      <div className="rounded-[34px] border border-slate-950/10 bg-white/92 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-amber-700">
              <MessageCircle size={15} />
              Comentarios
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Compartilhe sua dúvida ou experiência.
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Texto puro, ate {COMMENT_MAX_LENGTH} caracteres.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-amber-900/10 bg-amber-50/60 p-5">
          {author ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 bg-cover bg-center text-sm font-black text-amber-900"
                  style={
                    author.avatarUrl
                      ? { backgroundImage: `url(${author.avatarUrl})` }
                      : undefined
                  }
                >
                  {!author.avatarUrl ? getInitials(author.displayName) : null}
                </div>
                <span>
                  Comentando como{" "}
                  <strong className="text-slate-950">{author.displayName}</strong>
                </span>
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={COMMENT_MAX_LENGTH}
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                placeholder="Escreva seu comentario..."
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {content.length}/{COMMENT_MAX_LENGTH}
                </span>
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={isPosting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-700 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={15} />
                  {isPosting ? "Enviando..." : "Publicar comentario"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-sm leading-7 text-slate-700">
                Use o Google apenas para confirmar seu nome no comentario. Isso
                nao cria conta na calculadora e nao libera acesso ao app.
              </p>
              <div ref={googleButtonRef} className="min-h-10 min-w-60" />
            </div>
          )}
        </div>

        {feedback && (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            {feedback}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">Carregando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              Ainda nao ha comentarios nesta pagina.
            </p>
          ) : (
            comments.map((comment) => {
              const isEditing = editingCommentId === comment.id;
              const wasEdited = wasCommentEdited(comment);

              return (
              <article
                key={comment.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 bg-cover bg-center text-sm font-black text-slate-700"
                      style={
                        comment.authorAvatarUrl
                          ? {
                              backgroundImage: `url(${comment.authorAvatarUrl})`,
                            }
                          : undefined
                      }
                    >
                      {!comment.authorAvatarUrl
                        ? getInitials(comment.authorName)
                        : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {comment.authorName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCommentDate(comment.createdAt)}
                        {wasEdited ? " · editado" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {comment.canEdit && !isEditing && (
                      <button
                        type="button"
                        onClick={() => startEditingComment(comment)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    )}
                    {comment.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={13} />
                        {deletingCommentId === comment.id ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReportComment(comment.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <AlertTriangle size={13} />
                      Denunciar
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      maxLength={COMMENT_MAX_LENGTH}
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        {editingContent.length}/{COMMENT_MAX_LENGTH}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={cancelEditingComment}
                          disabled={isSavingEdit}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={isSavingEdit}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-700 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check size={14} />
                          {isSavingEdit ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {comment.content}
                  </p>
                )}
              </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
