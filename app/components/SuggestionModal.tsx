"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Lightbulb, Send, X } from "lucide-react";

import type { ActiveTab } from "@/lib/app-tabs";
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_CATEGORY_LABELS,
  SUGGESTION_MAX_LENGTH,
  SUGGESTION_STATUS_LABELS,
  type SuggestionCategory,
  type SuggestionStatus,
} from "@/lib/suggestions";

type SuggestionModalProps = {
  activeTab: ActiveTab;
  isOpen: boolean;
  onClose: () => void;
};

type SuggestionResponse = {
  message?: string;
};

type UserSuggestion = {
  active_tab?: string | null;
  category: SuggestionCategory;
  created_at: string;
  id: string;
  message: string;
  status: SuggestionStatus;
  updated_at: string;
};

type SuggestionsListResponse = {
  message?: string;
  suggestions?: UserSuggestion[];
};

type SuggestionModalTab = "form" | "history";

const CATEGORY_DESCRIPTIONS: Record<SuggestionCategory, string> = {
  duvida: "Algo que ficou confuso no uso da calculadora.",
  erro: "Algo que não funcionou como deveria.",
  ideia: "Uma funcao nova que poderia ajudar.",
  melhoria: "Algo que ja existe, mas poderia ficar melhor.",
};

const STATUS_CLASSES: Record<SuggestionStatus, string> = {
  archived: "border-slate-200 bg-slate-50 text-slate-700",
  new: "border-blue-200 bg-blue-50 text-blue-700",
  planned: "border-purple-200 bg-purple-50 text-purple-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-800",
};

const TAB_LABELS: Record<string, string> = {
  calculator: "Calcular Preço",
  dashboard: "Resumo",
  inventory: "Materiais",
  operationCosts: "Gastos",
  sales: "Vendas",
};

function formatSuggestionDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSuggestionPreview(value: string) {
  return value.length > 180 ? `${value.slice(0, 180)}...` : value;
}

export function SuggestionModal({
  activeTab,
  isOpen,
  onClose,
}: SuggestionModalProps) {
  const [activeModalTab, setActiveModalTab] = useState<SuggestionModalTab>("form");
  const [category, setCategory] = useState<SuggestionCategory>("ideia");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [historyFeedback, setHistoryFeedback] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);

  const loadUserSuggestions = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryFeedback(null);

    try {
      const response = await fetch("/api/suggestions", {
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as
        | SuggestionsListResponse
        | null;

      if (!response.ok) {
        setHistoryFeedback(
          result?.message ?? "Não foi possível carregar suas sugestões.",
        );
        setUserSuggestions([]);
        return;
      }

      setUserSuggestions(result?.suggestions ?? []);
    } catch {
      setHistoryFeedback("Não foi possível conectar agora.");
      setUserSuggestions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadUserSuggestions();
  }, [isOpen, loadUserSuggestions]);

  if (!isOpen) {
    return null;
  }

  async function submitSuggestion() {
    const trimmedMessage = message.trim();

    setFeedback(null);

    if (trimmedMessage.length < 8) {
      setFeedback({
        message: "Escreva um pouco mais para eu entender sua sugestão.",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/suggestions", {
        body: JSON.stringify({
          activeTab,
          category,
          message: trimmedMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | SuggestionResponse
        | null;

      if (!response.ok) {
        setFeedback({
          message:
            result?.message ??
            "Não foi possível enviar sua sugestão agora. Tente novamente.",
          tone: "error",
        });
        return;
      }

      setMessage("");
      setCategory("ideia");
      setFeedback({
        message:
          result?.message ??
          "Sugestão enviada com sucesso. Obrigado por ajudar a melhorar a calculadora.",
        tone: "success",
      });
      setActiveModalTab("history");
      await loadUserSuggestions();
    } catch {
      setFeedback({
        message: "Não foi possível conectar agora. Tente novamente em instantes.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 px-3 py-4 backdrop-blur-sm md:items-center md:justify-center">
      <div className="w-full rounded-3xl border border-amber-100 bg-white shadow-2xl md:max-w-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-700">
              <Lightbulb size={15} />
              Sugestoes
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              Envie uma ideia para a calculadora
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use esse espaço para apontar erros, dúvidas ou melhorias.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Fechar sugestões"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={() => setActiveModalTab("form")}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              activeModalTab === "form"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Enviar sugestão
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveModalTab("history");
              void loadUserSuggestions();
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              activeModalTab === "history"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Minhas sugestões
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {activeModalTab === "form" ? (
            <>
              <div>
                <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {SUGGESTION_CATEGORIES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        category === option
                          ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-sm font-black">
                        {SUGGESTION_CATEGORY_LABELS[option]}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                        {CATEGORY_DESCRIPTIONS[option]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="suggestion-message"
                  className="mb-2 block text-xs font-black uppercase text-slate-500"
                >
                  Mensagem
                </label>
                <textarea
                  id="suggestion-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, SUGGESTION_MAX_LENGTH))
                  }
                  placeholder="Conte o que você gostaria de melhorar..."
                  className="min-h-36 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">
                    A aba atual será enviada junto para dar contexto.
                  </span>
                  <span className="font-bold text-slate-500">
                    {message.length}/{SUGGESTION_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {feedback && (
                <p
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    feedback.tone === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                  aria-live="polite"
                >
                  {feedback.message}
                </p>
              )}
            </>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-700">
                  Acompanhe o andamento do que você enviou.
                </p>
                <button
                  type="button"
                  onClick={() => void loadUserSuggestions()}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Atualizar
                </button>
              </div>

              {isLoadingHistory ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  Carregando suas sugestões...
                </p>
              ) : historyFeedback ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {historyFeedback}
                </p>
              ) : userSuggestions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  Você ainda não enviou nenhuma sugestão.
                </p>
              ) : (
                userSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                        {SUGGESTION_CATEGORY_LABELS[suggestion.category]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-black ${STATUS_CLASSES[suggestion.status]}`}
                      >
                        {SUGGESTION_STATUS_LABELS[suggestion.status]}
                      </span>
                      {suggestion.active_tab && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                          {TAB_LABELS[suggestion.active_tab] ?? suggestion.active_tab}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {getSuggestionPreview(suggestion.message)}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock size={13} />
                      Enviada em {formatSuggestionDate(suggestion.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Fechar
          </button>
          {activeModalTab === "form" && (
            <button
              type="button"
              onClick={submitSuggestion}
              disabled={isSubmitting || message.trim().length < 8}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              <Send size={16} />
              {isSubmitting ? "Enviando..." : "Enviar sugestão"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
