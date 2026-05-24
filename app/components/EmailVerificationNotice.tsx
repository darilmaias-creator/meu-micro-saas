"use client";

import { useState } from "react";
import { CheckCircle2, MailWarning } from "lucide-react";

type EmailVerificationNoticeProps = {
  email: string;
};

export default function EmailVerificationNotice({
  email,
}: EmailVerificationNoticeProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
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
            "Nao foi possivel enviar o e-mail de confirmacao agora.",
        );
        return;
      }

      setStatus("sent");
      setMessage(
        result?.message ??
          "Enviamos um novo link de confirmacao para seu e-mail.",
      );
    } catch {
      setStatus("error");
      setMessage("Nao foi possivel enviar o e-mail de confirmacao agora.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              {status === "sent" ? (
                <CheckCircle2 size={18} />
              ) : (
                <MailWarning size={18} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black">Confirme seu e-mail</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Envie um link para confirmar {email}. Isso aumenta a seguranca
                da sua conta e ajuda na recuperacao de acesso.
              </p>
              {message && (
                <p
                  className={`mt-2 text-xs font-bold ${
                    status === "error" ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={status === "sending"}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Enviar confirmação"}
          </button>
        </div>
      </div>
    </div>
  );
}
