"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetPasswordFeedback =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

export default function ResetPasswordForm({
  initialToken,
}: {
  initialToken: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ResetPasswordFeedback>(null);

  const hasToken = initialToken.trim().length > 0;

  async function handleSubmit() {
    if (!hasToken) {
      setFeedback({
        tone: "error",
        message: "O link de recuperacao esta incompleto ou invalido.",
      });
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: initialToken,
          password,
          confirmPassword,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ?? "Nao foi possivel redefinir a senha agora.",
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: result?.message ?? "Senha redefinida com sucesso.",
      });

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.push("/?reset=password-updated");
      }, 1200);
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel redefinir a senha agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-slate-800 mb-3">
            Redefinir senha
          </h1>
          <p className="text-slate-500 text-sm">
            Crie uma nova senha para voltar a entrar na sua conta.
          </p>
        </div>

        {!hasToken && (
          <div className="rounded-xl px-3 py-3 text-sm bg-red-50 text-red-700 border border-red-100 mb-4">
            O link de recuperacao esta incompleto ou invalido. Peca um novo e-mail
            na tela de login.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!hasToken || isSubmitting}
              className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="Minimo de 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!hasToken || isSubmitting}
              className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="Repita a senha"
            />
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-3 py-2 text-sm ${
                feedback.tone === "error"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasToken || isSubmitting}
            className="w-full bg-amber-600 text-white font-bold text-base py-3 px-4 rounded-xl hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isSubmitting ? "Salvando..." : "Salvar nova senha"}
          </button>

          <Link
            href="/"
            className="block text-center text-sm font-bold text-amber-700 hover:text-amber-800 pt-2"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
