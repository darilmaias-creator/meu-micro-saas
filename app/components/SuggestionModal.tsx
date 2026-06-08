"use client";

import { useState } from "react";
import { Lightbulb, Send, X } from "lucide-react";

import type { ActiveTab } from "@/lib/app-tabs";
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_CATEGORY_LABELS,
  SUGGESTION_MAX_LENGTH,
  type SuggestionCategory,
} from "@/lib/suggestions";

type SuggestionModalProps = {
  activeTab: ActiveTab;
  isOpen: boolean;
  onClose: () => void;
};

type SuggestionResponse = {
  message?: string;
};

const CATEGORY_DESCRIPTIONS: Record<SuggestionCategory, string> = {
  duvida: "Algo que ficou confuso no uso da calculadora.",
  erro: "Algo que nao funcionou como deveria.",
  ideia: "Uma funcao nova que poderia ajudar.",
  melhoria: "Algo que ja existe, mas poderia ficar melhor.",
};

export function SuggestionModal({
  activeTab,
  isOpen,
  onClose,
}: SuggestionModalProps) {
  const [category, setCategory] = useState<SuggestionCategory>("ideia");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function submitSuggestion() {
    const trimmedMessage = message.trim();

    setFeedback(null);

    if (trimmedMessage.length < 8) {
      setFeedback({
        message: "Escreva um pouco mais para eu entender sua sugestao.",
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
            "Nao foi possivel enviar sua sugestao agora. Tente novamente.",
          tone: "error",
        });
        return;
      }

      setMessage("");
      setCategory("ideia");
      setFeedback({
        message:
          result?.message ??
          "Sugestao enviada com sucesso. Obrigado por ajudar a melhorar a calculadora.",
        tone: "success",
      });
    } catch {
      setFeedback({
        message: "Nao foi possivel conectar agora. Tente novamente em instantes.",
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
              Use esse espaco para apontar erros, duvidas ou melhorias.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Fechar sugestoes"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
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
              placeholder="Conte o que voce gostaria de melhorar..."
              className="min-h-36 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                A aba atual sera enviada junto para dar contexto.
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
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={submitSuggestion}
            disabled={isSubmitting || message.trim().length < 8}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            <Send size={16} />
            {isSubmitting ? "Enviando..." : "Enviar sugestao"}
          </button>
        </div>
      </div>
    </div>
  );
}
