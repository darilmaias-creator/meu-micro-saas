export type SearchIntentFaq = {
  question: string;
  answer: string;
};

export type SearchIntentPageContent = {
  slug: string;
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  lead: string;
  benefits: string[];
  faqs: SearchIntentFaq[];
};

export const SEARCH_INTENT_PAGES: SearchIntentPageContent[] = [
  {
    slug: "calculadora-para-artesao",
    metadataTitle:
      "Calculadora para artesao | Preco, estoque e orcamentos",
    metadataDescription:
      "Calculadora para artesao com estoque, ficha tecnica, precificacao e orcamentos para quem produz personalizados, MDF, costura, papelaria e artesanato.",
    eyebrow: "Calculadora para artesao",
    heroTitle: "Uma calculadora para artesao que ajuda a precificar com mais seguranca.",
    heroDescription:
      "A Calculadora do Produtor foi criada para quem precisa organizar materiais, calcular preco de venda, montar ficha tecnica e criar orcamentos sem depender de planilhas confusas.",
    lead:
      "Se voce pesquisa por calculadora para artesao, calculadora de artesanato ou sistema para precificar artesanato, esta pagina existe para mostrar exatamente como o app ajuda no dia a dia de quem produz.",
    benefits: [
      "Cadastre materiais, custo pago, medidas, estoque atual e estoque minimo.",
      "Monte fichas tecnicas para produtos personalizados, caixas, MDF, costura, laser e papelaria criativa.",
      "Calcule preco de venda com margem de lucro e gere orcamentos mais claros para o cliente.",
    ],
    faqs: [
      {
        question: "A Calculadora do Produtor serve para qualquer tipo de artesanato?",
        answer:
          "Ela foi pensada para pequenos produtores e artesaos que trabalham com custo de material, tempo de producao, estoque e orcamento. Funciona bem para varias rotinas, como personalizados, MDF, costura, papelaria e lembrancinhas.",
      },
      {
        question: "Posso usar a calculadora para artesao no celular?",
        answer:
          "Sim. O app funciona no celular e no computador, o que ajuda a acompanhar custos, estoque e orcamentos de qualquer lugar.",
      },
      {
        question: "A calculadora ajuda a nao vender no prejuizo?",
        answer:
          "Essa e a ideia principal. O sistema ajuda a enxergar custo, margem e preco sugerido para voce tomar decisoes com mais seguranca.",
      },
    ],
  },
  {
    slug: "precificacao-de-artesanato",
    metadataTitle:
      "Precificacao de artesanato | Como calcular preco de venda",
    metadataDescription:
      "Veja como fazer a precificacao de artesanato com materiais, tempo, custos extras, margem e estoque usando a Calculadora do Produtor.",
    eyebrow: "Precificacao de artesanato",
    heroTitle: "Precificacao de artesanato com menos chute e mais controle.",
    heroDescription:
      "Precificar artesanato do jeito certo exige olhar para material, tempo, desperdicio, custos extras e margem. A Calculadora do Produtor organiza esse processo em um fluxo mais simples.",
    lead:
      "Quem pesquisa por precificacao de artesanato, como calcular preco de venda ou como precificar artesanato precisa de uma base clara. O app ajuda justamente nisso: transformar informacoes soltas em preco mais seguro.",
    benefits: [
      "Some custo de material, tempo, energia, acabamento e outros gastos sem depender de conta manual toda vez.",
      "Veja custo por unidade, margem e preco sugerido antes de passar valor ao cliente.",
      "Mantenha ficha tecnica e historico para repetir produtos com mais consistencia.",
    ],
    faqs: [
      {
        question: "Como precificar artesanato sem planilha?",
        answer:
          "Voce pode usar um sistema que organiza materiais, custos extras e margem em um unico lugar. Assim fica mais facil repetir o calculo com seguranca e atualizar os valores quando algo mudar.",
      },
      {
        question: "O app ajuda a calcular mao de obra e custos extras?",
        answer:
          "Sim. A proposta e reunir o que pesa no preco final para que a precificacao nao fique baseada so no valor do material.",
      },
      {
        question: "A precificacao de artesanato muda quando o material sobe?",
        answer:
          "Muda, e por isso controlar o custo real dos materiais e do estoque ajuda tanto. Quando o cadastro esta atualizado, o preco sugerido acompanha essa realidade com mais clareza.",
      },
    ],
  },
  {
    slug: "orcamento-para-artesanato",
    metadataTitle:
      "Orcamento para artesanato | Como apresentar preco ao cliente",
    metadataDescription:
      "Crie orcamento para artesanato com validade, prazo, forma de entrega, pagamento e valor total em um modelo mais profissional.",
    eyebrow: "Orcamento para artesanato",
    heroTitle: "Um orcamento para artesanato mais claro, profissional e facil de aprovar.",
    heroDescription:
      "Nao basta calcular preco: tambem e preciso apresentar o valor de forma organizada. A Calculadora do Produtor ajuda a gerar orcamentos com mais clareza para o cliente entender o pedido.",
    lead:
      "Quem procura modelo de orcamento para artesanato ou como fazer orcamento para cliente normalmente quer passar mais confianca. O app permite sair do improviso e mostrar valor com mais profissionalismo.",
    benefits: [
      "Monte orcamentos com itens, quantidade, valor unitario, desconto e total final.",
      "Destaque validade, prazo, pagamento, observacoes e condicao de aprovacao quando fizer sentido.",
      "Registre o historico das propostas para acompanhar o que virou venda.",
    ],
    faqs: [
      {
        question: "Como fazer um orcamento para artesanato mais profissional?",
        answer:
          "O ideal e mostrar itens, quantidade, total, prazo, observacoes importantes e dados claros da sua marca. Isso ajuda o cliente a entender a proposta e decidir com mais seguranca.",
      },
      {
        question: "Posso usar o app para enviar orcamento de personalizados?",
        answer:
          "Sim. Ele ajuda a calcular o valor e organizar a apresentacao do orcamento para quem trabalha com encomendas e produtos sob medida.",
      },
      {
        question: "O orcamento ajuda a vender melhor?",
        answer:
          "Ajuda porque reduz duvidas. Quando o cliente entende o que esta sendo cobrado, o prazo e as condicoes, a chance de inseguranca diminui.",
      },
    ],
  },
  {
    slug: "controle-de-estoque-para-artesao",
    metadataTitle:
      "Controle de estoque para artesao | Materiais, custo e reposicao",
    metadataDescription:
      "Controle de estoque para artesao com materiais, medidas, custo real, valor parado e alerta de reposicao na Calculadora do Produtor.",
    eyebrow: "Controle de estoque para artesao",
    heroTitle: "Controle de estoque para artesao sem perder de vista custo, medida e reposicao.",
    heroDescription:
      "Quando o estoque fica solto, a precificacao tambem fica. A Calculadora do Produtor ajuda a acompanhar materiais, quantidades e custo real para produzir com mais previsibilidade.",
    lead:
      "Quem pesquisa por controle de estoque para artesao ou como organizar materiais de artesanato precisa de mais do que uma lista: precisa enxergar impacto no preco, no orcamento e na reposicao.",
    benefits: [
      "Cadastre insumos com medida, custo pago, quantidade atual e nivel minimo.",
      "Saiba quais materiais ainda estao saudaveis e quais ja precisam de reposicao.",
      "Use o estoque como base para fichas tecnicas, precificacao e orcamentos mais consistentes.",
    ],
    faqs: [
      {
        question: "Por que o controle de estoque ajuda a precificar artesanato?",
        answer:
          "Porque o valor do material precisa refletir a realidade do seu negocio. Quando voce sabe o que tem, o que pagou e o que esta saindo, o calculo fica mais confiavel.",
      },
      {
        question: "O app mostra materiais com estoque baixo?",
        answer:
          "Sim. O sistema foi pensado para dar visibilidade ao estoque minimo e evitar que a producao dependa de memoria ou anotacoes soltas.",
      },
      {
        question: "Serve para atelie pequeno?",
        answer:
          "Sim. O foco e justamente ajudar pequenos produtores e artesaos a organizar materiais sem transformar a rotina em algo complicado.",
      },
    ],
  },
];

export function getSearchIntentPage(
  slug: string,
): SearchIntentPageContent | undefined {
  return SEARCH_INTENT_PAGES.find((page) => page.slug === slug);
}

export function getRequiredSearchIntentPage(
  slug: string,
): SearchIntentPageContent {
  const page = getSearchIntentPage(slug);

  if (!page) {
    throw new Error(`Missing search intent page: ${slug}`);
  }

  return page;
}
