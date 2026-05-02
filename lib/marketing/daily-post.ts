export type DailyMarketingPost = {
  date: string;
  focusKeyword: string;
  title: string;
  body: string;
  hashtags: string[];
  targetUrl: string;
};

const SITE_URL = "https://calculaartesao.com.br";

const FOCUS_TOPICS = [
  {
    keyword: "calculadora para artesao",
    pain:
      "Ainda precifica no olho e fica na duvida se esta vendendo com lucro?",
    value:
      "Organize materiais, ficha tecnica, estoque e preco de venda em um so lugar.",
    slug: "calculadora-para-artesao",
  },
  {
    keyword: "precificacao de artesanato",
    pain:
      "Seu preco muda toda hora e voce sente inseguranca para responder cliente?",
    value:
      "Use uma base clara com custo, margem e operacao para precificar com mais confianca.",
    slug: "precificacao-de-artesanato",
  },
  {
    keyword: "orcamento para artesanato",
    pain:
      "Voce perde vendas porque o cliente nao entende bem o seu orcamento?",
    value:
      "Monte propostas mais claras com itens, quantidade, desconto, prazo e condicoes.",
    slug: "orcamento-para-artesanato",
  },
  {
    keyword: "controle de estoque para artesao",
    pain:
      "Material acaba no meio da encomenda e voce so percebe quando ja atrasou?",
    value:
      "Controle insumos, reposicao e valor parado para produzir com previsibilidade.",
    slug: "controle-de-estoque-para-artesao",
  },
  {
    keyword: "como calcular preco de venda no artesanato",
    pain:
      "Dificuldade para transformar custo e tempo em um preco justo?",
    value:
      "Aprenda um fluxo simples para sair do improviso e cobrar com mais seguranca.",
    slug: "como-calcular-preco-de-venda-no-artesanato",
  },
  {
    keyword: "calculadora para croche",
    pain:
      "Pecas de croche e amigurumi dando trabalho para formar preco coerente?",
    value:
      "Registre consumo de materiais e tempo para montar preco de venda com mais consistencia.",
    slug: "calculadora-para-croche",
  },
  {
    keyword: "calculadora para laco",
    pain:
      "Dificuldade para cobrar laços unitarios e kits sem perder margem?",
    value:
      "Padronize a base dos produtos e gere orcamentos com mais clareza.",
    slug: "calculadora-para-lacos",
  },
  {
    keyword: "calculadora para confeitaria artesanal",
    pain:
      "Ingredientes, embalagem e tempo deixando seu preco confuso?",
    value:
      "Organize custos da confeitaria artesanal e veja preco sugerido de forma pratica.",
    slug: "calculadora-para-confeitaria-artesanal",
  },
];

const CTA_LINES = [
  "Quer testar na sua rotina? Comece gratis no link abaixo.",
  "Se fizer sentido para seu negocio, voce pode testar agora.",
  "Use no celular ou computador e veja como fica no dia a dia.",
  "A ideia e simples: menos chute, mais controle e mais confianca para vender.",
];

const HASHTAGS_POOL = [
  "#artesanato",
  "#precificacao",
  "#pequenonegocio",
  "#empreendedorismocriativo",
  "#calculadoradoprodutor",
  "#controledeestoque",
  "#orcamento",
  "#lucro",
  "#mei",
  "#artesaos",
];

function getDaySeed(date: Date) {
  const utcDate = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor(utcDate / 86400000);
}

function pickHashtags(seed: number) {
  const tags: string[] = [];

  for (let index = 0; index < 5; index += 1) {
    const nextTag = HASHTAGS_POOL[(seed + index * 3) % HASHTAGS_POOL.length];

    if (!tags.includes(nextTag)) {
      tags.push(nextTag);
    }
  }

  return tags;
}

export function getDailyFacebookPost(referenceDate: Date = new Date()): DailyMarketingPost {
  const seed = getDaySeed(referenceDate);
  const topic = FOCUS_TOPICS[seed % FOCUS_TOPICS.length];
  const cta = CTA_LINES[(seed * 7) % CTA_LINES.length];
  const hashtags = pickHashtags(seed);
  const date = referenceDate.toISOString().slice(0, 10);
  const targetUrl = `${SITE_URL}/${topic.slug}`;

  return {
    date,
    focusKeyword: topic.keyword,
    title: "Post do dia para atrair novos artesaos",
    body: `${topic.pain}\n\n${topic.value}\n\n${cta}\n${targetUrl}`,
    hashtags,
    targetUrl,
  };
}

export function formatDailyPostForClipboard(post: DailyMarketingPost) {
  return `${post.body}\n\n${post.hashtags.join(" ")}`;
}
