import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";

import type { SearchIntentPageContent } from "./search-intents";
import { SEARCH_INTENT_PAGES } from "./search-intents";

const SITE_URL = "https://calculaartesao.com.br";

function StructuredData({ content }: { content: SearchIntentPageContent }) {
  const pageUrl = `${SITE_URL}/${content.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.metadataTitle,
    description: content.metadataDescription,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Calculadora do Produtor",
      url: SITE_URL,
    },
    about: [
      "artesanato",
      "precificacao",
      "orcamentos",
      "estoque",
      "ficha tecnica",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
        {title}
      </h2>
      <div className="mt-4 text-lg leading-8 text-slate-600">{description}</div>
    </div>
  );
}

function ExampleCard({
  title,
  description,
  bullets,
  result,
}: NonNullable<SearchIntentPageContent["example"]>) {
  return (
    <article className="rounded-[34px] border border-amber-900/15 bg-[linear-gradient(180deg,_rgba(255,251,235,0.95),_rgba(255,255,255,0.98))] p-7 shadow-[0_24px_60px_rgba(154,79,0,0.1)] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
        Exemplo pratico
      </p>
      <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
        {title}
      </h3>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
        {description}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {bullets.map((bullet, index) => (
          <div
            key={bullet}
            className="rounded-[26px] border border-slate-950/10 bg-white/90 p-5"
          >
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-800">
              {index + 1}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{bullet}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-[24px] border border-emerald-900/10 bg-emerald-50/80 p-5 text-base leading-8 text-emerald-900">
        {result}
      </p>
    </article>
  );
}

export function SearchIntentPage({
  content,
}: {
  content: SearchIntentPageContent;
}) {
  const relatedPages = SEARCH_INTENT_PAGES.filter(
    (page) => page.slug !== content.slug,
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(252,211,77,0.58),_transparent_34rem),linear-gradient(180deg,_#fff8e1_0%,_#f8fafc_42%,_#ffffff_100%)] text-slate-950">
      <StructuredData content={content} />

      <header className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-6 py-6">
        <Link href="/" className="flex items-center gap-3 font-black tracking-[-0.03em]">
          <img
            src={DEFAULT_STORE_LOGO}
            alt="Logo da Calculadora do Produtor"
            className="h-14 w-14 rounded-2xl bg-white shadow-[0_16px_36px_rgba(154,79,0,0.18)]"
          />
          <span>Calculadora do Produtor</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-full border border-amber-900/15 bg-white px-5 py-3 text-sm font-black text-amber-800 transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Voltar ao site
          </Link>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
          >
            Entrar no app
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 pb-18 pt-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-900">
            {content.eyebrow}
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.08em] text-slate-950 sm:text-6xl">
            {content.heroTitle}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            {content.heroDescription}
          </p>

          <p className="mt-6 max-w-3xl rounded-[28px] border border-slate-950/10 bg-white/80 p-5 text-base leading-8 text-slate-700">
            {content.lead}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/entrar"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-700 px-6 py-4 text-sm font-black text-white shadow-[0_16px_36px_rgba(154,79,0,0.2)] transition-transform hover:-translate-y-0.5"
            >
              Testar a calculadora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-amber-900/15 bg-white px-6 py-4 text-sm font-black text-amber-800 transition-transform hover:-translate-y-0.5"
            >
              Ver pagina principal
            </Link>
          </div>
        </div>

        <div className="rounded-[38px] border border-amber-900/15 bg-white/90 p-6 shadow-[0_36px_90px_rgba(154,79,0,0.18)]">
          <SectionTitle
            eyebrow="O que voce resolve aqui"
            title="Mais clareza para precificar e mais organizacao para vender."
            description="Em vez de depender so da memoria, de contas manuais ou de anotacoes espalhadas, voce passa a enxergar melhor o que entra no preco e no orcamento."
          />

          <div className="mt-8 grid gap-4">
            {content.benefits.map((benefit) => (
              <article
                key={benefit}
                className="flex gap-4 rounded-[28px] border border-slate-950/10 bg-amber-50/70 p-5"
              >
                <span className="mt-0.5 text-amber-700">
                  <CheckCircle2 size={22} />
                </span>
                <p className="text-base leading-7 text-slate-700">{benefit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {content.steps?.length ? (
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
          <SectionTitle
            eyebrow="Como funciona"
            title="Um processo simples para quem quer sair do improviso."
            description="A ideia nao e complicar sua rotina. E justamente transformar a conta do dia a dia em um fluxo mais facil de repetir."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {content.steps.map((step) => (
              <article
                key={step.title}
                className="rounded-[32px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
              >
                <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-4 leading-8 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {content.useCases?.length ? (
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
          <SectionTitle
            eyebrow="O que voce consegue fazer"
            title="Beneficios que fazem sentido na rotina de quem produz."
            description="Nao e so uma calculadora. E uma base para organizar melhor materiais, produto, preco e apresentacao para o cliente."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-[30px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
              >
                <h3 className="text-xl font-black text-slate-950">{useCase.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{useCase.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {content.example ? (
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
          <ExampleCard {...content.example} />
        </section>
      ) : null}

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
        <SectionTitle
          eyebrow="Perguntas frequentes"
          title="Dúvidas comuns de quem pesquisa esse assunto no Google."
          description="Quanto mais clara a resposta, mais facil fica entender se a Calculadora do Produtor encaixa na rotina do seu negocio."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[32px] border border-slate-950/10 bg-white p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
            >
              <h3 className="text-xl font-black text-slate-950">{faq.question}</h3>
              <p className="mt-4 leading-8 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-18">
        <SectionTitle
          eyebrow="Paginas relacionadas"
          title="Outras formas de encontrar a calculadora."
          description="O mesmo problema costuma aparecer em pesquisas diferentes. Por isso, organizamos paginas especificas para cada necessidade principal."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {relatedPages.map((page) => (
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

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
        <div className="flex flex-col justify-between gap-7 overflow-hidden rounded-[42px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_18rem),linear-gradient(135deg,_#d97706,_#92400e)] p-8 text-white sm:p-11 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              Quer sair do preco no olho?
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-white/80">
              Use a Calculadora do Produtor para organizar materiais, precificar
              com mais clareza e montar orcamentos com uma apresentacao melhor.
            </p>
          </div>
          <Link
            href="/entrar"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-amber-900 transition-transform hover:-translate-y-0.5"
          >
            Comecar agora
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
