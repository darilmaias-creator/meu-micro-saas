"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { isPremiumActiveSubscriptionStatus } from "@/lib/billing/subscription-status";

type ConfirmationState = "checking" | "confirmed" | "pending";

const MAX_CONFIRMATION_ATTEMPTS = 8;
const CONFIRMATION_POLL_INTERVAL_MS = 2500;

type SuccessStatusClientProps = {
  sessionId?: string;
};

function hasActivePremium(session: Awaited<ReturnType<typeof useSession>>["data"]) {
  return Boolean(
    session?.user?.isPremium &&
      session.user.stripeSubscriptionId &&
      isPremiumActiveSubscriptionStatus(session.user.stripeSubscriptionStatus),
  );
}

export default function SuccessStatusClient({
  sessionId,
}: SuccessStatusClientProps) {
  const { data: session, update } = useSession();
  const [confirmationState, setConfirmationState] =
    useState<ConfirmationState>(() =>
      hasActivePremium(session) ? "confirmed" : "checking",
    );
  const effectiveConfirmationState = hasActivePremium(session)
    ? "confirmed"
    : confirmationState;
  const checkoutSessionId = sessionId;

  const statusMessage = useMemo(() => {
    if (effectiveConfirmationState === "confirmed") {
      return "Seu Premium ja foi confirmado e a conta esta pronta para uso.";
    }

    if (effectiveConfirmationState === "pending") {
      return "O pagamento foi enviado. A confirmacao do Premium pode levar mais alguns segundos.";
    }

    return "Estamos confirmando sua assinatura Premium com a Stripe agora.";
  }, [effectiveConfirmationState]);

  useEffect(() => {
    if (hasActivePremium(session)) {
      return;
    }

    let attempts = 0;
    let isMounted = true;

    async function runConfirmationAttempt() {
      attempts += 1;

      try {
        if (checkoutSessionId) {
          await fetch("/api/billing/confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId: checkoutSessionId,
            }),
          });
        }

        const refreshedSession = await update();

        if (!isMounted) {
          return;
        }

        if (hasActivePremium(refreshedSession)) {
          setConfirmationState("confirmed");
          return true;
        }

        if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
          setConfirmationState("pending");
        }
      } catch {
        if (!isMounted) {
          return;
        }

        if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
          setConfirmationState("pending");
        }
      }

      return attempts >= MAX_CONFIRMATION_ATTEMPTS;
    }

    void runConfirmationAttempt();

    const interval = window.setInterval(async () => {
      const shouldStop = await runConfirmationAttempt();

      if (shouldStop) {
        window.clearInterval(interval);
      }
    }, CONFIRMATION_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [checkoutSessionId, session, update]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Assinatura iniciada
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Pagamento enviado com sucesso
        </h1>
        <p className="mt-4 text-sm text-slate-600">{statusMessage}</p>
        {effectiveConfirmationState === "checking" && (
          <p className="mt-2 text-sm text-slate-500">
            Aguarde um instante enquanto o app sincroniza sua assinatura.
          </p>
        )}
        {effectiveConfirmationState === "pending" && (
          <p className="mt-2 text-sm text-slate-500">
            Se o selo Premium ainda nao aparecer na volta, feche e abra o perfil
            novamente em alguns segundos.
          </p>
        )}
        {effectiveConfirmationState === "confirmed" && (
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            Confirmacao concluida. O gerenciamento da assinatura ja deve estar
            liberado no perfil.
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Voltar para o app
        </Link>
      </div>
    </div>
  );
}
