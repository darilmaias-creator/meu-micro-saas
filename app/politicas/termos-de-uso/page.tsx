import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeInfo,
  CircleCheckBig,
  Crown,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de uso | Calculadora do Produtor",
  description:
    "Leia os termos de uso públicos da Calculadora do Produtor, incluindo acesso à conta, uso do sistema, plano Premium e regras gerais da plataforma.",
};

const LAST_UPDATED_LABEL = "26/04/2026";

export default function TermsOfUsePage() {
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
              Uso do sistema
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Termos de uso
            </h1>
            <p className="mt-4 text-sm text-slate-600">
              Esta pagina apresenta, em linguagem simples, as regras gerais de
              uso da Calculadora do Produtor, incluindo acesso ao sistema,
              recursos da conta, plano Premium e condutas esperadas durante o
              uso da plataforma.
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
                <FileText size={18} className="text-amber-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Aceite e objetivo da plataforma
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  Ao usar a Calculadora do Produtor, o usuario concorda com
                  estas regras publicas de uso. O objetivo do sistema e ajudar
                  pequenos produtores a organizar materiais, calcular preco,
                  controlar estoque, montar fichas tecnicas, criar orcamentos e
                  acompanhar a operacao.
                </p>
                <p>
                  O app pode oferecer recursos gratuitos e recursos ligados ao
                  plano Premium, conforme a configuracao e a disponibilidade da
                  conta.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CircleCheckBig size={18} className="text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Conta, acesso e responsabilidade do usuario
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  O usuario e responsavel pelas informacoes usadas no acesso da
                  propria conta e pelos dados cadastrados dentro do sistema,
                  incluindo materiais, produtos, configuracoes, orcamentos,
                  vendas, backup e demais registros criados durante o uso.
                </p>
                <p>
                  Tambem e responsabilidade do usuario revisar os dados que
                  informa ao app antes de usar esses numeros para decidir preco,
                  margem, orcamento ou estrategia de venda.
                </p>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-slate-700">
                  <p className="font-bold text-sky-900">Importante</p>
                  <p className="mt-2">
                    A Calculadora do Produtor e uma ferramenta de apoio a
                    organizacao e decisao. O usuario continua responsavel por
                    validar os dados do proprio negocio antes de aplicar esses
                    resultados em operacoes reais.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-sky-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Recursos Premium, cobranca e alteracoes
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  Parte da plataforma pode funcionar em plano gratuito, enquanto
                  alguns recursos sao disponibilizados apenas para contas com
                  assinatura Premium ativa.
                </p>
                <p>
                  Valores, recursos, limites, condicoes de uso e detalhes da
                  assinatura podem ser ajustados ao longo do tempo, sempre com
                  reflexo nas paginas publicas e no fluxo apresentado no app.
                </p>
                <p>
                  Regras especificas sobre cancelamento e reembolso da
                  assinatura Premium ficam descritas em pagina publica propria.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-700" />
                <h2 className="text-xl font-black text-slate-900">
                  Uso adequado da plataforma
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-amber-900">
                <p>Espera-se que o uso da plataforma seja feito de forma licita e adequada.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>nao usar o sistema para atividade ilegal;</li>
                  <li>nao tentar acessar contas de terceiros sem permissao;</li>
                  <li>nao tentar prejudicar a disponibilidade ou a seguranca do app;</li>
                  <li>nao usar o sistema de forma contraria a estas regras publicas.</li>
                </ul>
                <p>
                  O servico pode ser ajustado, corrigido, ampliado ou revisado
                  ao longo do tempo para melhorar seguranca, estabilidade,
                  desempenho e experiencia do usuario.
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
                <li>O usuario continua responsavel pelos dados que cadastra e usa no proprio negocio.</li>
                <li>O app ajuda no calculo e na organizacao, mas nao substitui validacao do usuario.</li>
                <li>Plano Premium pode liberar recursos extras conforme a conta.</li>
                <li>Valores e recursos podem evoluir com o tempo.</li>
                <li>Uso inadequado do sistema nao e permitido.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Paginas relacionadas
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/politicas/privacidade"
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Politica de privacidade
                </Link>
                <Link
                  href="/politicas/cancelamento-e-reembolso"
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Politica de cancelamento e reembolso
                </Link>
                <Link
                  href="/"
                  className="block rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                >
                  Abrir o aplicativo
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
