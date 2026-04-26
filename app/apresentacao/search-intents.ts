export type SearchIntentFaq = {
  question: string;
  answer: string;
};

export type SearchIntentStep = {
  title: string;
  description: string;
};

export type SearchIntentUseCase = {
  title: string;
  description: string;
};

export type SearchIntentExample = {
  title: string;
  description: string;
  bullets: string[];
  result: string;
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
  steps?: SearchIntentStep[];
  useCases?: SearchIntentUseCase[];
  example?: SearchIntentExample;
  faqs: SearchIntentFaq[];
};

export const SEARCH_INTENT_PAGES: SearchIntentPageContent[] = [
  {
       slug: "calculadora-para-artesao",
    metadataTitle:
      "Calculadora para artesão | Preço, estoque e orçamentos",
    metadataDescription:
      "Calculadora para artesão com estoque, ficha técnica, precificação e orçamentos para quem produz personalizados, MDF, costura, papelaria e artesanato.",
    eyebrow: "Calculadora para artesão",
    heroTitle:
      "Calculadora para artesão para organizar custos, estoque e orçamentos sem complicação.",
    heroDescription:
      "A Calculadora do Produtor ajuda quem trabalha com artesanato a sair do preço no olho. Em vez de anotar tudo em vários lugares, você concentra materiais, ficha técnica, preço de venda e orçamentos em um só sistema.",
    lead:
      "Se você chegou até aqui procurando uma calculadora para artesão, provavelmente quer parar de adivinhar valores e ganhar mais segurança para vender. Esta página foi montada para mostrar, de forma simples, como o app ajuda no dia a dia de quem produz e quer cobrar melhor.",
    benefits: [
      "Cadastre materiais, custo pago, medidas, estoque atual e estoque mínimo sem depender de várias planilhas.",
      "Monte fichas técnicas para produtos personalizados, caixas, MDF, costura, papelaria, laço, biscuit e outros nichos artesanais.",
      "Calcule preço de venda com margem de lucro, acompanhe custos da operação e gere orçamentos mais claros para o cliente.",
    ],
    steps: [
      {
        title: "1. Cadastre seus materiais do jeito que você compra",
        description:
          "Você informa quanto pagou, quanto veio no pacote e qual unidade usa no dia a dia. O sistema guarda isso para você não recalcular tudo toda vez.",
      },
      {
        title: "2. Monte a ficha técnica do produto",
        description:
          "Escolha os materiais usados, informe as quantidades e adicione tempo de produção quando fizer sentido. Assim você enxerga o custo real da peça.",
      },
      {
        title: "3. Veja o preço sugerido e transforme em orçamento",
        description:
          "Com os custos organizados, você consegue definir a margem com mais segurança e apresentar o valor ao cliente com mais profissionalismo.",
      },
    ],
    useCases: [
      {
        title: "Precificação mais segura",
        description:
          "Ajuda a entender melhor o valor da sua peça antes de falar o preço para o cliente.",
      },
      {
        title: "Controle de materiais",
        description:
          "Mostra o que você tem em estoque, o que está acabando e o valor parado em insumos.",
      },
      {
        title: "Orçamentos mais claros",
        description:
          "Permite organizar itens, quantidade, desconto e total final em uma apresentação melhor.",
      },
      {
        title: "Mais consistência na rotina",
        description:
          "Quando um produto se repete, você reutiliza a base já montada e ganha tempo.",
      },
    ],
    example: {
      title: "Exemplo simples de uso no dia a dia",
      description:
        "Imagine uma artesã que faz caixas personalizadas e sempre fica em dúvida na hora de cobrar.",
      bullets: [
        "Ela cadastra papel, laço, cola, embalagem e outros materiais usados na peça.",
        "Depois monta a ficha técnica com a quantidade de cada item e o tempo de produção.",
        "O app mostra o custo, ajuda a aplicar a margem desejada e gera o valor final com mais clareza.",
      ],
      result:
        "No fim, ela deixa de passar valor no improviso e começa a vender com mais confiança.",
    },
    faqs: [
      {
        question: "A Calculadora do Produtor serve para qualquer tipo de artesanato?",
        answer:
          "Ela foi pensada para pequenos produtores e artesãos que trabalham com custo de material, tempo de produção, estoque e orçamento. Funciona bem para várias rotinas, como personalizados, MDF, costura, papelaria e lembrancinhas.",
      },
      {
        question: "Posso usar a calculadora para artesão no celular?",
        answer:
          "Sim. O app funciona no celular e no computador, o que ajuda a acompanhar custos, estoque e orçamentos de qualquer lugar.",
      },
      {
        question: "A calculadora ajuda a não vender no prejuízo?",
        answer:
          "Essa é a ideia principal. O sistema ajuda a enxergar custo, margem e preço sugerido para você tomar decisões com mais segurança.",
      },
      {
        question: "Preciso entender muito de conta para usar a calculadora?",
        answer:
          "Não. A proposta é justamente simplificar. O app organiza as informações de um jeito mais visual para que você entenda o custo e o preço final sem depender de cálculos complicados.",
      },
    ],
  },
  {
    slug: "precificacao-de-artesanato",
    metadataTitle:
      "Precificação de artesanato | Como calcular preço de venda",
    metadataDescription:
      "Veja como fazer a precificação de artesanato com materiais, tempo, custos extras, margem e estoque usando a Calculadora do Produtor.",
    eyebrow: "Precificação de artesanato",
    heroTitle: "Precificação de artesanato com menos chute e mais controle.",
    heroDescription:
      "Precificar artesanato do jeito certo exige olhar para material, tempo, desperdício, custos extras e margem. A Calculadora do Produtor organiza esse processo em um fluxo mais simples.",
    lead:
      "Quem pesquisa por precificação de artesanato, como calcular preço de venda ou como precificar artesanato precisa de uma base clara. O app ajuda justamente nisso: transformar informações soltas em preço mais seguro.",
    benefits: [
      "Some custo de material, tempo, energia, acabamento e outros gastos sem depender de conta manual toda vez.",
      "Veja custo por unidade, margem e preço sugerido antes de passar valor ao cliente.",
      "Mantenha ficha técnica e histórico para repetir produtos com mais consistência.",
    ],
    faqs: [
      {
        question: "Como precificar artesanato sem planilha?",
        answer:
          "Você pode usar um sistema que organiza materiais, custos extras e margem em um único lugar. Assim fica mais fácil repetir o cálculo com segurança e atualizar os valores quando algo mudar.",
      },
      {
        question: "O app ajuda a calcular mão de obra e custos extras?",
        answer:
          "Sim. A proposta é reunir o que pesa no preço final para que a precificação não fique baseada só no valor do material.",
      },
      {
        question: "A precificação de artesanato muda quando o material sobe?",
        answer:
          "Muda, e por isso controlar o custo real dos materiais e do estoque ajuda tanto. Quando o cadastro está atualizado, o preço sugerido acompanha essa realidade com mais clareza.",
      },
    ],
  },
  {
    slug: "orcamento-para-artesanato",
    metadataTitle:
      "Orçamento para artesanato | Como apresentar preço ao cliente",
    metadataDescription:
      "Crie orçamento para artesanato com validade, prazo, forma de entrega, pagamento e valor total em um modelo mais profissional.",
    eyebrow: "Orçamento para artesanato",
    heroTitle: "Um orçamento para artesanato mais claro, profissional e fácil de aprovar.",
    heroDescription:
      "Não basta calcular preço: também é preciso apresentar o valor de forma organizada. A Calculadora do Produtor ajuda a gerar orçamentos com mais clareza para o cliente entender o pedido.",
    lead:
      "Quem procura modelo de orçamento para artesanato ou como fazer orçamento para cliente normalmente quer passar mais confiança. O app permite sair do improviso e mostrar valor com mais profissionalismo.",
    benefits: [
      "Monte orçamentos com itens, quantidade, valor unitário, desconto e total final.",
      "Destaque validade, prazo, pagamento, observações e condição de aprovação quando fizer sentido.",
      "Registre o histórico das propostas para acompanhar o que virou venda.",
    ],
    faqs: [
      {
        question: "Como fazer um orçamento para artesanato mais profissional?",
        answer:
          "O ideal é mostrar itens, quantidade, total, prazo, observações importantes e dados claros da sua marca. Isso ajuda o cliente a entender a proposta e decidir com mais segurança.",
      },
      {
        question: "Posso usar o app para enviar orçamento de personalizados?",
        answer:
          "Sim. Ele ajuda a calcular o valor e organizar a apresentação do orçamento para quem trabalha com encomendas e produtos sob medida.",
      },
      {
        question: "O orçamento ajuda a vender melhor?",
        answer:
          "Ajuda porque reduz dúvidas. Quando o cliente entende o que está sendo cobrado, o prazo e as condições, a chance de insegurança diminui.",
      },
    ],
  },
  {
    slug: "controle-de-estoque-para-artesao",
    metadataTitle:
      "Controle de estoque para artesão | Materiais, custo e reposição",
    metadataDescription:
      "Controle de estoque para artesão com materiais, medidas, custo real, valor parado e alerta de reposição na Calculadora do Produtor.",
    eyebrow: "Controle de estoque para artesão",
    heroTitle: "Controle de estoque para artesão sem perder de vista custo, medida e reposição.",
    heroDescription:
      "Quando o estoque fica solto, a precificação também fica. A Calculadora do Produtor ajuda a acompanhar materiais, quantidades e custo real para produzir com mais previsibilidade.",
    lead:
      "Quem pesquisa por controle de estoque para artesão ou como organizar materiais de artesanato precisa de mais do que uma lista: precisa enxergar impacto no preço, no orçamento e na reposição.",
    benefits: [
      "Cadastre insumos com medida, custo pago, quantidade atual e nível mínimo.",
      "Saiba quais materiais ainda estão saudáveis e quais já precisam de reposição.",
      "Use o estoque como base para fichas técnicas, precificação e orçamentos mais consistentes.",
    ],
    faqs: [
      {
        question: "Por que o controle de estoque ajuda a precificar artesanato?",
        answer:
          "Porque o valor do material precisa refletir a realidade do seu negócio. Quando você sabe o que tem, o que pagou e o que está saindo, o cálculo fica mais confiável.",
      },
      {
        question: "O app mostra materiais com estoque baixo?",
        answer:
          "Sim. O sistema foi pensado para dar visibilidade ao estoque mínimo e evitar que a produção dependa de memória ou anotações soltas.",
      },
      {
        question: "Serve para ateliê pequeno?",
        answer:
          "Sim. O foco é justamente ajudar pequenos produtores e artesãos a organizar materiais sem transformar a rotina em algo complicado.",
      },
    ],
  },
  {
    slug: "como-calcular-preco-de-venda-no-artesanato",
    metadataTitle:
      "Como calcular preço de venda no artesanato | Guia simples para iniciantes",
    metadataDescription:
      "Aprenda como calcular preço de venda no artesanato considerando materiais, tempo, custos do negócio e margem de lucro sem depender de planilhas confusas.",
    eyebrow: "Preço de venda no artesanato",
    heroTitle:
      "Como calcular preço de venda no artesanato de um jeito simples e mais seguro.",
    heroDescription:
      "Muita gente soma o valor do material e acha que isso basta. Mas para cobrar melhor, você precisa olhar também para tempo, custos da operação e margem. A Calculadora do Produtor ajuda a organizar isso sem complicar sua rotina.",
    lead:
      "Se você procura como calcular preço de venda no artesanato, provavelmente quer parar de cobrar no improviso e entender melhor o valor real da sua peça. Esta página mostra esse caminho de forma simples, com exemplos que fazem sentido para quem está começando ou quer mais clareza.",
    benefits: [
      "Ajuda a somar materiais, tempo e custos do negócio de uma forma mais organizada.",
      "Mostra o preço sugerido com base em margem, em vez de deixar tudo no chute.",
      "Transforma o cálculo em uma rotina que pode ser repetida sempre que você criar um novo produto.",
    ],
    steps: [
      {
        title: "1. Descubra quanto o produto realmente consome",
        description:
          "O primeiro passo é cadastrar os materiais e informar a quantidade usada em cada peça. Assim você para de estimar e passa a enxergar o custo real do que sai do estoque.",
      },
      {
        title: "2. Inclua o tempo e os custos da operação",
        description:
          "Depois você considera o tempo de produção e os custos do negócio, como despesas da operação, para não deixar partes importantes do preço de fora.",
      },
      {
        title: "3. Defina a margem e veja o valor final",
        description:
          "Com a base organizada, você escolhe a margem desejada e o sistema mostra um preço mais coerente para vender com mais segurança.",
      },
    ],
    useCases: [
      {
        title: "Menos preço no olho",
        description:
          "Ajuda a parar de passar valor só pela intuição ou pelo que o concorrente cobra.",
      },
      {
        title: "Mais segurança para responder clientes",
        description:
          "Quando você entende o cálculo, fica mais fácil defender o valor da peça.",
      },
      {
        title: "Base melhor para orçamentos",
        description:
          "O preço de venda bem calculado facilita a criação de propostas mais claras.",
      },
      {
        title: "Mais consistência no negócio",
        description:
          "Mesmo quando o produto muda pouco, você consegue repetir o processo sem recomeçar do zero.",
      },
    ],
    example: {
      title: "Exemplo fácil para entender",
      description:
        "Imagine uma artesã que faz lembrancinhas personalizadas e quer saber quanto cobrar por cada unidade.",
      bullets: [
        "Ela cadastra papel, fita, cola, embalagem e os outros materiais usados na lembrancinha.",
        "Depois informa o tempo médio de produção e observa os custos da operação do negócio.",
        "O app soma a base do produto, aplica a margem desejada e mostra um preço final mais claro para vender.",
      ],
      result:
        "Em vez de cobrar um valor aleatório, ela passa a vender sabendo melhor quanto custa produzir e quanto quer ganhar.",
    },
    faqs: [
      {
        question: "Posso calcular o preço de venda só pelo valor do material?",
        answer:
          "Você até pode, mas isso costuma deixar muita coisa de fora. Tempo, desperdício, custos da operação e margem também influenciam no valor final e ajudam a evitar prejuízo.",
      },
      {
        question: "Quem está começando também precisa pensar em margem de lucro?",
        answer:
          "Sim. Mesmo no início, entender a margem ajuda você a saber se o valor cobrado está cobrindo o custo e deixando retorno para o negócio continuar.",
      },
      {
        question: "A Calculadora do Produtor faz esse cálculo automaticamente?",
        answer:
          "Sim. O objetivo do app é justamente organizar os dados e mostrar um preço mais seguro sem que você precise refazer a conta toda vez manualmente.",
      },
      {
        question: "Esse cálculo serve para encomendas e produtos personalizados?",
        answer:
          "Serve sim. Principalmente quando cada pedido muda um pouco, ter uma base organizada ajuda muito a adaptar o preço sem perder a lógica do cálculo.",
      },
    ],
  },
  {
    slug: "calculadora-para-croche",
    metadataTitle:
      "Calculadora para crochê | Como calcular preço de crochê com mais segurança",
    metadataDescription:
      "Use uma calculadora para crochê, para organizar materiais, tempo de produção e preço de venda sem depender de contas manuais.",
    eyebrow: "Calculadora para crochê",
    heroTitle:
      "Calculadora para crochê para cobrar melhor sem passar valor no improviso.",
    heroDescription:
      "Quem trabalha com crochê costuma lidar com fio, enchimento, aviamentos, tempo de produção e detalhes que mudam de uma peça para outra. A Calculadora do Produtor ajuda a transformar isso em um preço mais claro.",
    lead:
      "Se você procura como calcular preço de crochê, quanto cobrar por amigurumi ou como organizar materiais de crochê, esta página foi feita para mostrar como o app simplifica essa rotina para quem produz por encomenda ou por pronta entrega.",
    benefits: [
      "Ajuda a cadastrar fios, enchimentos, olhos, etiquetas, embalagens e outros materiais usados no crochê.",
      "Permite montar a ficha técnica da peça com consumo e tempo de produção de forma mais organizada.",
      "Mostra um preço sugerido mais seguro para não depender só da intuição ou da comparação com outros perfis.",
    ],
    steps: [
      {
        title: "1. Cadastre os materiais do crochê",
        description:
          "Você informa quanto pagou no fio, no enchimento e nos aviamentos para criar uma base mais real do custo da peça.",
      },
      {
        title: "2. Monte a ficha da peça",
        description:
          "O app ajuda a reunir os materiais usados e o tempo médio de produção para que o cálculo não fique solto.",
      },
      {
        title: "3. Veja o preço com mais segurança",
        description:
          "Com a margem definida, você chega a um valor mais coerente para apresentar ao cliente ou usar em pronta entrega.",
      },
    ],
    useCases: [
      {
        title: "Preço de amigurumi",
        description:
          "Ajuda a organizar peças que usam mais tempo e variam muito de tamanho e detalhe.",
      },
      {
        title: "Controle de materiais",
        description:
          "Mostra melhor o consumo de fios, enchimento e itens de acabamento.",
      },
      {
        title: "Orçamento sob encomenda",
        description:
          "Facilita quando cada cliente pede cor, tamanho ou acabamento diferente.",
      },
      {
        title: "Mais consistência",
        description:
          "Evita recalcular tudo do zero sempre que você repete um modelo parecido.",
      },
    ],
    example: {
      title: "Exemplo com uma peça de crochê",
      description:
        "Imagine uma artesã que vende amigurumis e quer saber se o valor cobrado realmente compensa.",
      bullets: [
        "Ela cadastra o fio, o enchimento, os olhos, a etiqueta e a embalagem usados em cada peça.",
        "Depois informa o tempo médio de produção para entender melhor o peso da mão de obra.",
        "O sistema cruza essa base com a margem desejada e mostra um preço de venda mais seguro.",
      ],
      result:
        "No fim, ela deixa de cobrar só comparando com outras páginas e passa a entender melhor o próprio valor.",
    },
    faqs: [
      {
        question: "A calculadora serve para amigurumi e outras peças de crochê?",
        answer:
          "Sim. Ela ajuda tanto em peças simples quanto em produtos que exigem mais tempo e variam bastante de material e acabamento.",
      },
      {
        question: "Posso usar a calculadora para crochê no celular?",
        answer:
          "Sim. O app funciona no celular e no computador, o que ajuda muito quem produz e vende ao mesmo tempo.",
      },
      {
        question: "Ela ajuda a calcular tempo de produção no crochê?",
        answer:
          "Sim. O objetivo é justamente evitar que o preço fique baseado só no valor do fio e dos materiais diretos.",
      },
    ],
  },
  {
    slug: "calculadora-para-lacos",
    metadataTitle:
      "Calculadora para laços | Como calcular preço de laços e kits personalizados",
    metadataDescription:
      "Aprenda a usar uma calculadora para laços para organizar fita, acabamento, embalagem e tempo de produção em um preço mais claro.",
    eyebrow: "Calculadora para laços",
    heroTitle:
      "Calculadora para laços para precificar peças e kits com mais clareza.",
    heroDescription:
      "Quando o produto parece pequeno, muita gente acaba cobrando menos do que deveria. A Calculadora do Produtor ajuda quem trabalha com laços a enxergar materiais, tempo e margem com mais segurança.",
    lead:
      "Se você vende laços, kits infantis, presilhas ou acessórios personalizados, esta página mostra como o app ajuda a sair do preço no olho e montar uma base mais profissional para vender.",
    benefits: [
      "Ajuda a cadastrar fitas, mantas, presilhas, colas, etiquetas, embalagens e outros itens do dia a dia.",
      "Facilita a precificação de peças unitárias e kits com quantidades diferentes.",
      "Permite gerar orçamentos mais claros para pedidos personalizados e lembrancinhas.",
    ],
    steps: [
      {
        title: "1. Cadastre os materiais de cada laço",
        description:
          "Você informa o valor das fitas, presilhas, colas e acabamentos para criar uma base organizada do custo.",
      },
      {
        title: "2. Monte o produto ou o kit",
        description:
          "A calculadora ajuda a reunir os itens usados e a visualizar o custo por unidade ou por conjunto.",
      },
      {
        title: "3. Defina a margem com mais segurança",
        description:
          "Com a base pronta, fica mais fácil chegar a um preço coerente e apresentar esse valor ao cliente.",
      },
    ],
    useCases: [
      {
        title: "Laços unitários",
        description:
          "Ideal para entender melhor o custo de cada peça antes de definir o preço final.",
      },
      {
        title: "Kits e conjuntos",
        description:
          "Ajuda quando você vende pares, trios, caixas ou kits personalizados.",
      },
      {
        title: "Pedidos por tema",
        description:
          "Facilita a adaptação quando cada pedido usa cor, acabamento ou composição diferente.",
      },
      {
        title: "Organização de estoque",
        description:
          "Melhora o controle de fitas, embalagens e outros materiais que acabam rápido.",
      },
    ],
    example: {
      title: "Exemplo com um kit de laços",
      description:
        "Imagine uma produtora que faz kits infantis e sempre tem dificuldade para saber quanto cobrar.",
      bullets: [
        "Ela cadastra fitas, mantas, presilhas, cola, embalagem e todos os outros detalhes usados.",
        "Depois monta o kit no app e entende melhor o custo total e o custo por item.",
        "Com a margem aplicada, o sistema mostra um preço mais claro para vender ou fazer orçamento.",
      ],
      result:
        "Assim, o valor deixa de ser só uma tentativa e passa a ter mais base para sustentar a venda.",
    },
    faqs: [
      {
        question: "Serve para quem vende laço unitário e também kits?",
        answer:
          "Sim. A calculadora ajuda tanto em peças individuais quanto em conjuntos com mais de um item.",
      },
      {
        question: "Posso usar para laço personalizado?",
        answer:
          "Pode sim. Esse tipo de pedido varia bastante, e justamente por isso ter uma base organizada faz diferença.",
      },
      {
        question: "A calculadora ajuda a montar orçamento para cliente?",
        answer:
          "Sim. Além de precificar, ela também ajuda a transformar esse valor em uma proposta mais clara.",
      },
    ],
  },
  {
    slug: "calculadora-para-biscuit",
    metadataTitle:
      "Calculadora para biscuit | Como calcular preço de peças de biscuit",
    metadataDescription:
      "Use uma calculadora para biscuit para organizar massa, tinta, acabamento, tempo e preço de venda com mais controle.",
    eyebrow: "Calculadora para biscuit",
    heroTitle:
      "Calculadora para biscuit para organizar peças personalizadas e cobrar melhor.",
    heroDescription:
      "No biscuit, pequenos detalhes fazem diferença no custo. Massa, tinta, base, acabamento, embalagem e tempo de produção precisam entrar na conta para o preço não ficar abaixo do ideal.",
    lead:
      "Se você procura como calcular preço de biscuit, como precificar topo de bolo ou lembrancinhas personalizadas, esta página ajuda a entender como o app pode simplificar esse processo.",
    benefits: [
      "Ajuda a cadastrar massa, tinta, cola, base, verniz, embalagem e outros materiais usados nas peças.",
      "Permite montar fichas técnicas para topos de bolo, lembrancinhas e enfeites personalizados.",
      "Mostra um preço mais claro para encomendas que mudam de tamanho, tema e nível de detalhe.",
    ],
    steps: [
      {
        title: "1. Organize o custo dos materiais",
        description:
          "Você informa o valor dos insumos usados no biscuit para entender melhor o que cada peça consome.",
      },
      {
        title: "2. Monte a base da encomenda",
        description:
          "Com os materiais e o tempo reunidos, a ficha técnica deixa de depender só da memória.",
      },
      {
        title: "3. Veja o preço sugerido",
        description:
          "O sistema mostra um valor mais coerente para encomendas personalizadas, ajudando você a responder com mais segurança.",
      },
    ],
    useCases: [
      {
        title: "Topo de bolo",
        description:
          "Ajuda em peças mais detalhadas, que costumam exigir mais tempo e acabamento.",
      },
      {
        title: "Lembrancinhas",
        description:
          "Facilita o cálculo de encomendas com várias unidades do mesmo modelo.",
      },
      {
        title: "Peças personalizadas",
        description:
          "Melhora a base para adaptar o valor quando o tema muda ou o pedido cresce.",
      },
      {
        title: "Mais controle",
        description:
          "Permite repetir o processo com mais consistência sempre que um produto parecido voltar.",
      },
    ],
    example: {
      title: "Exemplo com uma encomenda de biscuit",
      description:
        "Imagine uma artesã que faz topo de bolo e sente dificuldade para explicar o valor ao cliente.",
      bullets: [
        "Ela cadastra massa, tintas, bases, verniz, cola e outros itens usados na peça.",
        "Depois registra o tempo de produção e o nível de detalhe da encomenda.",
        "O app organiza esses custos e ajuda a chegar a um preço mais claro para apresentar.",
      ],
      result:
        "Com isso, ela ganha mais segurança para cobrar e mais clareza para defender o valor do próprio trabalho.",
    },
    faqs: [
      {
        question: "A calculadora serve para topo de bolo e lembrancinhas de biscuit?",
        answer:
          "Sim. Ela ajuda tanto em peças unitárias mais detalhadas quanto em lotes maiores de lembrancinhas.",
      },
      {
        question: "Como o app ajuda em encomendas personalizadas?",
        answer:
          "Ele organiza a base de material, tempo e margem para que você adapte o preço sem recomeçar a conta do zero.",
      },
      {
        question: "Posso usar pelo celular durante a produção?",
        answer:
          "Sim. O app funciona no celular e facilita consultar materiais, custos e produtos mesmo fora do computador.",
      },
    ],
  },
  {
    slug: "calculadora-para-papelaria-personalizada",
    metadataTitle:
      "Calculadora para papelaria personalizada | Como precificar com mais clareza",
    metadataDescription:
      "Use uma calculadora para papelaria personalizada para organizar papel, impressão, acabamento e preço de venda em um só lugar.",
    eyebrow: "Papelaria personalizada",
    heroTitle:
      "Calculadora para papelaria personalizada para precificar sem se perder nos detalhes.",
    heroDescription:
      "Quem trabalha com papelaria personalizada lida com muitos pequenos custos: papel, impressão, lâmina, cola, fita, embalagem e acabamento. A Calculadora do Produtor ajuda a organizar tudo isso em uma base mais clara.",
    lead:
      "Se você vende convites, caixinhas, topos, adesivos, lembrancinhas impressas ou kits personalizados, esta página mostra como o app ajuda a calcular melhor o preço e apresentar orçamentos com mais segurança.",
    benefits: [
      "Ajuda a cadastrar papel, impressão, corte, fita, cola, lâmina e outros materiais recorrentes.",
      "Permite montar fichas técnicas para produtos unitários e kits de festa.",
      "Melhora a precificação de pedidos que mudam por tema, quantidade e acabamento.",
    ],
    steps: [
      {
        title: "1. Cadastre os insumos mais usados",
        description:
          "Você informa os custos de papéis, impressão, materiais de acabamento e embalagens para ter uma base mais fiel.",
      },
      {
        title: "2. Monte o produto ou kit",
        description:
          "O app ajuda a reunir os componentes de cada item, facilitando repetir a conta em pedidos parecidos.",
      },
      {
        title: "3. Gere o preço e o orçamento",
        description:
          "Com a margem definida, você chega a um valor mais organizado para passar ao cliente com mais confiança.",
      },
    ],
    useCases: [
      {
        title: "Caixinhas e lembrancinhas",
        description:
          "Ideal para quem monta itens unitários e kits completos para festas.",
      },
      {
        title: "Convites e papelaria fina",
        description:
          "Ajuda quando o acabamento muda e cada detalhe impacta no custo final.",
      },
      {
        title: "Pedidos por tema",
        description:
          "Facilita adaptar produtos que usam a mesma base, mas mudam cor, arte e quantidade.",
      },
      {
        title: "Mais previsibilidade",
        description:
          "Evita esquecer custos pequenos que, no acumulado, pesam bastante na margem.",
      },
    ],
    example: {
      title: "Exemplo com papelaria personalizada",
      description:
        "Imagine uma produtora que monta kits de festa e quer precificar sem se perder em pequenos gastos.",
      bullets: [
        "Ela cadastra papel, impressão, fita, cola, tags, embalagem e outros itens usados no kit.",
        "Depois monta os produtos no app e entende o custo por item e o total do pedido.",
        "Com a margem aplicada, o sistema mostra um preço mais claro para orçar e vender.",
      ],
      result:
        "Assim, ela passa a cobrar com mais base e evita deixar detalhes importantes fora do valor final.",
    },
    faqs: [
      {
        question: "A calculadora serve para kits de festa e produtos unitários?",
        answer:
          "Sim. Ela ajuda tanto em itens individuais quanto em kits maiores de papelaria personalizada.",
      },
      {
        question: "Posso usar para convites e produtos com acabamento especial?",
        answer:
          "Pode sim. Justamente porque esse tipo de produto tem muitos detalhes, organizar a base ajuda bastante.",
      },
      {
        question: "O app ajuda a montar orçamento para cliente?",
        answer:
          "Sim. Além de precificar, ele também ajuda a transformar o valor em uma apresentação mais clara.",
      },
    ],
  },
  {
    slug: "calculadora-para-confeitaria-artesanal",
    metadataTitle:
      "Calculadora para confeitaria artesanal | Como calcular preço de doces e encomendas",
    metadataDescription:
      "Use uma calculadora para confeitaria artesanal para organizar ingredientes, embalagens, tempo e preço de venda com mais controle.",
    eyebrow: "Confeitaria artesanal",
    heroTitle:
      "Calculadora para confeitaria artesanal para organizar ingredientes, custos e preço de venda.",
    heroDescription:
      "Na confeitaria artesanal, muitos custos passam despercebidos: ingredientes, recheios, coberturas, embalagens, energia, perdas e tempo. A Calculadora do Produtor ajuda a enxergar melhor essa conta.",
    lead:
      "Se você procura como calcular preço de doces artesanais, bolo no pote, brigadeiros ou encomendas de confeitaria, esta página mostra como o app ajuda a montar uma base mais segura para vender.",
    benefits: [
      "Ajuda a cadastrar ingredientes sólidos, líquidos, embalagens e outros insumos da produção.",
      "Permite organizar receita, rendimento e custo por unidade de forma mais clara.",
      "Melhora a precificação de encomendas, kits, caixas e vendas unitárias.",
    ],
    steps: [
      {
        title: "1. Cadastre ingredientes e embalagens",
        description:
          "Você informa o valor pago, a unidade comprada e o consumo de cada item para enxergar melhor o custo da receita.",
      },
      {
        title: "2. Monte a base do produto",
        description:
          "Com rendimento, ingredientes e tempo organizados, fica mais fácil entender o custo por unidade.",
      },
      {
        title: "3. Veja o preço sugerido",
        description:
          "A calculadora ajuda a aplicar margem e chegar a um valor mais seguro para encomendas e pronta entrega.",
      },
    ],
    useCases: [
      {
        title: "Bolo no pote e doces unitários",
        description:
          "Ajuda a entender custo, rendimento e preço por unidade de forma mais organizada.",
      },
      {
        title: "Kits e caixas",
        description:
          "Facilita pedidos com várias unidades e embalagens diferentes.",
      },
      {
        title: "Encomendas artesanais",
        description:
          "Melhora a base para responder pedidos personalizados com mais segurança.",
      },
      {
        title: "Controle de ingredientes",
        description:
          "Permite usar sólidos, líquidos e outros insumos com mais clareza no cálculo.",
      },
    ],
    example: {
      title: "Exemplo com confeitaria artesanal",
      description:
        "Imagine uma produtora que vende bolo no pote e quer entender se o valor atual realmente dá lucro.",
      bullets: [
        "Ela cadastra leite condensado, creme de leite, chocolate, embalagens e outros ingredientes usados.",
        "Depois organiza o rendimento da receita e o tempo de produção.",
        "O app mostra o custo por unidade e ajuda a aplicar a margem desejada antes de vender.",
      ],
      result:
        "Com isso, ela deixa de cobrar só pela referência do mercado e passa a entender melhor o próprio custo.",
    },
    faqs: [
      {
        question: "A calculadora serve para bolo no pote, brigadeiro e outras receitas artesanais?",
        answer:
          "Sim. Ela ajuda a organizar ingredientes, rendimento, embalagens e preço de venda para vários tipos de produtos da confeitaria artesanal.",
      },
      {
        question: "Posso cadastrar líquidos e ingredientes por unidade?",
        answer:
          "Sim. O app já trabalha com diferentes tipos de materiais, o que ajuda bastante em produções culinárias.",
      },
      {
        question: "Ela ajuda em encomendas personalizadas?",
        answer:
          "Sim. Principalmente quando o pedido muda por tamanho, recheio, quantidade ou embalagem, ter uma base organizada facilita muito.",
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
