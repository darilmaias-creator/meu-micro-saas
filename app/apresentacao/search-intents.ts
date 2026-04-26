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
      "Calculadora para artesao | Preco, estoque e orcamentos",
    metadataDescription:
      "Calculadora para artesao com estoque, ficha tecnica, precificacao e orcamentos para quem produz personalizados, MDF, costura, papelaria e artesanato.",
    eyebrow: "Calculadora para artesao",
    heroTitle:
      "Calculadora para artesao para organizar custos, estoque e orcamentos sem complicacao.",
    heroDescription:
      "A Calculadora do Produtor ajuda quem trabalha com artesanato a sair do preco no olho. Em vez de anotar tudo em varios lugares, voce concentra materiais, ficha tecnica, preco de venda e orcamentos em um so sistema.",
    lead:
      "Se voce chegou ate aqui procurando uma calculadora para artesao, provavelmente quer parar de adivinhar valores e ganhar mais seguranca para vender. Esta pagina foi montada para mostrar, de forma simples, como o app ajuda no dia a dia de quem produz e quer cobrar melhor.",
    benefits: [
      "Cadastre materiais, custo pago, medidas, estoque atual e estoque minimo sem depender de varias planilhas.",
      "Monte fichas tecnicas para produtos personalizados, caixas, MDF, costura, papelaria, laco, biscuit e outros nichos artesanais.",
      "Calcule preco de venda com margem de lucro, acompanhe custos da operacao e gere orcamentos mais claros para o cliente.",
    ],
    steps: [
      {
        title: "1. Cadastre seus materiais do jeito que voce compra",
        description:
          "Voce informa quanto pagou, quanto veio no pacote e qual unidade usa no dia a dia. O sistema guarda isso para voce nao recalcular tudo toda vez.",
      },
      {
        title: "2. Monte a ficha tecnica do produto",
        description:
          "Escolha os materiais usados, informe as quantidades e adicione tempo de producao quando fizer sentido. Assim voce enxerga o custo real da peca.",
      },
      {
        title: "3. Veja o preco sugerido e transforme em orcamento",
        description:
          "Com os custos organizados, voce consegue definir a margem com mais seguranca e apresentar o valor ao cliente com mais profissionalismo.",
      },
    ],
    useCases: [
      {
        title: "Precificacao mais segura",
        description:
          "Ajuda a entender melhor o valor da sua peca antes de falar o preco para o cliente.",
      },
      {
        title: "Controle de materiais",
        description:
          "Mostra o que voce tem em estoque, o que esta acabando e o valor parado em insumos.",
      },
      {
        title: "Orcamentos mais claros",
        description:
          "Permite organizar itens, quantidade, desconto e total final em uma apresentacao melhor.",
      },
      {
        title: "Mais consistencia na rotina",
        description:
          "Quando um produto se repete, voce reutiliza a base ja montada e ganha tempo.",
      },
    ],
    example: {
      title: "Exemplo simples de uso no dia a dia",
      description:
        "Imagine uma artesa que faz caixas personalizadas e sempre fica em duvida na hora de cobrar.",
      bullets: [
        "Ela cadastra papel, laco, cola, embalagem e outros materiais usados na peca.",
        "Depois monta a ficha tecnica com a quantidade de cada item e o tempo de producao.",
        "O app mostra o custo, ajuda a aplicar a margem desejada e gera o valor final com mais clareza.",
      ],
      result:
        "No fim, ela deixa de passar valor no improviso e comeca a vender com mais confianca.",
    },
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
      {
        question: "Preciso entender muito de conta para usar a calculadora?",
        answer:
          "Nao. A proposta e justamente simplificar. O app organiza as informacoes de um jeito mais visual para que voce entenda o custo e o preco final sem depender de calculos complicados.",
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
  {
    slug: "como-calcular-preco-de-venda-no-artesanato",
    metadataTitle:
      "Como calcular preco de venda no artesanato | Guia simples para iniciantes",
    metadataDescription:
      "Aprenda como calcular preco de venda no artesanato considerando materiais, tempo, custos do negocio e margem de lucro sem depender de planilhas confusas.",
    eyebrow: "Preco de venda no artesanato",
    heroTitle:
      "Como calcular preco de venda no artesanato de um jeito simples e mais seguro.",
    heroDescription:
      "Muita gente soma o valor do material e acha que isso basta. Mas para cobrar melhor, voce precisa olhar tambem para tempo, custos da operacao e margem. A Calculadora do Produtor ajuda a organizar isso sem complicar sua rotina.",
    lead:
      "Se voce procura como calcular preco de venda no artesanato, provavelmente quer parar de cobrar no improviso e entender melhor o valor real da sua peca. Esta pagina mostra esse caminho de forma simples, com exemplos que fazem sentido para quem esta comecando ou quer mais clareza.",
    benefits: [
      "Ajuda a somar materiais, tempo e custos do negocio de uma forma mais organizada.",
      "Mostra o preco sugerido com base em margem, em vez de deixar tudo no chute.",
      "Transforma o calculo em uma rotina que pode ser repetida sempre que voce criar um novo produto.",
    ],
    steps: [
      {
        title: "1. Descubra quanto o produto realmente consome",
        description:
          "O primeiro passo e cadastrar os materiais e informar a quantidade usada em cada peca. Assim voce para de estimar e passa a enxergar o custo real do que sai do estoque.",
      },
      {
        title: "2. Inclua o tempo e os custos da operacao",
        description:
          "Depois voce considera o tempo de producao e os custos do negocio, como despesas da operacao, para nao deixar partes importantes do preco de fora.",
      },
      {
        title: "3. Defina a margem e veja o valor final",
        description:
          "Com a base organizada, voce escolhe a margem desejada e o sistema mostra um preco mais coerente para vender com mais seguranca.",
      },
    ],
    useCases: [
      {
        title: "Menos preco no olho",
        description:
          "Ajuda a parar de passar valor so pela intuicao ou pelo que o concorrente cobra.",
      },
      {
        title: "Mais seguranca para responder clientes",
        description:
          "Quando voce entende o calculo, fica mais facil defender o valor da peca.",
      },
      {
        title: "Base melhor para orcamentos",
        description:
          "O preco de venda bem calculado facilita a criacao de propostas mais claras.",
      },
      {
        title: "Mais consistencia no negocio",
        description:
          "Mesmo quando o produto muda pouco, voce consegue repetir o processo sem recomecar do zero.",
      },
    ],
    example: {
      title: "Exemplo facil para entender",
      description:
        "Imagine uma artesa que faz lembrancinhas personalizadas e quer saber quanto cobrar por cada unidade.",
      bullets: [
        "Ela cadastra papel, fita, cola, embalagem e os outros materiais usados na lembrancinha.",
        "Depois informa o tempo medio de producao e observa os custos da operacao do negocio.",
        "O app soma a base do produto, aplica a margem desejada e mostra um preco final mais claro para vender.",
      ],
      result:
        "Em vez de cobrar um valor aleatorio, ela passa a vender sabendo melhor quanto custa produzir e quanto quer ganhar.",
    },
    faqs: [
      {
        question: "Posso calcular o preco de venda so pelo valor do material?",
        answer:
          "Voce ate pode, mas isso costuma deixar muita coisa de fora. Tempo, desperdicio, custos da operacao e margem tambem influenciam no valor final e ajudam a evitar prejuizo.",
      },
      {
        question: "Quem esta comecando tambem precisa pensar em margem de lucro?",
        answer:
          "Sim. Mesmo no inicio, entender a margem ajuda voce a saber se o valor cobrado esta cobrindo o custo e deixando retorno para o negocio continuar.",
      },
      {
        question: "A Calculadora do Produtor faz esse calculo automaticamente?",
        answer:
          "Sim. O objetivo do app e justamente organizar os dados e mostrar um preco mais seguro sem que voce precise refazer a conta toda vez manualmente.",
      },
      {
        question: "Esse calculo serve para encomendas e produtos personalizados?",
        answer:
          "Serve sim. Principalmente quando cada pedido muda um pouco, ter uma base organizada ajuda muito a adaptar o preco sem perder a logica do calculo.",
      },
    ],
  },
  {
    slug: "calculadora-para-croche",
    metadataTitle:
      "Calculadora para croche | Como calcular preco de croche com mais seguranca",
    metadataDescription:
      "Use uma calculadora para croche para organizar materiais, tempo de producao e preco de venda sem depender de contas manuais.",
    eyebrow: "Calculadora para croche",
    heroTitle:
      "Calculadora para croche para cobrar melhor sem passar valor no improviso.",
    heroDescription:
      "Quem trabalha com croche costuma lidar com fio, enchimento, aviamentos, tempo de producao e detalhes que mudam de uma peca para outra. A Calculadora do Produtor ajuda a transformar isso em um preco mais claro.",
    lead:
      "Se voce procura como calcular preco de croche, quanto cobrar por amigurumi ou como organizar materiais de croche, esta pagina foi feita para mostrar como o app simplifica essa rotina para quem produz por encomenda ou por pronta entrega.",
    benefits: [
      "Ajuda a cadastrar fios, enchimentos, olhos, etiquetas, embalagens e outros materiais usados no croche.",
      "Permite montar a ficha tecnica da peca com consumo e tempo de producao de forma mais organizada.",
      "Mostra um preco sugerido mais seguro para nao depender so da intuicao ou da comparacao com outros perfis.",
    ],
    steps: [
      {
        title: "1. Cadastre os materiais do croche",
        description:
          "Voce informa quanto pagou no fio, no enchimento e nos aviamentos para criar uma base mais real do custo da peca.",
      },
      {
        title: "2. Monte a ficha da peca",
        description:
          "O app ajuda a reunir os materiais usados e o tempo medio de producao para que o calculo nao fique solto.",
      },
      {
        title: "3. Veja o preco com mais seguranca",
        description:
          "Com a margem definida, voce chega a um valor mais coerente para apresentar ao cliente ou usar em pronta entrega.",
      },
    ],
    useCases: [
      {
        title: "Preco de amigurumi",
        description:
          "Ajuda a organizar pecas que usam mais tempo e variam muito de tamanho e detalhe.",
      },
      {
        title: "Controle de materiais",
        description:
          "Mostra melhor o consumo de fios, enchimento e itens de acabamento.",
      },
      {
        title: "Orcamento sob encomenda",
        description:
          "Facilita quando cada cliente pede cor, tamanho ou acabamento diferente.",
      },
      {
        title: "Mais consistencia",
        description:
          "Evita recalcular tudo do zero sempre que voce repete um modelo parecido.",
      },
    ],
    example: {
      title: "Exemplo com uma peca de croche",
      description:
        "Imagine uma artesa que vende amigurumis e quer saber se o valor cobrado realmente compensa.",
      bullets: [
        "Ela cadastra o fio, o enchimento, os olhos, a etiqueta e a embalagem usados em cada peca.",
        "Depois informa o tempo medio de producao para entender melhor o peso da mao de obra.",
        "O sistema cruza essa base com a margem desejada e mostra um preco de venda mais seguro.",
      ],
      result:
        "No fim, ela deixa de cobrar so comparando com outras paginas e passa a entender melhor o proprio valor.",
    },
    faqs: [
      {
        question: "A calculadora serve para amigurumi e outras pecas de croche?",
        answer:
          "Sim. Ela ajuda tanto em pecas simples quanto em produtos que exigem mais tempo e variam bastante de material e acabamento.",
      },
      {
        question: "Posso usar a calculadora para croche no celular?",
        answer:
          "Sim. O app funciona no celular e no computador, o que ajuda muito quem produz e vende ao mesmo tempo.",
      },
      {
        question: "Ela ajuda a calcular tempo de producao no croche?",
        answer:
          "Sim. O objetivo e justamente evitar que o preco fique baseado so no valor do fio e dos materiais diretos.",
      },
    ],
  },
  {
    slug: "calculadora-para-lacos",
    metadataTitle:
      "Calculadora para lacos | Como calcular preco de lacos e kits personalizados",
    metadataDescription:
      "Aprenda a usar uma calculadora para lacos para organizar fita, acabamento, embalagem e tempo de producao em um preco mais claro.",
    eyebrow: "Calculadora para lacos",
    heroTitle:
      "Calculadora para lacos para precificar pecas e kits com mais clareza.",
    heroDescription:
      "Quando o produto parece pequeno, muita gente acaba cobrando menos do que deveria. A Calculadora do Produtor ajuda quem trabalha com lacos a enxergar materiais, tempo e margem com mais seguranca.",
    lead:
      "Se voce vende lacos, kits infantis, presilhas ou acessorios personalizados, esta pagina mostra como o app ajuda a sair do preco no olho e montar uma base mais profissional para vender.",
    benefits: [
      "Ajuda a cadastrar fitas, mantas, presilhas, colas, etiquetas, embalagens e outros itens do dia a dia.",
      "Facilita a precificacao de pecas unitarias e kits com quantidades diferentes.",
      "Permite gerar orcamentos mais claros para pedidos personalizados e lembrancinhas.",
    ],
    steps: [
      {
        title: "1. Cadastre os materiais de cada laco",
        description:
          "Voce informa o valor das fitas, presilhas, colas e acabamentos para criar uma base organizada do custo.",
      },
      {
        title: "2. Monte o produto ou o kit",
        description:
          "A calculadora ajuda a reunir os itens usados e a visualizar o custo por unidade ou por conjunto.",
      },
      {
        title: "3. Defina a margem com mais seguranca",
        description:
          "Com a base pronta, fica mais facil chegar a um preco coerente e apresentar esse valor ao cliente.",
      },
    ],
    useCases: [
      {
        title: "Lacos unitarios",
        description:
          "Ideal para entender melhor o custo de cada peca antes de definir o preco final.",
      },
      {
        title: "Kits e conjuntos",
        description:
          "Ajuda quando voce vende pares, trios, caixas ou kits personalizados.",
      },
      {
        title: "Pedidos por tema",
        description:
          "Facilita a adaptacao quando cada pedido usa cor, acabamento ou composicao diferente.",
      },
      {
        title: "Organizacao de estoque",
        description:
          "Melhora o controle de fitas, embalagens e outros materiais que acabam rapido.",
      },
    ],
    example: {
      title: "Exemplo com um kit de lacos",
      description:
        "Imagine uma produtora que faz kits infantis e sempre tem dificuldade para saber quanto cobrar.",
      bullets: [
        "Ela cadastra fitas, mantas, presilhas, cola, embalagem e todos os outros detalhes usados.",
        "Depois monta o kit no app e entende melhor o custo total e o custo por item.",
        "Com a margem aplicada, o sistema mostra um preco mais claro para vender ou fazer orcamento.",
      ],
      result:
        "Assim, o valor deixa de ser so uma tentativa e passa a ter mais base para sustentar a venda.",
    },
    faqs: [
      {
        question: "Serve para quem vende laco unitario e tambem kits?",
        answer:
          "Sim. A calculadora ajuda tanto em pecas individuais quanto em conjuntos com mais de um item.",
      },
      {
        question: "Posso usar para laco personalizado?",
        answer:
          "Pode sim. Esse tipo de pedido varia bastante, e justamente por isso ter uma base organizada faz diferenca.",
      },
      {
        question: "A calculadora ajuda a montar orcamento para cliente?",
        answer:
          "Sim. Alem de precificar, ela tambem ajuda a transformar esse valor em uma proposta mais clara.",
      },
    ],
  },
  {
    slug: "calculadora-para-biscuit",
    metadataTitle:
      "Calculadora para biscuit | Como calcular preco de pecas de biscuit",
    metadataDescription:
      "Use uma calculadora para biscuit para organizar massa, tinta, acabamento, tempo e preco de venda com mais controle.",
    eyebrow: "Calculadora para biscuit",
    heroTitle:
      "Calculadora para biscuit para organizar pecas personalizadas e cobrar melhor.",
    heroDescription:
      "No biscuit, pequenos detalhes fazem diferenca no custo. Massa, tinta, base, acabamento, embalagem e tempo de producao precisam entrar na conta para o preco nao ficar abaixo do ideal.",
    lead:
      "Se voce procura como calcular preco de biscuit, como precificar topo de bolo ou lembrancinhas personalizadas, esta pagina ajuda a entender como o app pode simplificar esse processo.",
    benefits: [
      "Ajuda a cadastrar massa, tinta, cola, base, verniz, embalagem e outros materiais usados nas pecas.",
      "Permite montar fichas tecnicas para topos de bolo, lembrancinhas e enfeites personalizados.",
      "Mostra um preco mais claro para encomendas que mudam de tamanho, tema e nivel de detalhe.",
    ],
    steps: [
      {
        title: "1. Organize o custo dos materiais",
        description:
          "Voce informa o valor dos insumos usados no biscuit para entender melhor o que cada peca consome.",
      },
      {
        title: "2. Monte a base da encomenda",
        description:
          "Com os materiais e o tempo reunidos, a ficha tecnica deixa de depender so da memoria.",
      },
      {
        title: "3. Veja o preco sugerido",
        description:
          "O sistema mostra um valor mais coerente para encomendas personalizadas, ajudando voce a responder com mais seguranca.",
      },
    ],
    useCases: [
      {
        title: "Topo de bolo",
        description:
          "Ajuda em pecas mais detalhadas, que costumam exigir mais tempo e acabamento.",
      },
      {
        title: "Lembrancinhas",
        description:
          "Facilita o calculo de encomendas com varias unidades do mesmo modelo.",
      },
      {
        title: "Pecas personalizadas",
        description:
          "Melhora a base para adaptar o valor quando o tema muda ou o pedido cresce.",
      },
      {
        title: "Mais controle",
        description:
          "Permite repetir o processo com mais consistencia sempre que um produto parecido voltar.",
      },
    ],
    example: {
      title: "Exemplo com uma encomenda de biscuit",
      description:
        "Imagine uma artesa que faz topo de bolo e sente dificuldade para explicar o valor ao cliente.",
      bullets: [
        "Ela cadastra massa, tintas, bases, verniz, cola e outros itens usados na peca.",
        "Depois registra o tempo de producao e o nivel de detalhe da encomenda.",
        "O app organiza esses custos e ajuda a chegar a um preco mais claro para apresentar.",
      ],
      result:
        "Com isso, ela ganha mais seguranca para cobrar e mais clareza para defender o valor do proprio trabalho.",
    },
    faqs: [
      {
        question: "A calculadora serve para topo de bolo e lembrancinhas de biscuit?",
        answer:
          "Sim. Ela ajuda tanto em pecas unitarias mais detalhadas quanto em lotes maiores de lembrancinhas.",
      },
      {
        question: "Como o app ajuda em encomendas personalizadas?",
        answer:
          "Ele organiza a base de material, tempo e margem para que voce adapte o preco sem recomecar a conta do zero.",
      },
      {
        question: "Posso usar pelo celular durante a producao?",
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
      "Use uma calculadora para papelaria personalizada para organizar papel, impressao, acabamento e preco de venda em um so lugar.",
    eyebrow: "Papelaria personalizada",
    heroTitle:
      "Calculadora para papelaria personalizada para precificar sem se perder nos detalhes.",
    heroDescription:
      "Quem trabalha com papelaria personalizada lida com muitos pequenos custos: papel, impressao, lamina, cola, fita, embalagem e acabamento. A Calculadora do Produtor ajuda a organizar tudo isso em uma base mais clara.",
    lead:
      "Se voce vende convites, caixinhas, topos, adesivos, lembrancinhas impressas ou kits personalizados, esta pagina mostra como o app ajuda a calcular melhor o preco e apresentar orcamentos com mais seguranca.",
    benefits: [
      "Ajuda a cadastrar papel, impressao, corte, fita, cola, lamina e outros materiais recorrentes.",
      "Permite montar fichas tecnicas para produtos unitarios e kits de festa.",
      "Melhora a precificacao de pedidos que mudam por tema, quantidade e acabamento.",
    ],
    steps: [
      {
        title: "1. Cadastre os insumos mais usados",
        description:
          "Voce informa os custos de papeis, impressao, materiais de acabamento e embalagens para ter uma base mais fiel.",
      },
      {
        title: "2. Monte o produto ou kit",
        description:
          "O app ajuda a reunir os componentes de cada item, facilitando repetir a conta em pedidos parecidos.",
      },
      {
        title: "3. Gere o preco e o orcamento",
        description:
          "Com a margem definida, voce chega a um valor mais organizado para passar ao cliente com mais confianca.",
      },
    ],
    useCases: [
      {
        title: "Caixinhas e lembrancinhas",
        description:
          "Ideal para quem monta itens unitarios e kits completos para festas.",
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
        "Ela cadastra papel, impressao, fita, cola, tags, embalagem e outros itens usados no kit.",
        "Depois monta os produtos no app e entende o custo por item e o total do pedido.",
        "Com a margem aplicada, o sistema mostra um preco mais claro para orcar e vender.",
      ],
      result:
        "Assim, ela passa a cobrar com mais base e evita deixar detalhes importantes fora do valor final.",
    },
    faqs: [
      {
        question: "A calculadora serve para kits de festa e produtos unitarios?",
        answer:
          "Sim. Ela ajuda tanto em itens individuais quanto em kits maiores de papelaria personalizada.",
      },
      {
        question: "Posso usar para convites e produtos com acabamento especial?",
        answer:
          "Pode sim. Justamente porque esse tipo de produto tem muitos detalhes, organizar a base ajuda bastante.",
      },
      {
        question: "O app ajuda a montar orcamento para cliente?",
        answer:
          "Sim. Alem de precificar, ele tambem ajuda a transformar o valor em uma apresentacao mais clara.",
      },
    ],
  },
  {
    slug: "calculadora-para-confeitaria-artesanal",
    metadataTitle:
      "Calculadora para confeitaria artesanal | Como calcular preco de doces e encomendas",
    metadataDescription:
      "Use uma calculadora para confeitaria artesanal para organizar ingredientes, embalagens, tempo e preco de venda com mais controle.",
    eyebrow: "Confeitaria artesanal",
    heroTitle:
      "Calculadora para confeitaria artesanal para organizar ingredientes, custos e preco de venda.",
    heroDescription:
      "Na confeitaria artesanal, muitos custos passam despercebidos: ingredientes, recheios, coberturas, embalagens, energia, perdas e tempo. A Calculadora do Produtor ajuda a enxergar melhor essa conta.",
    lead:
      "Se voce procura como calcular preco de doces artesanais, bolo no pote, brigadeiros ou encomendas de confeitaria, esta pagina mostra como o app ajuda a montar uma base mais segura para vender.",
    benefits: [
      "Ajuda a cadastrar ingredientes solidos, liquidos, embalagens e outros insumos da producao.",
      "Permite organizar receita, rendimento e custo por unidade de forma mais clara.",
      "Melhora a precificacao de encomendas, kits, caixas e vendas unitarias.",
    ],
    steps: [
      {
        title: "1. Cadastre ingredientes e embalagens",
        description:
          "Voce informa o valor pago, a unidade comprada e o consumo de cada item para enxergar melhor o custo da receita.",
      },
      {
        title: "2. Monte a base do produto",
        description:
          "Com rendimento, ingredientes e tempo organizados, fica mais facil entender o custo por unidade.",
      },
      {
        title: "3. Veja o preco sugerido",
        description:
          "A calculadora ajuda a aplicar margem e chegar a um valor mais seguro para encomendas e pronta entrega.",
      },
    ],
    useCases: [
      {
        title: "Bolo no pote e doces unitarios",
        description:
          "Ajuda a entender custo, rendimento e preco por unidade de forma mais organizada.",
      },
      {
        title: "Kits e caixas",
        description:
          "Facilita pedidos com varias unidades e embalagens diferentes.",
      },
      {
        title: "Encomendas artesanais",
        description:
          "Melhora a base para responder pedidos personalizados com mais seguranca.",
      },
      {
        title: "Controle de ingredientes",
        description:
          "Permite usar solidos, liquidos e outros insumos com mais clareza no calculo.",
      },
    ],
    example: {
      title: "Exemplo com confeitaria artesanal",
      description:
        "Imagine uma produtora que vende bolo no pote e quer entender se o valor atual realmente da lucro.",
      bullets: [
        "Ela cadastra leite condensado, creme de leite, chocolate, embalagens e outros ingredientes usados.",
        "Depois organiza o rendimento da receita e o tempo de producao.",
        "O app mostra o custo por unidade e ajuda a aplicar a margem desejada antes de vender.",
      ],
      result:
        "Com isso, ela deixa de cobrar so pela referencia do mercado e passa a entender melhor o proprio custo.",
    },
    faqs: [
      {
        question: "A calculadora serve para bolo no pote, brigadeiro e outras receitas artesanais?",
        answer:
          "Sim. Ela ajuda a organizar ingredientes, rendimento, embalagens e preco de venda para varios tipos de produtos da confeitaria artesanal.",
      },
      {
        question: "Posso cadastrar liquidos e ingredientes por unidade?",
        answer:
          "Sim. O app ja trabalha com diferentes tipos de materiais, o que ajuda bastante em producoes culinarias.",
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
