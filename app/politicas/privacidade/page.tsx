import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeInfo,
  Database,
  FileLock2,
  Mail,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de privacidade | Calculadora do Produtor",
  description:
    "Entenda, em linguagem simples, como a Calculadora do Produtor trata dados de conta, autenticacao, cobranca, backup e comunicacoes do app.",
};

const LAST_UPDATED_LABEL = "26/04/2026";

export default function PrivacyPolicyPage() {
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
              Privacidade e dados
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Politica de privacidade
            </h1>
            <p className="mt-4 text-sm text-slate-600">
              Esta pagina explica, em linguagem simples, quais dados podem ser
              usados para operar a Calculadora do Produtor, por que esses dados
              existem no sistema e como eles se relacionam com autenticacao,
              cobranca, backup, e-mails e recursos opcionais do app.
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
                <Database size={18} className="text-amber-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Quais dados o app pode tratar
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  Para o funcionamento da conta, o app pode tratar dados como
                  nome, e-mail, foto de perfil, metodo de acesso usado na conta
                  e informacoes tecnicas ligadas ao plano.
                </p>
                <p>
                  Para o funcionamento do sistema em si, o app tambem pode
                  armazenar os dados que voce cadastrar, como materiais,
                  produtos, fichas tecnicas, orcamentos, vendas, configuracoes,
                  backup, preferencia de conta e outros registros ligados ao uso
                  da ferramenta.
                </p>
                <p>
                  Se voce usar recursos opcionais, o app tambem pode tratar
                  dados relacionados a envio de backup por e-mail, recuperacao
                  de senha, depoimento enviado por voce e historico da
                  assinatura Premium.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Como esses dados sao usados
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Os dados do app sao usados principalmente para:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>autenticar a conta e manter o acesso seguro;</li>
                  <li>salvar materiais, produtos, vendas e configuracoes;</li>
                  <li>sincronizar o uso da conta entre dispositivos;</li>
                  <li>enviar recuperacao de senha e e-mails ligados ao app;</li>
                  <li>processar cobranca, assinatura, cancelamento e reembolso do Premium;</li>
                  <li>gerar, exportar e enviar backups quando voce pedir ou configurar;</li>
                  <li>publicar depoimentos apenas quando voce enviar esse conteudo de forma voluntaria.</li>
                </ul>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-slate-700">
                  <p className="font-bold text-sky-900">Importante</p>
                  <p className="mt-2">
                    O app usa os dados para operar o servico e melhorar a
                    experiencia de uso. O envio de depoimento e opcional e so
                    acontece por acao direta do usuario dentro do app.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FileLock2 size={18} className="text-sky-600" />
                <h2 className="text-xl font-black text-slate-900">
                  Servicos e ferramentas envolvidos
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  A Calculadora do Produtor pode usar servicos de terceiros para
                  operar partes especificas do sistema, como autenticacao,
                  armazenamento, cobranca e envio de e-mails.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Google, quando voce escolhe entrar com conta Google;</li>
                  <li>Stripe, para assinatura Premium, checkout, cancelamento e reembolso;</li>
                  <li>servicos de e-mail, para recuperacao de senha e backups enviados por e-mail;</li>
                  <li>infraestrutura de banco e sincronizacao usada pelo proprio app.</li>
                </ul>
                <p>
                  Dados de pagamento, como numero completo de cartao, nao sao
                  armazenados diretamente pela interface principal do app. O
                  processamento de pagamento acontece no ambiente do provedor de
                  cobranca usado para a assinatura.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-amber-700" />
                <h2 className="text-xl font-black text-slate-900">
                  Backup, contato e atualizacoes desta politica
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-amber-900">
                <p>
                  Quando voce configura backup por e-mail, o sistema usa o
                  endereco informado por voce para enviar o arquivo exportado da
                  conta conforme a sua configuracao ou a sua solicitacao manual.
                </p>
                <p>
                  Esta politica pode ser atualizada quando o app ganhar novos
                  recursos, novas integracoes ou mudancas relevantes na forma de
                  operar a conta.
                </p>
                <p>
                  Sempre que houver uma alteracao importante no texto publico,
                  esta pagina passara a mostrar a data da ultima atualizacao.
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
                <li>O app trata dados da conta e dados cadastrados por voce no sistema.</li>
                <li>Login com Google e opcional.</li>
                <li>Pagamentos Premium usam provedor de cobranca dedicado.</li>
                <li>Recuperacao de senha e backup por e-mail dependem do e-mail configurado.</li>
                <li>Depoimento so aparece se voce enviar isso de forma voluntaria.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Paginas relacionadas
              </h2>
              <div className="mt-4 space-y-3">
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
