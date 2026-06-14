"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeInfo, CheckCircle2, Crown } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
);

export default function EmbeddedCheckoutClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const checkoutSessionIdRef = useRef<string | null>(null);
  const promotionCodeRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlreadyPremium, setIsAlreadyPremium] = useState(false);
  const [detectedPromotionCode, setDetectedPromotionCode] = useState<
    string | null
  >(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const couponFromUrl =
      searchParams.get("cupom") ?? searchParams.get("coupon");
    const normalizedCoupon = couponFromUrl?.trim() ?? "";
    promotionCodeRef.current = normalizedCoupon ? normalizedCoupon : null;
    setDetectedPromotionCode(promotionCodeRef.current);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let cleanupEmbeddedCheckout: (() => void) | null = null;

    async function mountCheckout() {
      try {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error(
            "A chave pública da Stripe ainda não está configurada no app.",
          );
        }

        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            promotionCode: promotionCodeRef.current,
          }),
        });

        const result = (await response.json().catch(() => null)) as
          | {
              message?: string;
              clientSecret?: string;
              checkoutSessionId?: string;
            }
          | null;

        if (!response.ok || !result?.clientSecret) {
          if (response.status === 400 && result?.message?.includes("Premium ativo")) {
            setIsAlreadyPremium(true);
          }

          throw new Error(
            result?.message ?? "Não foi possível preparar o checkout agora.",
          );
        }

        checkoutSessionIdRef.current = result.checkoutSessionId ?? null;

        const embeddedCheckout = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => result.clientSecret as string,
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
            : "Não foi possível abrir o checkout agora.",
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
          {isAlreadyPremium ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-950">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-black">
                    Sua conta já está Premium
                  </h1>
                  <p className="mt-2 text-sm leading-6">
                    Não é necessário abrir um novo checkout. Seu plano Premium
                    já está ativo nesta conta.
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Para ver detalhes da assinatura, gerenciamento ou reembolso,
                    volte para o app e abra seu perfil.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                    >
                      Voltar para o app
                    </Link>
                    <Link
                      href="/premium"
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                    >
                      Ver recursos Premium
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900">
                Finalize sua assinatura Premium
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                O pagamento agora acontece dentro do proprio app, em ambiente
                seguro da Stripe.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Ao continuar, você concorda com a nossa{" "}
                <Link
                  href="/politicas/cancelamento-e-reembolso"
                  className="font-bold text-amber-700 hover:text-amber-800"
                >
                  politica de cancelamento e reembolso
                </Link>
                .
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Se você tiver um cupom, o campo para aplicar o código aparece
                no proprio checkout da Stripe.
              </p>
              {detectedPromotionCode && (
                <p className="mt-2 text-xs font-bold text-emerald-700">
                  Cupom detectado no link: {detectedPromotionCode}. Vamos
                  aplicar automaticamente no checkout.
                </p>
              )}
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <div className="flex items-start gap-2">
                  <BadgeInfo size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Se houver pedido de reembolso, a solicitacao e feita na hora
                    no sistema, mas o estorno no banco ou no cartao costuma
                    aparecer em aproximadamente 5 a 10 dias uteis.
                  </p>
                </div>
              </div>

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
                  {errorMessage ?? "Não foi possível abrir o checkout agora."}
                </div>
              )}

              <div
                ref={containerRef}
                className={`mt-6 min-h-[720px] overflow-hidden rounded-3xl border border-slate-200 ${
                  status === "error" ? "hidden" : "block"
                }`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
