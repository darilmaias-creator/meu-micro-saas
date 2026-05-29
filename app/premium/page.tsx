"use client";

import Link from "next/link";
import { Check, X, Crown, ArrowRight } from "lucide-react";

import {
  formatBrlPriceFromCents,
  PREMIUM_FOUNDER_LIMIT,
  PREMIUM_FOUNDER_PRICE_BRL,
  PREMIUM_STANDARD_PRICE_BRL,
} from "@/lib/billing/plans";

const COMPARISON = [
  { feature: "Materiais", free: "20", premium: "Ilimitado" },
  { feature: "Produtos", free: "10", premium: "Ilimitado" },
  { feature: "Orçamentos", free: "Ilimitado", premium: "Ilimitado" },
  { feature: "Personalização (Logo, Textos)", free: false, premium: true },
  { feature: "Backup Automático", free: false, premium: true },
  { feature: "Histórico de Mudanças", free: false, premium: true },
  { feature: "Suporte Prioritário", free: false, premium: true },
];

export default function PremiumPage() {
  const founderPrice = formatBrlPriceFromCents(PREMIUM_FOUNDER_PRICE_BRL);
  const standardPrice = formatBrlPriceFromCents(PREMIUM_STANDARD_PRICE_BRL);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-slate-600">
            Comece grátis e upgrade quando precisar de mais
          </p>
        </div>

        <div className="mb-12 overflow-hidden rounded-2xl bg-white shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="p-6 text-left font-bold text-slate-900">
                  Funcionalidade
                </th>
                <th className="p-6 text-center font-bold text-slate-900">
                  Plano Grátis
                </th>
                <th className="p-6 text-center font-bold text-amber-600">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="p-6 font-semibold text-slate-900">
                    {item.feature}
                  </td>
                  <td className="p-6 text-center">
                    {typeof item.free === "boolean" ? (
                      item.free ? (
                        <Check className="mx-auto text-emerald-600" size={24} />
                      ) : (
                        <X className="mx-auto text-slate-300" size={24} />
                      )
                    ) : (
                      <span className="font-bold text-slate-900">
                        {item.free}
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    {typeof item.premium === "boolean" ? (
                      item.premium ? (
                        <Check className="mx-auto text-emerald-600" size={24} />
                      ) : (
                        <X className="mx-auto text-slate-300" size={24} />
                      )
                    ) : (
                      <span className="font-bold text-amber-600">
                        {item.premium}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Grátis</h2>
            <p className="mb-6 text-slate-600">Para começar</p>
            <div className="mb-6 text-4xl font-bold text-slate-900">
              R$ 0<span className="text-lg text-slate-600">/mês</span>
            </div>
            <button
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-slate-200 px-4 py-3 font-bold text-slate-600 disabled:opacity-50"
            >
              Seu Plano Atual
            </button>
          </div>

          <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-xl">
            <div className="absolute right-0 top-0 rounded-bl-lg bg-amber-500 px-4 py-1 text-sm font-bold text-white">
              FOUNDER
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Premium</h2>
            <p className="mb-6 text-slate-600">
              Acesso completo com valor de lançamento
            </p>
            <div className="mb-2 text-4xl font-bold text-amber-600">
              {founderPrice}
              <span className="text-lg text-slate-600">/mês</span>
            </div>
            <p className="mb-6 text-sm font-semibold text-amber-800">
              Para os {PREMIUM_FOUNDER_LIMIT} primeiros assinantes. Depois,{" "}
              {standardPrice}/mês.
            </p>
            <Link
              href="/assinatura/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 font-bold text-white transition hover:bg-amber-700"
            >
              <Crown size={20} />
              Assinar Agora
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="mb-4 text-slate-600">
            Teste Premium por 7 dias, sem cartão de crédito
          </p>
          <Link
            href="/entrar"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-8 py-3 font-bold text-white transition hover:bg-amber-700"
          >
            Começar Agora
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
