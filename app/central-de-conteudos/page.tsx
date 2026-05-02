import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  CalendarDays,
  Hash,
  Megaphone,
  NotebookText,
  Sparkles,
} from "lucide-react";

import {
  SEARCH_INTENT_PAGES,
  type SearchIntentPageContent,
} from "@/app/apresentacao/search-intents";
import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";
import {
  formatDailyPostForClipboard,
  getDailyFacebookPost,
} from "@/lib/marketing/daily-post";
import { CopyDailyPostButton } from "./CopyDailyPostButton";

export const metadata: Metadata = {
  title: "Central de conteúdos | Calculadora do Produtor",
  description:
    "Acesse a central de conteúdos da Calculadora do Produtor com páginas SEO, guias práticos e post automático diário para divulgação.",
  alternates: {
    canonical: "/central-de-conteudos",
  },
  openGraph: {
    title: "Central de conteúdos da Calculadora do Produtor",
    description:
      "Páginas por tema, nicho e guias práticos, com post automático diário para divulgação.",
    url: "/central-de-conteudos",
    siteName: "Calculadora do Produtor",
    locale: "pt_BR",
    type: "website",
  },
};

type ContentGroup = {
  title: string;
  description: string;
  slugs: string[];
};

const CONTENT_GROUPS: ContentGroup[] = [
  {
    title: "Páginas principais",
    description:
      "As páginas mais fortes para quem procura calculadora, preço, orçamento e estoque.",
    slugs: [
      "calculadora-para-artesao",
      "precificacao-de-artesanato",
      "orcamento-para-artesanato",
      "controle-de-estoque-para-artesao",
      "como-calcular-preco-de-venda-no-artesanato",
    ],
  },
  {
    title: "Páginas por nicho",
    description:
      "Conteúdos para segmentos específicos do artesanato e da produção personalizada.",
    slugs: [
      "calculadora-para-croche",
      "calculadora-para-lacos",
      "calculadora-para-biscuit",
      "calculadora-para-papelaria-personalizada",
      "calculadora-para-confeitaria-artesanal",
    ],
  },
  {
    title: "Guias de entrada",
    description:
      "Conteúdo educativo para atrair quem ainda está aprendendo a precificar e vender melhor.",
    slugs: [
      "como-fazer-orcamento-para-cliente-no-artesanato",
      "como-separar-custos-fixos-e-variaveis",
      "como-calcular-mao-de-obra-no-artesanato",
      "como-nao-vender-no-prejuizo",
      "como-montar-ficha-tecnica-do-produto",
    ],
  },
];

function getPageBySlug(slug: string): SearchIntentPageContent | null {
  return SEARCH_INTENT_PAGES.find((page) => page.slug === slug) ?? null;
}

function resolvePages(slugs: string[]) {
  return slugs
    .map((slug) => getPageBySlug(slug))
    .filter((page): page is SearchIntentPageContent => page !== null);
}

export default async function CentralDeConteudosPage() {
  await connection();

  const generatedAt = new Date();
  const generatedAtLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Cuiaba",
  }).format(generatedAt);
  const dailyPost = getDailyFacebookPost(generatedAt);
  const dailyPostClipboard = formatDailyPostForClipboard(dailyPost);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_24rem),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.12),_transparent_28rem),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_42%,_#ffffff_100%)] text-slate-950">
      <section className="mx-auto w-[min(1180px,calc(100%-32px))] pt-10">
        <div className="rounded-[36px] border border-amber-900/10 bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              src={DEFAULT_STORE_LOGO}
              alt="Logo da Calculadora do Produtor"
              className="h-14 w-14 rounded-2xl bg-white object-contain shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
            />
            <div>
              <p className="text-lg font-black tracking-[-0.03em]">
                Calculadora do Produtor
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Central de conteúdos
              </p>
            </div>
          </Link>

          <div className="mt-6 max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">
              <NotebookText size={14} />
              Conteúdo para SEO e divulgação
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Tudo em um lugar para crescer cliques, impressões e cadastros.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Aqui você encontra as páginas públicas do site, organizadas por
              prioridade, e um post automático diário pronto para copiar e
              divulgar nas redes.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 py-10">
        {CONTENT_GROUPS.map((group) => {
          const pages = resolvePages(group.slugs);

          return (
            <article
              key={group.title}
              className="rounded-[32px] border border-slate-950/10 bg-white/88 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
            >
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">
                {group.title}
              </h2>
              <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                {group.description}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pages.map((page) => (
                  <Link
                    key={page.slug}
                    href={`/${page.slug}`}
                    className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                      {page.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
                      {page.metadataTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {page.metadataDescription}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-amber-800">
                      Abrir página
                      <ArrowUpRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] pb-14">
        <article className="rounded-[34px] border border-amber-300/30 bg-[linear-gradient(145deg,_#0f172a,_#1e293b_58%,_#78350f_130%)] p-7 text-white shadow-[0_34px_80px_rgba(15,23,42,0.22)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                <Megaphone size={14} />
                Post automático do dia
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Texto novo todos os dias, pronto para copiar.
              </h2>
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
              <CalendarDays size={16} />
              {generatedAtLabel}
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/14 bg-white/8 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
              <Hash size={13} />
              Palavra-chave foco: {dailyPost.focusKeyword}
            </p>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90">
              {dailyPost.body}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {dailyPost.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-bold text-amber-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CopyDailyPostButton content={dailyPostClipboard} />
            <Link
              href={dailyPost.targetUrl}
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
            >
              Abrir página alvo
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/api/marketing/daily-post"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white/90 transition hover:bg-white/16"
            >
              Ver JSON do dia
              <Sparkles size={15} />
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
