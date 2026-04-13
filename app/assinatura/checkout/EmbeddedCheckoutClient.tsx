"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
);

export default function EmbeddedCheckoutClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const checkoutSessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let cleanupEmbeddedCheckout: (() => void) | null = null;

    async function mountCheckout() {
      try {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error(
            "A chave publica da Stripe ainda nao esta configurada no app.",
          );
        }

        const embeddedCheckout = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => {
            const response = await fetch("/api/billing/checkout", {
              method: "POST",
            });

            const result = (await response.json().catch(() => null)) as
              | {
                  message?: string;
                  clientSecret?: string;
                  checkoutSessionId?: string;
                }
              | null;

            if (!response.ok || !result?.clientSecret) {
              throw new Error(
                result?.message ??
                  "Nao foi possivel preparar o checkout agora.",
              );
            }

            checkoutSessionIdRef.current = result.checkoutSessionId ?? null;
            return result.clientSecret;
          },
          onComplete: () => {
            const successUrl = checkoutSessionIdRef.current
              ? `/assinatura/sucesso?session_id=${encodeURIComponent(
                  checkoutSessionIdRef.current,
                )}`
              : "/assinatura/sucesso";

            window.location.assign(successUrl);
          },
        });

        if (!isMounted || !containerRef.current) {
          embeddedCheckout.destroy();
          return;
        }

        embeddedCheckout.mount(containerRef.current);
        cleanupEmbeddedCheckout = () => embeddedCheckout.destroy();
        setStatus("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel abrir o checkout agora.",
        );
      }
    }

    mountCheckout();

    return () => {
      isMounted = false;
      cleanupEmbeddedCheckout?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Voltar para o app
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-800">
            <Crown size={14} />
            Checkout Premium
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-2xl font-black text-slate-900">
            Finalize sua assinatura Premium
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            O pagamento agora acontece dentro do proprio app, em ambiente seguro
            da Stripe.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Ao continuar, voce concorda com a nossa{" "}
            <Link
              href="/politicas/cancelamento-e-reembolso"
              className="font-bold text-amber-700 hover:text-amber-800"
            >
              politica de cancelamento e reembolso
            </Link>
            .
          </p>

          {status === "loading" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center">
              <p className="text-base font-bold text-amber-700">
                Preparando checkout...
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Estamos montando o formulario de pagamento.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {errorMessage ?? "Nao foi possivel abrir o checkout agora."}
            </div>
          )}

          <div
            ref={containerRef}
            className={`mt-6 min-h-[720px] overflow-hidden rounded-3xl border border-slate-200 ${
              status === "error" ? "hidden" : "block"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
