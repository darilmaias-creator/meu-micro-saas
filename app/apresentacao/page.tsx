import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Calculator,
  Check,
  ClipboardList,
  Crown,
  FileText,
  Package,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";
import { listPublishedTestimonials } from "@/lib/testimonials/store";
import { Reveal } from "./Reveal";
import { SEARCH_INTENT_PAGES } from "./search-intents";

export const metadata: Metadata = {
  title:
    "Calculadora para artesão | Precificação, estoque e orçamentos",
  description:
    "Calcula Artesão e Calculadora do Produtor: sistema para artesão e pequeno produtor calcular preço de venda, controlar estoque, montar ficha técnica e criar orçamentos.",
  keywords: [
    "calcula artesão",
    "calculadora para artesão",
    "calculadora de artesanato",
    "como precificar artesanato",
    "precificação de artesanato",
    "preço de venda artesanato",
    "orçamento para artesanato",
    "ficha técnica artesanato",
    "controle de estoque para artesão",
    "como calcular artesanato",
    "aplicativo para artesão",
    "calculadora do produtor",
    "sistema para artesão",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Calculadora para artesão, estoque e orçamentos",
    description:
      "Organize materiais, calcule preço de venda, monte fichas técnicas e crie orçamentos para artesanato e pequenos produtos.",
    url: "/",
    siteName: "Calculadora do Produtor",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Calculadora para artesão",
    description:
      "Precificação, estoque, ficha técnica e orçamentos para artesanato em um único lugar.",
  },
};

const features = [
  {
    icon: Boxes,
    title: "Estoque completo",
    description:
      "Cadastre insumos, medidas, custos, quantidade atual, valor parado e alerta de estoque mínimo.",
  },
  {
    icon: ClipboardList,
    title: "Ficha técnica",
    description:
      "Monte produtos usando materiais do estoque, tempo de máquina, mão de obra e custos extras.",
  },
  {
    icon: Calculator,
    title: "Preço de venda",
    description:
      "Veja custo por unidade, margem, lucro, preço sugerido e ajuste manual sem perder clareza.",
  },
  {
    icon: FileText,
    title: "Orçamentos e vendas",
    description:
      "Crie propostas, registre vendas e acompanhe o histórico do que foi negociado com cada cliente.",
  },
];

const workflow = [
  {
    title: "Cadastre seus materiais",
    description:
      "Informe preço pago, medida, estoque atual e mínimo para saber quanto cada material custa de verdade.",
  },
  {
    title: "Monte a ficha do produto",
    description:
      "Escolha os materiais, informe quantidade usada e inclua tempo, energia, acabamento e custos extras.",
  },
  {
    title: "Venda com margem clara",
    description:
      "Receba sugestão de preço, lucro, margem e registro para orçamento ou venda final.",
  },
];

const freePlanItems = [
  "Controle inicial de insumos",
  "Cálculo de preço de venda",
  "Acesso pelo celular e computador",
];

const premiumPlanItems = [
  "Mais capacidade para organizar a operação",
  "Orçamentos, vendas e histórico",
  "Backup, restauração e recursos avançados",
  "Ferramentas extras para comunicação e marketing",
];

const audienceItems = [
  "Artesãos que precisam calcular preço de venda sem vender no prejuízo.",
  "Quem faz personalizados, lembrancinhas, caixas, MDF, costura, laser ou papelaria criativa.",
  "Pequenos produtores que precisam criar orçamentos claros para clientes.",
  "MEIs e negócios criativos que querem controlar materiais, estoque e margem de lucro.",
];

const footerSections = [
  {
    title: "Navegação",
    links: [
      { href: "#funcionalidades", label: "Funcionalidades" },
      { href: "#como-funciona", label: "Como funciona" },
      { href: "#planos", label: "Planos" },
      { href: "/central-de-conteudos", label: "Central de conteudos" },
      { href: "/entrar", label: "Entrar no app" },
    ],
  },
  {
    title: "Páginas públicas",
    links: SEARCH_INTENT_PAGES.slice(0, 5).map((page) => ({
      href: `/${page.slug}`,
      label: page.eyebrow,
    })),
  },
  {
    title: "Segurança",
    links: [
      {
        href: "/politicas/termos-de-uso",
        label: "Termos de uso",
      },
      {
        href: "/politicas/privacidade",
        label: "Politica de privacidade",
      },
      {
        href: "/politicas/cancelamento-e-reembolso",
        label: "Política Premium",
      },
      { href: "/entrar", label: "Acessar calculadora" },
    ],
  },
];

const faqItems = [
  {
    question: "Como precificar artesanato de um jeito mais seguro?",
    answer:
      "O caminho mais confiável e reunir custo de material, tempo, despesas extras e margem de lucro. A Calculadora do Produtor organiza esse processo em um único lugar.",
  },
  {
    question: "A calculadora serve para orçamento de artesanato?",
    answer:
      "Sim. Além de ajudar na precificação, o sistema também ajuda a montar orçamentos mais claros para o cliente entender o valor final.",
  },
  {
    question: "Funciona para quem faz personalizados e sob encomenda?",
    answer:
      "Sim. O app atende rotinas de quem trabalha com personalizados, caixas, MDF, costura, papelaria criativa, laser e outras produções sob encomenda.",
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
      "Sistema para artesão e pequeno produtor calcular preço de venda, controlar estoque, montar ficha técnica e criar orçamentos.",
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

export default async function PresentationPage() {
  const testimonials = await listPublishedTestimonials(6);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.32),_transparent_24rem),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.14),_transparent_28rem),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_42%,_#ffffff_100%)] text-slate-950">
      {homeStructuredData.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          key={index}
          type="application/ld+json"
        />
      ))}

      <div className="sticky top-0 z-50 border-b border-white/40">
        <header className="marketing-glass mx-auto mt-3 flex w-[min(1180px,calc(100%-24px))] items-center justify-between gap-6 rounded-[28px] px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-slate-950">
            <img
              src={DEFAULT_STORE_LOGO}
              alt="Logo da Calculadora do Produtor"
              className="h-14 w-14 rounded-2xl bg-white shadow-[0_16px_36px_rgba(154,79,0,0.18)]"
            />
            <div>
              <span className="block text-base font-extrabold tracking-[-0.03em]">
                Calculadora do Produtor
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Preco, estoque e orcamentos
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#funcionalidades" className="transition-colors hover:text-amber-800">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-amber-800">
              Como funciona
            </a>
            <a href="#planos" className="transition-colors hover:text-amber-800">
              Planos
            </a>
          </nav>

          <Link
            href="/entrar"
            className="inline-flex items-center justify-center rounded-full border border-amber-900/10 bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
          >
            Entrar no app
          </Link>
        </header>
      </div>

      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.02fr_0.98fr]">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-900 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <Smartphone size={14} />
              Estoque, preco e vendas no mesmo lugar
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-[-0.07em] text-slate-950 sm:text-6xl lg:text-7xl">
              Calcule com clareza. Venda com segurança.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              A Calculadora do Produtor ajuda pequenos produtores a organizar
              materiais, montar fichas tecnicas, calcular preco de venda, criar
              orcamentos e acompanhar o negocio sem depender de planilhas confusas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/entrar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
              >
                Comecar agora
                <ArrowRight size={18} />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center justify-center rounded-full border border-amber-900/10 bg-white px-6 py-4 text-sm font-extrabold text-amber-900 transition-transform hover:-translate-y-0.5"
              >
                Ver funcionalidades
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  value: "Mais clareza",
                  text: "para precificar sem vender no escuro",
                },
                {
                  icon: TrendingUp,
                  value: "Mais controle",
                  text: "sobre materiais, margem e operação",
                },
                {
                  icon: Smartphone,
                  value: "Acesso 24h",
                  text: "pelo celular ou computador",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <Reveal delay={120 + index * 90} key={item.value}>
                    <div className="marketing-card rounded-[28px] border border-slate-950/8 bg-white/82 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.05)]">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
                        <Icon size={18} />
                      </div>
                      <strong className="block text-lg font-extrabold tracking-[-0.03em] text-slate-950">
                        {item.value}
                      </strong>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">
                        {item.text}
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative rounded-[40px] border border-amber-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,248,235,0.96))] p-5 shadow-[0_42px_90px_rgba(15,23,42,0.12)]">
            <div className="absolute inset-[-18px] -z-10 rounded-[48px] bg-gradient-to-br from-amber-400/25 via-transparent to-teal-700/14 blur-2xl" />

            <div className="rounded-[28px] bg-[linear-gradient(135deg,_#0f172a,_#1e293b)] p-5 text-white shadow-[0_20px_48px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={DEFAULT_STORE_LOGO}
                    alt=""
                    className="h-16 w-16 rounded-2xl bg-white object-contain"
                  />
                  <div>
                    <strong className="block text-lg font-extrabold">
                      Calculadora do Produtor
                    </strong>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
                      Negocio organizado
                    </span>
                  </div>
                </div>
                <div className="marketing-glass rounded-2xl px-4 py-2 text-right text-slate-950">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Preco sugerido
                  </span>
                  <strong className="text-xl font-extrabold tracking-[-0.04em]">
                    R$ 55,00
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
              <div className="marketing-card rounded-[30px] border border-slate-950/8 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 font-extrabold text-amber-700">
                  <Package size={18} />
                  Novo insumo
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Nome do material",
                    "Preço pago",
                    "Quantidade comprada",
                    "Estoque atual",
                  ].map((line) => (
                    <div key={line} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-sm text-slate-500">{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="marketing-card rounded-[30px] border border-slate-950/8 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 font-extrabold text-slate-800">
                  <BarChart3 size={18} />
                  Controle de estoque
                </div>
                <div className="mt-4 space-y-4">
                  {[
                    ["MDF 3mm", "Área", "OK"],
                    ["Barbante", "Peso", "OK"],
                    ["Fita cetim", "Compr.", "Comprar"],
                  ].map(([name, type, status]) => (
                    <div
                      key={name}
                      className="grid grid-cols-[1.3fr_0.7fr_0.8fr] items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold text-slate-700 last:border-b-0 last:pb-0"
                    >
                      <span>{name}</span>
                      <span>{type}</span>
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${
                          status === "OK"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="funcionalidades" className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <h2 className="text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Funcionalidades para quem produz, vende e precisa decidir rapido.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              A pagina mostra o valor real para quem trabalha com materiais,
              producao artesanal, laser, personalizados ou pequenos lotes.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal delay={index * 90} key={feature.title}>
                <article className="marketing-card min-h-[230px] rounded-[30px] border border-slate-950/8 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/12 text-amber-800">
                    <Icon size={22} />
                  </div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    0{index + 1}
                  </p>
                  <h3 className="text-xl font-extrabold tracking-[-0.03em] text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16">
        <Reveal>
          <div className="grid gap-7 rounded-[38px] border border-amber-900/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(255,248,235,0.92))] p-7 shadow-[0_20px_54px_rgba(15,23,42,0.06)] lg:grid-cols-[0.9fr_1.1fr] lg:p-9">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
                Calcula Artesao
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-4xl">
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
              {audienceItems.map((item, index) => (
                <Reveal delay={80 + index * 70} key={item}>
                  <div className="marketing-card rounded-3xl border border-slate-950/8 bg-white/88 p-5 text-sm font-semibold leading-7 text-slate-700">
                    {item}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
              Dicas da calculadora
            </p>
            <h2 className="mt-3 text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Aprenda a usar a calculadora no seu ateliê.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Aqui você encontra páginas práticas para aplicar no dia a dia:
              precificação, controle de estoque, orçamento e organização da
              produção artesanal.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SEARCH_INTENT_PAGES.map((page, index) => (
            <Reveal delay={index * 80} key={page.slug}>
              <Link
                href={`/${page.slug}`}
                className="marketing-card block rounded-[30px] border border-slate-950/8 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">
                  {page.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {page.metadataTitle}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{page.metadataDescription}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16">
          <Reveal>
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
                Experiencias reais
              </p>
              <h2 className="mt-3 text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
                Quem usa o app ja comecou a sentir mais clareza no negocio.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Os depoimentos so aparecem depois de pelo menos 7 dias de uso, para
                trazer uma leitura mais sincera da experiencia real com o app.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal delay={index * 80} key={testimonial.id}>
                <article className="marketing-card rounded-[32px] border border-slate-950/8 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
                      <Quote size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-950">{testimonial.authorName}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Usuario do app
                      </p>
                    </div>
                  </div>
                  <p className="leading-8 text-slate-600">“{testimonial.message}”</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section id="como-funciona" className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <h2 className="text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Um fluxo simples para transformar material em preco justo.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              O usuario nao precisa entender de formula: ele informa dados reais e
              o sistema organiza o calculo.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <Reveal delay={index * 90} key={step.title}>
              <article className="marketing-card overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,_#0f172a,_#1e293b)] p-7 text-white shadow-[0_22px_58px_rgba(15,23,42,0.18)]">
                <span className="block text-7xl font-extrabold leading-none tracking-[-0.08em] text-white/20">
                  0{index + 1}
                </span>
                <h3 className="mt-7 text-2xl font-extrabold">{step.title}</h3>
                <p className="mt-3 leading-7 text-white/72">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
              FAQ
            </p>
            <h2 className="mt-3 text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Respostas curtas para quem quer calcular artesanato com mais confianca.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Essas respostas ajudam o visitante e tambem reforcam para o Google
              quais problemas a Calculadora do Produtor resolve na pratica.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {faqItems.map((item, index) => (
            <Reveal delay={index * 70} key={item.question}>
              <article className="marketing-card rounded-[32px] border border-slate-950/8 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
                <h3 className="text-xl font-extrabold tracking-[-0.03em] text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-4 leading-8 text-slate-600">{item.answer}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <h2 className="text-4xl font-extrabold leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Comece simples e libere mais controle quando o negocio crescer.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              O gratis funciona como entrada. O Premium e a evolucao natural para
              manter a operacao mais completa.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <article className="marketing-card rounded-[34px] border border-slate-950/8 bg-white p-7 shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
              <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
                Plano gratis
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Ideal para testar o sistema e organizar os primeiros materiais e produtos.
              </p>
              <ul className="mt-6 grid gap-3">
                {freePlanItems.map((item) => (
                  <PlanItem key={item}>{item}</PlanItem>
                ))}
              </ul>
            </article>
          </Reveal>

          <Reveal delay={90}>
            <article className="marketing-card relative rounded-[36px] border border-amber-300/40 bg-[linear-gradient(135deg,_#0f172a,_#1e293b_48%,_#b45309_140%)] p-8 text-white shadow-[0_36px_90px_rgba(15,23,42,0.24)]">
              <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-950 shadow-[0_12px_24px_rgba(251,191,36,0.25)]">
                <Sparkles size={14} />
                Mais escolhido
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-amber-100">
                <Crown size={14} />
                Premium
              </div>
              <h3 className="mt-4 text-3xl font-extrabold tracking-[-0.04em]">
                Mais controle para crescer
              </h3>
              <p className="mt-3 max-w-xl leading-7 text-white/74">
                Para quem quer manter a operacao completa, transmitir mais profissionalismo e vender com mais seguranca.
              </p>
              <ul className="mt-6 grid gap-3">
                {premiumPlanItems.map((item) => (
                  <PlanItem key={item} premium>
                    {item}
                  </PlanItem>
                ))}
              </ul>
              <div className="mt-7 rounded-[26px] border border-white/10 bg-white/8 px-5 py-4 text-sm text-white/78">
                O Premium foi pensado para quem quer sair do improviso e manter o negocio com mais clareza, organizacao e apresentacao melhor ao cliente.
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <Reveal>
          <div className="flex flex-col justify-between gap-7 overflow-hidden rounded-[42px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_18rem),linear-gradient(135deg,_#d97706,_#92400e)] p-8 text-white shadow-[0_30px_70px_rgba(146,64,14,0.2)] sm:p-11 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-4xl font-extrabold leading-none tracking-[-0.05em] sm:text-5xl">
                Menos chute. Mais controle.
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-white/82">
                A pagina ajuda o visitante a entender rapidamente por que o
                sistema existe, como funciona e qual problema resolve antes de
                entrar no app.
              </p>
            </div>
            <Link
              href="/entrar"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-extrabold text-amber-900 transition-transform hover:-translate-y-0.5"
            >
              Testar a calculadora
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(255,248,235,0.78))]">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 py-14 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={DEFAULT_STORE_LOGO}
                alt="Logo da Calculadora do Produtor"
                className="h-14 w-14 rounded-2xl bg-white shadow-[0_16px_36px_rgba(154,79,0,0.12)]"
              />
              <div>
                <p className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">
                  Calculadora do Produtor
                </p>
                <p className="text-sm leading-7 text-slate-600">
                  Precificacao, estoque, ficha tecnica, orcamentos e vendas em um unico lugar para artesaos e pequenos produtores.
                </p>
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                {section.title}
              </p>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-semibold leading-6 text-slate-600 transition-colors hover:text-amber-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200/80">
          <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-3 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>© 2026 Calculadora do Produtor. Todos os direitos reservados.</span>
            <span>Feita para quem precisa precificar, vender e organizar com mais seguranca.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
