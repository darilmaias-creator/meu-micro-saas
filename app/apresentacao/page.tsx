import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Calculator,
  Check,
  ClipboardList,
  FileText,
  Package,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";
import { SEARCH_INTENT_PAGES } from "./search-intents";

export const metadata: Metadata = {
  title:
    "Calculadora para artesao | Precificacao, estoque e orcamentos",
  description:
    "Calcula Artesao e Calculadora do Produtor: sistema para artesao e pequeno produtor calcular preco de venda, controlar estoque, montar ficha tecnica e criar orcamentos.",
  keywords: [
    "calcula artesao",
    "calculadora para artesao",
    "calculadora de artesanato",
    "como precificar artesanato",
    "precificacao de artesanato",
    "preco de venda artesanato",
    "orcamento para artesanato",
    "ficha tecnica artesanato",
    "controle de estoque para artesao",
    "como calcular artesanato",
    "aplicativo para artesao",
    "calculadora do produtor",
    "sistema para artesao",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Calculadora para artesao, estoque e orcamentos",
    description:
      "Organize materiais, calcule preco de venda, monte fichas tecnicas e crie orcamentos para artesanato e pequenos produtos.",
    url: "/",
    siteName: "Calculadora do Produtor",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Calculadora para artesao",
    description:
      "Precificacao, estoque, ficha tecnica e orcamentos para artesanato em um unico lugar.",
  },
};

const features = [
  {
    icon: Boxes,
    title: "Estoque completo",
    description:
      "Cadastre insumos, medidas, custos, quantidade atual, valor parado e alerta de estoque minimo.",
  },
  {
    icon: ClipboardList,
    title: "Ficha tecnica",
    description:
      "Monte produtos usando materiais do estoque, tempo de maquina, mao de obra e custos extras.",
  },
  {
    icon: Calculator,
    title: "Preco de venda",
    description:
      "Veja custo por unidade, margem, lucro, preco sugerido e ajuste manual sem perder clareza.",
  },
  {
    icon: FileText,
    title: "Orcamentos e vendas",
    description:
      "Crie propostas, registre vendas e acompanhe o historico do que foi negociado com cada cliente.",
  },
];

const workflow = [
  {
    title: "Cadastre seus materiais",
    description:
      "Informe preco pago, medida, estoque atual e minimo para saber quanto cada material custa de verdade.",
  },
  {
    title: "Monte a ficha do produto",
    description:
      "Escolha os materiais, informe quantidade usada e inclua tempo, energia, acabamento e custos extras.",
  },
  {
    title: "Venda com margem clara",
    description:
      "Receba sugestao de preco, lucro, margem e registro para orcamento ou venda final.",
  },
];

const freePlanItems = [
  "Controle inicial de insumos",
  "Calculo de preco de venda",
  "Acesso pelo celular e computador",
];

const premiumPlanItems = [
  "Mais capacidade para organizar a operacao",
  "Orcamentos, vendas e historico",
  "Backup, restauracao e recursos avancados",
  "Ferramentas extras para comunicacao e marketing",
];

const audienceItems = [
  "Artesaos que precisam calcular preco de venda sem vender no prejuizo.",
  "Quem faz personalizados, lembrancinhas, caixas, MDF, costura, laser ou papelaria criativa.",
  "Pequenos produtores que precisam criar orcamentos claros para clientes.",
  "MEIs e negocios criativos que querem controlar materiais, estoque e margem de lucro.",
];

const faqItems = [
  {
    question: "Como precificar artesanato de um jeito mais seguro?",
    answer:
      "O caminho mais confiavel e reunir custo de material, tempo, despesas extras e margem de lucro. A Calculadora do Produtor organiza esse processo em um unico lugar.",
  },
  {
    question: "A calculadora serve para orcamento de artesanato?",
    answer:
      "Sim. Alem de ajudar na precificacao, o sistema tambem ajuda a montar orcamentos mais claros para o cliente entender o valor final.",
  },
  {
    question: "Funciona para quem faz personalizados e sob encomenda?",
    answer:
      "Sim. O app atende rotinas de quem trabalha com personalizados, caixas, MDF, costura, papelaria criativa, laser e outras producoes sob encomenda.",
  },
];

const homeStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Calculadora do Produtor",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, Windows",
    url: "https://calculaartesao.com.br",
    description:
      "Sistema para artesao e pequeno produtor calcular preco de venda, controlar estoque, montar ficha tecnica e criar orcamentos.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

function PlanItem({ children, premium = false }: { children: React.ReactNode; premium?: boolean }) {
  return (
    <li className="flex gap-3 text-sm leading-6">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          premium ? "bg-amber-300 text-slate-950" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Check size={13} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function PresentationPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(252,211,77,0.58),_transparent_34rem),linear-gradient(180deg,_#fff8e1_0%,_#f8fafc_42%,_#ffffff_100%)] text-slate-950">
      {homeStructuredData.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          key={index}
          type="application/ld+json"
        />
      ))}

      <header className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-6 py-6">
        <Link href="/" className="flex items-center gap-3 font-black tracking-[-0.03em]">
          <img
            src={DEFAULT_STORE_LOGO}
            alt="Logo da Calculadora do Produtor"
            className="h-14 w-14 rounded-2xl bg-white shadow-[0_16px_36px_rgba(154,79,0,0.18)]"
          />
          <span>Calculadora do Produtor</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-600 lg:flex">
          <a href="#funcionalidades" className="transition-colors hover:text-amber-700">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-amber-700">
            Como funciona
          </a>
          <a href="#planos" className="transition-colors hover:text-amber-700">
            Planos
          </a>
        </nav>

        <Link
          href="/entrar"
          className="inline-flex items-center justify-center rounded-full border border-amber-900/15 bg-white px-5 py-3 text-sm font-black text-amber-800 transition-transform hover:-translate-y-0.5"
        >
          Entrar no app
        </Link>
      </header>

      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-12 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-900">
            <Smartphone size={14} />
            Estoque, preco e vendas no mesmo lugar
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.08em] text-slate-950 sm:text-6xl lg:text-7xl">
            Calcule com clareza. Venda com seguranca.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            A Calculadora do Produtor ajuda pequenos produtores a organizar
            materiais, montar fichas tecnicas, calcular preco de venda, criar
            orcamentos e acompanhar o negocio sem depender de planilhas confusas.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/entrar"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-[0_16px_36px_rgba(15,23,42,0.2)] transition-transform hover:-translate-y-0.5"
            >
              Comecar agora
              <ArrowRight size={18} />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center justify-center rounded-full border border-amber-900/15 bg-white px-6 py-4 text-sm font-black text-amber-800 transition-transform hover:-translate-y-0.5"
            >
              Ver funcionalidades
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-950/10 bg-white/75 p-5">
              <strong className="block text-3xl font-black tracking-[-0.05em]">1</strong>
              <span className="text-sm text-slate-600">sistema para estoque, preco e vendas</span>
            </div>
            <div className="rounded-3xl border border-slate-950/10 bg-white/75 p-5">
              <strong className="block text-3xl font-black tracking-[-0.05em]">0</strong>
              <span className="text-sm text-slate-600">planilhas soltas para controlar</span>
            </div>
            <div className="rounded-3xl border border-slate-950/10 bg-white/75 p-5">
              <strong className="block text-3xl font-black tracking-[-0.05em]">24h</strong>
              <span className="text-sm text-slate-600">acesso pelo celular ou computador</span>
            </div>
          </div>
        </div>

        <div className="relative rounded-[38px] border border-amber-900/15 bg-white/90 p-4 shadow-[0_36px_90px_rgba(154,79,0,0.24)]">
          <div className="absolute inset-[-16px] -z-10 rounded-[46px] bg-gradient-to-br from-amber-500/30 to-blue-700/15 blur-xl" />
          <div className="rounded-[26px] bg-amber-600 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={DEFAULT_STORE_LOGO}
                  alt=""
                  className="h-16 w-16 rounded-2xl bg-white"
                />
                <div>
                  <strong className="block text-lg">Calculadora do Produtor</strong>
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                    Negocio organizado
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-black">R$</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[28px] border border-slate-950/10 bg-white p-5">
              <div className="flex items-center gap-2 font-black text-amber-700">
                <Package size={18} />
                Novo insumo
              </div>
              <div className="mt-4 h-11 rounded-xl bg-slate-100" />
              <div className="mt-3 h-11 rounded-xl bg-slate-100" />
              <div className="mt-3 h-11 rounded-xl bg-slate-100" />
              <div className="mt-3 h-11 rounded-xl bg-slate-100" />
            </div>

            <div className="rounded-[28px] border border-slate-950/10 bg-white p-5">
              <div className="flex items-center gap-2 font-black text-slate-800">
                <BarChart3 size={18} />
                Controle de estoque
              </div>
              {[
                ["MDF 3mm", "Area", "OK"],
                ["Barbante", "Peso", "OK"],
                ["Fita cetim", "Compr.", "Comprar"],
              ].map(([name, type, status]) => (
                <div
                  key={name}
                  className="grid grid-cols-[1.3fr_0.7fr_0.8fr] gap-2 border-b border-slate-100 py-4 text-sm font-black text-slate-700 last:border-b-0"
                >
                  <span>{name}</span>
                  <span>{type}</span>
                  <span className={status === "OK" ? "text-emerald-600" : "text-red-500"}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="mb-9 max-w-3xl">
          <h2 className="text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Funcionalidades para quem produz, vende e precisa decidir rapido.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            A pagina mostra o valor real para quem trabalha com materiais,
            producao artesanal, laser, personalizados ou pequenos lotes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="min-h-[230px] rounded-[30px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/15 text-amber-800">
                  <Icon size={22} />
                </div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  0{index + 1}
                </p>
                <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16">
        <div className="grid gap-7 rounded-[38px] border border-amber-900/15 bg-white p-7 shadow-[0_20px_54px_rgba(15,23,42,0.06)] lg:grid-cols-[0.9fr_1.1fr] lg:p-9">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
              Calcula Artesao
            </p>
            <h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Uma calculadora para artesao que precisa precificar com seguranca.
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              Se voce trabalha com artesanato, produtos personalizados ou
              producao sob encomenda, a Calculadora do Produtor ajuda a somar
              materiais, tempo, custos, margem de lucro, estoque e orcamento em
              uma rotina simples de usar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {audienceItems.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-950/10 bg-amber-50/70 p-5 text-sm font-bold leading-7 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16">
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Buscas relacionadas
          </p>
          <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Paginas feitas para quem pesquisa de formas diferentes.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Nem todo mundo procura do mesmo jeito. Algumas pessoas buscam
            calculadora para artesao, outras pesquisam sobre precificacao de
            artesanato, controle de estoque ou orcamento para encomendas.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SEARCH_INTENT_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="rounded-[30px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-1"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                {page.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {page.metadataTitle}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">{page.metadataDescription}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="mb-9 max-w-3xl">
          <h2 className="text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Um fluxo simples para transformar material em preco justo.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            O usuario nao precisa entender de formula: ele informa dados reais e
            o sistema organiza o calculo.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white"
            >
              <span className="block text-7xl font-black leading-none tracking-[-0.08em] text-white/20">
                0{index + 1}
              </span>
              <h3 className="mt-7 text-2xl font-black">{step.title}</h3>
              <p className="mt-3 leading-7 text-white/70">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Respostas curtas para quem quer calcular artesanato com mais confianca.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Essas respostas ajudam o visitante e tambem reforcam para o Google
            quais problemas a Calculadora do Produtor resolve na pratica.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {faqItems.map((item) => (
            <article
              key={item.question}
              className="rounded-[32px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
            >
              <h3 className="text-xl font-black text-slate-950">{item.question}</h3>
              <p className="mt-4 leading-8 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="mb-9 max-w-3xl">
          <h2 className="text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Comece simples e libere mais controle quando o negocio crescer.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            O gratis funciona como entrada. O Premium e a evolucao natural para
            manter a operacao mais completa.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[34px] border border-slate-950/10 bg-white p-7">
            <h3 className="text-2xl font-black text-slate-950">Plano gratis</h3>
            <p className="mt-3 leading-7 text-slate-600">
              Ideal para testar o sistema e organizar os primeiros materiais e produtos.
            </p>
            <ul className="mt-6 grid gap-3">
              {freePlanItems.map((item) => (
                <PlanItem key={item}>{item}</PlanItem>
              ))}
            </ul>
          </article>

          <article className="rounded-[34px] bg-gradient-to-br from-slate-950 to-slate-700 p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
              <Sparkles size={14} />
              Premium
            </div>
            <h3 className="mt-4 text-2xl font-black">Mais controle para crescer</h3>
            <p className="mt-3 leading-7 text-white/70">
              Para quem quer manter a operacao completa e vender com mais seguranca.
            </p>
            <ul className="mt-6 grid gap-3">
              {premiumPlanItems.map((item) => (
                <PlanItem key={item} premium>
                  {item}
                </PlanItem>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="flex flex-col justify-between gap-7 overflow-hidden rounded-[42px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_18rem),linear-gradient(135deg,_#d97706,_#92400e)] p-8 text-white sm:p-11 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              Menos chute. Mais controle.
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-white/80">
              A pagina ajuda o visitante a entender rapidamente por que o
              sistema existe, como funciona e qual problema resolve antes de
              entrar no app.
            </p>
          </div>
          <Link
            href="/entrar"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-amber-900 transition-transform hover:-translate-y-0.5"
          >
            Testar a calculadora
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
