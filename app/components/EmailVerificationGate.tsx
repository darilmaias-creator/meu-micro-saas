"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, LogOut, MailCheck, MailWarning } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

type EmailVerificationGateProps = {
  email: string;
};

export default function EmailVerificationGate({ email }: EmailVerificationGateProps) {
  const { update } = useSession();
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "checking" | "verified" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSendVerificationEmail() {
    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(
          result?.message ??
            "Não foi possível enviar o e-mail de confirmação agora.",
        );
        return;
      }

      setStatus("sent");
      setMessage(
        result?.message ??
          "Enviamos um novo link de confirmação para seu e-mail.",
      );
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar o e-mail de confirmação agora.");
    }
  }

  async function handleCheckVerification() {
    setStatus("checking");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/email-verification-status", {
        cache: "no-store",
        method: "GET",
      });
      const result = (await response.json().catch(() => null)) as
        | {
            emailVerified?: boolean;
            message?: string;
          }
        | null;

      if (!response.ok || !result?.emailVerified) {
        setStatus("error");
        setMessage(
          result?.message ??
            "Ainda não identificamos a confirmação. Abra o link mais recente enviado por e-mail e tente novamente.",
        );
        return;
      }

      await update();
      setStatus("verified");
      setMessage("E-mail confirmado. Liberando sua calculadora...");
      window.location.assign("/dashboard");
    } catch {
      setStatus("error");
      setMessage("Não foi possível atualizar sua sessão agora.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(253,230,138,0.4),_rgba(255,247,237,0.75)_32%,_rgba(248,250,252,1)_62%)] px-4 py-8 md:flex md:items-center md:justify-center">
      <section className="app-shell-surface mx-auto w-full max-w-xl rounded-[32px] border border-white/80 bg-white/95 p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">
          <Calculator size={12} />
          Confirmação necessária
        </div>

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-inner">
          <MailCheck size={46} />
        </div>

        <h1 className="mb-3 text-3xl font-black text-slate-900">
          Confirme seu e-mail para entrar
        </h1>
        <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-slate-600">
          Enviamos um link para <strong>{email}</strong>. Depois da confirmação,
          sua calculadora fica liberada com mais segurança para salvar materiais,
          produtos, vendas e backups.
        </p>

        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
          <p className="font-bold">Próximo passo</p>
          <p className="mt-1">
            Abra o e-mail, clique em confirmar e volte aqui para tocar em
            “Já confirmei”.
          </p>
        </div>

        {message && (
          <div
            aria-live="polite"
            className={`mb-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
              status === "error"
                ? "border-red-100 bg-red-50 text-red-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {status === "error" ? (
              <MailWarning size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={status === "checking" || status === "sending"}
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "checking" ? "Verificando..." : "Já confirmei"}
          </button>
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={status === "sending" || status === "checking"}
            className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Reenviar e-mail"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/entrar" })}
          className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-700"
        >
          <LogOut size={16} />
          Sair e usar outra conta
        </button>
      </section>
    </main>
  );
}
