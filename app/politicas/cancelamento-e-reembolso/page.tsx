import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeInfo, Crown, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de cancelamento e reembolso | Calcula Artesão",
  description:
    "Regras publicas de cancelamento, reembolso e renovacao da assinatura Premium da Calcula Artesão.",
};

const LAST_UPDATED_LABEL = "12/04/2026";

export default function BillingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Voltar para o app
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-800">
            <BadgeInfo size={14} />
            Politica publica
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Cancelamento e reembolso
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Politica da assinatura Premium
            </h1>
            <p className="mt-4 text-sm text-slate-600">
              Esta pagina explica, em linguagem simples, como funciona a
              assinatura Premium da Calcula Artesão, quando o
              cancelamento pode ser pedido e em quais casos o reembolso integral
              esta disponivel.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Atualizado em {LAST_UPDATED_LABEL}
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Como funciona a assinatura
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  A assinatura Premium e mensal e libera funcoes extras no app,
                  como troca de foto, alteracao de nome sem limite e recursos
                  pagos relacionados ao plano.
                </p>
                <p>
                  A cobranca e processada pela Stripe em ambiente seguro. A
                  renovacao acontece de forma recorrente enquanto a assinatura
                  permanecer ativa.
                </p>
                <p>
                  Em alguns meios de pagamento, como boleto, a confirmacao pode
                  levar mais tempo. Nesses casos, o Premium so e liberado depois
                  que a Stripe confirmar o pagamento.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Reembolso integral em ate 7 dias
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  A assinatura Premium pode receber pedido de reembolso integral
                  em ate 7 dias corridos apos a liberacao do Premium na conta.
                </p>
                <p>
                  Quando o reembolso integral e aprovado, o acesso ao Premium e
                  encerrado e a conta volta ao plano gratis.
                </p>
                <p>
                  O prazo de 7 dias passa a contar da data em que o Premium foi
                  efetivamente ativado no app, e nao apenas do momento em que a
                  tentativa de pagamento foi iniciada.
                </p>
                <p>
                  Depois desse prazo, o reembolso integral automatico deixa de
                  ficar disponivel no app.
                </p>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-slate-700">
                  <p className="font-bold text-sky-900">
                    Importante sobre o prazo do estorno
                  </p>
                  <p className="mt-2">
                    Quando o pedido de reembolso e feito no app, a solicitacao
                    segue para a Stripe no mesmo momento.
                  </p>
                  <p className="mt-2">
                    O dinheiro, porem, nao costuma voltar na hora para o
                    cliente. O mais comum e o banco ou a operadora do cartao
                    mostrarem o estorno em aproximadamente 5 a 10 dias uteis.
                  </p>
                  <p className="mt-2">
                    Em alguns casos, a compra pode simplesmente desaparecer do
                    extrato em vez de aparecer como uma linha separada de
                    credito. Isso acontece quando o banco trata o estorno como
                    reversao.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BadgeInfo size={18} className="text-sky-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Cancelamento da assinatura
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  A assinatura pode ser gerenciada pela area de gerenciamento da
                  Stripe liberada dentro do app para assinaturas ativas.
                </p>
                <p>
                  O cancelamento encerra a continuidade da assinatura conforme
                  as condicoes exibidas no momento do gerenciamento e impede
                  novas cobrancas futuras relacionadas a esse plano.
                </p>
                <p>
                  Se existir um pedido de reembolso integral dentro da janela de
                  7 dias, o Premium pode ser encerrado imediatamente apos a
                  devolucao do valor.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-700" />
                <h2 className="text-xl font-black text-slate-900">
                  Regra especial para valor founder
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-amber-900">
                <p>
                  Algumas contas entram em uma oferta de lancamento com valor
                  reduzido para os primeiros assinantes.
                </p>
                <p>
                  Se uma conta com esse beneficio solicitar reembolso integral,
                  o valor promocional de lancamento e encerrado nessa conta e
                  nao fica reservado para uma assinatura futura.
                </p>
                <p>
                  Caso a mesma conta volte a assinar depois, a nova assinatura
                  segue o valor vigente no momento da recompra.
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Resumo rapido
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Assinatura mensal com renovacao recorrente.</li>
                <li>Reembolso integral em ate 7 dias apos liberar o Premium.</li>
                <li>Pedido de reembolso e enviado na hora, mas o estorno costuma aparecer em 5 a 10 dias uteis.</li>
                <li>Boleto pode demorar para confirmar e liberar o plano.</li>
                <li>Founder perde o valor promocional se pedir reembolso.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Onde encontrar isso no app
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                As acoes de assinatura, gerenciamento e reembolso aparecem na
                area de perfil da conta quando o plano Premium esta disponivel
                ou ativo.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700"
              >
                Abrir o aplicativo
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
