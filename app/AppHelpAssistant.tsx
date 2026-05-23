"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CornerDownLeft,
  MessageCircleQuestion,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { getPathForActiveTab, type ActiveTab } from "@/lib/app-tabs";
import {
  APP_HELP_CONTEXT_EVENT,
  type AppHelpContextEventDetail,
} from "@/lib/help-assistant-events";
import type { AssistantContext } from "@/lib/assistant-context";

type AppHelpAssistantProps = {
  activeTab: ActiveTab;
  assistantContext: AssistantContext;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
  targetHref?: string;
  targetLabel?: string;
};

type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

const TAB_LABELS: Record<ActiveTab, string> = {
  calculator: "Calcular Preço",
  inventory: "Meus Materiais",
  operationCosts: "Custos da Operação",
  sales: "Orçamentos e Vendas",
  dashboard: "Resumo",
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "onboarding",
    label: "Primeiro uso",
    prompt: "quero fazer o primeiro uso guiado",
  },
  {
    id: "start",
    label: "Como eu começo?",
    prompt: "como começo a usar a calculadora",
  },
  {
    id: "materials",
    label: "Cadastrar insumo",
    prompt: "como cadastrar insumos e materiais",
  },
  {
    id: "pricing",
    label: "Calcular preço",
    prompt: "quero calcular preço de um novo produto",
  },
  {
    id: "margin",
    label: "Qual margem usar?",
    prompt: "qual margem de lucro eu devo usar",
  },
  {
    id: "mistakes",
    label: "Erros comuns",
    prompt: "quais erros comuns devo evitar na precificação",
  },
];

type BotReply = {
  text: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
  targetHref?: string;
  targetLabel?: string;
};

type OnboardingFlowState = {
  type: "onboarding";
  step: 1 | 2 | 3;
  craftType?: string;
  hasMaterials?: string;
};

type PriceCalculationFlowState = {
  type: "price-calculation";
  step: 1 | 2 | 3;
  productName?: string;
  materials?: string;
};

type PriceDoubtFlowState = {
  type: "price-doubt";
  step: 1 | 2;
  reason?: string;
};

type OptimizationFlowState = {
  type: "optimization";
  step: 1 | 2;
};

type ConversationFlowState =
  | OnboardingFlowState
  | PriceCalculationFlowState
  | PriceDoubtFlowState
  | OptimizationFlowState;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function shouldStartOnboarding(normalizedPrompt: string) {
  return includesAny(normalizedPrompt, [
    "primeiro uso",
    "onboarding",
    "uso guiado",
    "comecar guiado",
    "começar guiado",
    "me guia passo",
    "me guie passo",
    "vamos comecar",
    "vamos começar",
  ]);
}

function shouldStartPriceCalculation(normalizedPrompt: string) {
  return includesAny(normalizedPrompt, [
    "quero calcular preco",
    "quero calcular preço",
    "calcular preco de um novo produto",
    "calcular preço de um novo produto",
    "calcular preco do produto",
    "calcular preço do produto",
    "me ajuda a calcular preco",
    "me ajuda a calcular preço",
    "preciso calcular preco",
    "preciso calcular preço",
  ]);
}

function shouldStartPriceDoubt(normalizedPrompt: string) {
  return (
    includesAny(normalizedPrompt, [
      "preco de r$16 esta muito alto",
      "preço de r$16 está muito alto",
      "preco de 16 esta muito alto",
      "preço de 16 está muito alto",
      "r$16 esta muito alto",
      "r$16 está muito alto",
      "16 esta muito alto",
      "16 está muito alto",
      "preco esta muito alto",
      "preço está muito alto",
      "preco ficou muito alto",
      "preço ficou muito alto",
    ]) ||
    (includesAny(normalizedPrompt, ["preco", "preço", "valor"]) &&
      includesAny(normalizedPrompt, ["muito alto", "caro", "alto demais"]))
  );
}

function shouldStartOptimization(normalizedPrompt: string) {
  return includesAny(normalizedPrompt, [
    "quero otimizar",
    "otimizar meus produtos",
    "otimizar produtos",
    "ganhar mais dinheiro",
    "como ganho mais",
    "como ganhar mais",
    "melhorar margem",
    "melhorar minha margem",
    "aumentar lucro",
    "aumentar meu lucro",
    "analisar meus produtos",
    "analise meus produtos",
    "análise meus produtos",
  ]);
}

function getCraftOnboardingReply(craftType: string) {
  const normalizedCraftType = normalizeText(craftType);

  if (
    includesAny(normalizedCraftType, [
      "bijuteria",
      "joia",
      "joias",
      "joalheiro",
      "joalheira",
    ])
  ) {
    return "Ótimo! Bijuteria é um ótimo negócio. Margem ideal é 50-60%.";
  }

  if (includesAny(normalizedCraftType, ["costura", "costureira", "costureiro"])) {
    return "Ótimo! Costura exige valorizar bem sua mão de obra. Margem ideal é 40-50%.";
  }

  if (includesAny(normalizedCraftType, ["ceramica", "cerâmica"])) {
    return "Ótimo! Cerâmica tem muito valor artesanal. Margem ideal é 60-70%.";
  }

  if (
    includesAny(normalizedCraftType, [
      "madeira",
      "marcenaria",
      "marceneiro",
      "marceneira",
    ])
  ) {
    return "Ótimo! Marcenaria costuma ter material e acabamento importantes. Margem ideal é 50-60%.";
  }

  if (includesAny(normalizedCraftType, ["pintura", "arte", "quadros", "tela"])) {
    return "Ótimo! Arte autoral precisa valorizar técnica, tempo e exclusividade. Margem ideal é 70-80%.";
  }

  return `Ótimo! ${craftType} pode ser precificado com segurança quando você separa material, tempo e margem.`;
}

function getMaterialsOnboardingReply(answer: string) {
  const normalizedAnswer = normalizeText(answer);

  if (
    includesAny(normalizedAnswer, [
      "nao",
      "não",
      "ainda nao",
      "ainda não",
      "nenhum",
      "primeiro produto",
      "primeira vez",
      "nao tenho",
      "não tenho",
    ])
  ) {
    return "Perfeito! Vou te guiar passo-a-passo.";
  }

  if (
    includesAny(normalizedAnswer, [
      "sim",
      "ja tenho",
      "já tenho",
      "tenho",
      "cadastrei",
      "cadastrados",
    ])
  ) {
    return "Ótimo! Então vamos usar seus insumos cadastrados como base para calcular melhor.";
  }

  return "Perfeito! Vou considerar isso e te guiar pelo próximo passo.";
}

function buildOnboardingStartReply() {
  return {
    text:
      "Olá! 👋 Bem-vindo ao Calcula Artesão!\n\nSou seu assistente de IA e estou aqui para ajudar você a calcular o preço certo para seus produtos.\n\nVamos começar com 3 perguntas:\n\n1️⃣ Qual é o seu tipo de artesanato?",
    targetTab: "calculator" as const,
  } satisfies BotReply;
}

function buildOnboardingStepReply(
  userPrompt: string,
  flowState: OnboardingFlowState,
) {
  if (flowState.step === 1) {
    const craftType = userPrompt.trim();

    return {
      nextFlowState: {
        type: "onboarding",
        step: 2,
        craftType,
      } satisfies OnboardingFlowState,
      reply: {
        text: `${getCraftOnboardingReply(craftType)}\n\n2️⃣ Você já tem insumos cadastrados?`,
        targetTab: "inventory" as const,
      } satisfies BotReply,
    };
  }

  if (flowState.step === 2) {
    const hasMaterials = userPrompt.trim();

    return {
      nextFlowState: {
        type: "onboarding",
        step: 3,
        craftType: flowState.craftType,
        hasMaterials,
      } satisfies OnboardingFlowState,
      reply: {
        text: `${getMaterialsOnboardingReply(hasMaterials)}\n\n3️⃣ Qual é o seu maior desafio?`,
        targetTabs: ["inventory", "calculator"],
      } satisfies BotReply,
    };
  }

  return {
    nextFlowState: null,
    reply: {
      text:
        "Entendo. Vou te ajudar a calcular o preço certo.\n\nVamos começar? Clique em “Adicionar Insumo” e me diga qual é o seu primeiro material.",
      targetTab: "inventory" as const,
    } satisfies BotReply,
  };
}

function buildPriceCalculationStartReply() {
  return {
    text:
      "Vejo que você está criando um novo produto!\n\nPara calcular o preço certo, preciso de algumas informações:\n\n1️⃣ Qual é o nome do produto?",
    targetTab: "calculator" as const,
  } satisfies BotReply;
}

function buildPriceCalculationStepReply(
  userPrompt: string,
  flowState: PriceCalculationFlowState,
) {
  if (flowState.step === 1) {
    const productName = userPrompt.trim();

    return {
      nextFlowState: {
        type: "price-calculation",
        step: 2,
        productName,
      } satisfies PriceCalculationFlowState,
      reply: {
        text: "2️⃣ Quais materiais você usa?",
        targetTab: "calculator" as const,
      } satisfies BotReply,
    };
  }

  if (flowState.step === 2) {
    const materials = userPrompt.trim();

    return {
      nextFlowState: {
        type: "price-calculation",
        step: 3,
        productName: flowState.productName,
        materials,
      } satisfies PriceCalculationFlowState,
      reply: {
        text: "3️⃣ Quanto tempo leva para fazer?",
        targetTab: "calculator" as const,
      } satisfies BotReply,
    };
  }

  const productionTime = userPrompt.trim();
  const productName = flowState.productName || "seu produto";
  const materials = flowState.materials || "os materiais informados";

  return {
    nextFlowState: null,
    reply: {
      text:
        `Perfeito! Deixa eu calcular...\n\n📊 Seu produto: ${productName}\n- Materiais: ${materials}\n- Custo de material: R$5\n- Mão de obra (${productionTime}): R$2\n- Embalagem: R$1\n- **Custo Total: R$8**\n\nCom margem de 50%, o preço sugerido é: **R$16**\n\nIsso faz sentido para você? Quer ajustar?\n\nPara valores exatos, preencha esses dados na ficha técnica da aba Calcular Preço.`,
      targetTab: "calculator" as const,
    } satisfies BotReply,
  };
}

function buildPriceDoubtStartReply() {
  return {
    text: "Entendo! Vamos analisar:\n\nVocê acha que está alto por quê?",
    targetTab: "calculator" as const,
  } satisfies BotReply;
}

function buildPriceDoubtStepReply(
  userPrompt: string,
  flowState: PriceDoubtFlowState,
) {
  if (flowState.step === 1) {
    const reason = userPrompt.trim();

    return {
      nextFlowState: {
        type: "price-doubt",
        step: 2,
        reason,
      } satisfies PriceDoubtFlowState,
      reply: {
        text:
          "Ah, entendi. Vamos comparar:\n\nSe você cobra R$10 em uma pulseira que custa R$8:\n- Lucro por pulseira: R$2\n- Margem: 20% (muito baixa!)\n- Você precisa vender 5x mais para ganhar bem\n\nSe você cobra R$16:\n- Lucro por pulseira: R$8\n- Margem: 50% (ideal!)\n- Você vende menos, mas ganha mais por venda\n\nDica: Teste cobrar R$14 e veja se vende. Pode ser o ponto ótimo!",
        targetTab: "calculator" as const,
      } satisfies BotReply,
    };
  }

  return {
    nextFlowState: null,
    reply: {
      text: "Ótimo! Me avisa como foi. Estou aqui para ajudar!",
      targetTabs: ["calculator", "sales", "dashboard"],
    } satisfies BotReply,
  };
}

function buildOptimizationStartReply(savedProductCount: number) {
  if (savedProductCount <= 0) {
    return {
      text:
        "Ainda não encontrei produtos cadastrados para analisar.\n\nPara otimizar de verdade, primeiro salve alguns produtos no catálogo com custo, preço e margem. Depois eu posso te ajudar a comparar quais têm melhor resultado.\n\nQuer uma dica para preparar essa análise?",
      targetTabs: ["calculator", "dashboard"],
    } satisfies BotReply;
  }

  return {
    text:
      `Vejo que você tem ${savedProductCount} ${savedProductCount === 1 ? "produto cadastrado" : "produtos cadastrados"}. Parabéns! 🎉\n\nQuer uma dica para ganhar mais dinheiro?`,
    targetTab: "dashboard" as const,
  } satisfies BotReply;
}

function getOptimizationProductHighlights(
  products: AssistantContext["appData"]["savedProducts"],
) {
  const productsWithMargin = products.filter(
    (product) => product.margin !== null,
  );

  if (productsWithMargin.length === 0) {
    return {
      bestProduct: null,
      lowestProduct: null,
      summaryLines: products
        .slice(0, 5)
        .map((product) => `- ${product.name}: margem ainda não calculada`),
    };
  }

  const sortedByMargin = [...productsWithMargin].sort(
    (firstProduct, secondProduct) =>
      (firstProduct.margin ?? 0) - (secondProduct.margin ?? 0),
  );
  const lowestProduct = sortedByMargin[0] ?? null;
  const bestProduct = sortedByMargin[sortedByMargin.length - 1] ?? null;

  return {
    bestProduct,
    lowestProduct,
    summaryLines: products.slice(0, 5).map((product) => {
      const marginLabel =
        product.margin === null
          ? "margem não calculada"
          : `margem ${product.margin.toFixed(1)}%`;

      return `- ${product.name}: ${marginLabel}`;
    }),
  };
}

function buildOptimizationAnalysisText(
  products: AssistantContext["appData"]["savedProducts"],
) {
  const { bestProduct, lowestProduct, summaryLines } =
    getOptimizationProductHighlights(products);

  if (!bestProduct || !lowestProduct || bestProduct.id === lowestProduct.id) {
    return `Boa. Com os produtos cadastrados, dá para começar por esta leitura:\n\n${summaryLines.join(
      "\n",
    )}\n\nRecomendações:\n1. Confira se todos têm custo e preço preenchidos\n2. Identifique qual tem melhor margem\n3. Revise produtos com margem baixa, custo alto ou preço manual muito apertado\n\nAbra o Resumo e me diga qual produto você quer ajustar primeiro.`;
  }

  const averageMargin =
    products.reduce((total, product) => total + (product.margin ?? 0), 0) /
    products.filter((product) => product.margin !== null).length;

  return `Analisando seus produtos cadastrados:\n${summaryLines.join(
    "\n",
  )}\n\nRecomendações:\n1. Revise ${lowestProduct.name} (menor margem: ${lowestProduct.margin?.toFixed(
    1,
  )}%)\n2. Foque em ${bestProduct.name} (melhor margem: ${bestProduct.margin?.toFixed(
    1,
  )}%)\n3. Compare materiais e tempo dos produtos com margem menor\n\nSua margem média nos produtos com margem calculada está em ${averageMargin.toFixed(
    1,
  )}%. Se quiser, me diga qual produto quer ajustar primeiro.`;
}

function buildOptimizationStepReply(
  userPrompt: string,
  flowState: OptimizationFlowState,
  assistantContext: AssistantContext,
) {
  const savedProducts = assistantContext.appData.savedProducts;
  const savedProductCount = savedProducts.length;

  if (flowState.step === 1) {
    const normalizedPrompt = normalizeText(userPrompt);

    if (
      includesAny(normalizedPrompt, [
        "nao",
        "não",
        "agora nao",
        "agora não",
        "depois",
      ])
    ) {
      return {
        nextFlowState: null,
        reply: {
          text: "Tudo bem. Quando quiser otimizar margem, preço ou custos, é só me chamar.",
          targetTabs: ["calculator", "dashboard"],
        } satisfies BotReply,
      };
    }

    if (savedProductCount <= 0) {
      return {
        nextFlowState: null,
        reply: {
          text:
            "Perfeito. Comece salvando de 3 a 5 produtos no catálogo. Para cada um, confira:\n\n1. Custo total por unidade\n2. Preço de venda\n3. Lucro real\n4. Margem\n\nDepois compare assim:\n- Produto com margem alta: foque mais nele\n- Produto com margem baixa: aumente preço ou reduza custo\n- Produto que vende muito: teste pequenos aumentos de preço\n\nQuando tiver produtos salvos, me chame de novo para otimizar.",
          targetTabs: ["calculator", "dashboard"],
        } satisfies BotReply,
      };
    }

    return {
      nextFlowState: {
        type: "optimization",
        step: 2,
      } satisfies OptimizationFlowState,
      reply: {
        text: buildOptimizationAnalysisText(savedProducts),
        targetTabs: ["dashboard", "sales", "calculator"],
      } satisfies BotReply,
    };
  }

  return {
    nextFlowState: null,
    reply: {
      text:
        "Teste aumentar 15% (de R$12 para R$13,80) e veja se as vendas caem. Se caírem menos de 20%, você ganha mais dinheiro!",
      targetTabs: ["calculator", "sales", "dashboard"],
    } satisfies BotReply,
  };
}

function buildConversationStepReply(
  userPrompt: string,
  flowState: ConversationFlowState,
  assistantContext: AssistantContext,
) {
  if (flowState.type === "onboarding") {
    return buildOnboardingStepReply(userPrompt, flowState);
  }

  if (flowState.type === "price-calculation") {
    return buildPriceCalculationStepReply(userPrompt, flowState);
  }

  if (flowState.type === "price-doubt") {
    return buildPriceDoubtStepReply(userPrompt, flowState);
  }

  return buildOptimizationStepReply(userPrompt, flowState, assistantContext);
}

function buildContextualHelpReply(topic: AppHelpContextEventDetail["topic"]) {
  if (topic === "material-cost") {
    return {
      text:
        "Custo de Material é quanto você gasta em insumos para fazer 1 unidade do produto.\n\nExemplo: Se você faz uma bijuteria com:\n- Fio de nylon: R$2\n- Miçanga: R$3\n- Total: R$5\n\nVocê já adicionou seus insumos? Se sim, selecione-os aqui.",
      targetTabs: ["inventory", "calculator"],
    } satisfies BotReply;
  }
}

function buildBotReply(userPrompt: string, activeTab: ActiveTab) {
  const normalizedPrompt = normalizeText(userPrompt);

  if (normalizedPrompt.length <= 2) {
    return {
      text:
        "Pode escrever sua dúvida com mais detalhe? Exemplo: “como criar meu primeiro produto?” ou “qual margem eu uso?”.",
      targetTab: "calculator",
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "o que e premium",
      "o que é premium",
      "premium",
      "vale a pena assinar",
      "qual e a diferenca",
      "qual é a diferença",
      "qual a diferenca",
      "qual a diferença",
      "posso testar antes",
      "teste premium",
      "trial",
      "assinar",
    ])
  ) {
    return {
      text:
        "Ótima pergunta! Com Premium você ganha:\n\n✅ **Insumos Ilimitados** (vs 20 no grátis)\n✅ **Produtos Ilimitados** (vs 10 no grátis)\n✅ **Personalização** - Adicione seu logo nos orçamentos\n✅ **Backup Automático** - Seus dados seguros\n✅ **Histórico Completo** - Veja todas as mudanças\n\n**Vale a pena?**\nSe você tem mais de 20 insumos ou 10 produtos, SIM!\nSe você quer personalizar seus orçamentos, SIM!\n\n**Bom Notícia:**\nVocê pode testar Premium por 7 dias, sem cartão de crédito!\n\nQuer ativar o teste agora? Clique aqui: [Ativar Trial]",
      targetHref: "/premium",
      targetLabel: "Ativar Trial",
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "o que voce faz",
      "o que voce consegue",
      "voce consegue",
      "assistente",
      "agente",
      "inteligencia artificial",
      "inteligência artificial",
      "o que faz o assistente",
      "limite",
      "limitacoes",
      "limitações",
    ])
  ) {
    return {
      text:
        "Eu sou o assistente da Calcula Artesão. Posso te orientar sobre como usar a calculadora, cadastrar insumos, montar ficha técnica, entender material, mão de obra, energia e margem.\n\nEu não substituo a calculadora do app: para valores exatos, use os campos da ficha técnica. Também não acesso dados de outros usuários nem faço recomendações financeiras complexas.",
      targetTabs: ["inventory", "calculator", "operationCosts"],
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["cada um", "cada uma"])) {
    return {
      text:
        "Perfeito, vamos por partes:\n1) Meus Materiais: cadastre insumos, preço pago, medida e estoque.\n2) Calcular Preço: monte a ficha técnica, informe tempo, perdas e margem.\n3) Custos da Operação: inclua aluguel, luz, internet, embalagem e taxas.\n4) Orçamentos e Vendas: gere proposta para cliente e registre vendas.\n5) Resumo: acompanhe resultados e sinais de atenção.\n\nSe quiser, te levo direto para a aba certa.",
      targetTabs: [
        "inventory",
        "calculator",
        "operationCosts",
        "sales",
        "dashboard",
      ],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "cada aba",
      "explica cada",
      "como uso cada",
      "me explica tudo",
      "como funciona o app",
      "explicar abas",
      "me explica as abas",
      "como usar as abas",
    ])
  ) {
    return {
      text:
        "Claro! Resumo simples:\n1) Meus Materiais: cadastre tudo que entra no produto.\n2) Calcular Preço: transforme material + tempo + custos em preço sugerido.\n3) Custos da Operação: registre despesas do negócio para não vender no prejuízo.\n4) Orçamentos e Vendas: envie proposta e registre venda fechada.\n5) Resumo: veja faturamento, lucro e pontos de atenção.",
      targetTabs: [
        "inventory",
        "calculator",
        "operationCosts",
        "sales",
        "dashboard",
      ],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "como funciona a calculadora",
      "como comeco",
      "por onde comeco",
      "primeiro passo",
      "me ajuda a criar meu primeiro produto",
      "nao entendo como usar isso",
      "sou iniciante",
      "nao sei por onde comecar",
      "começar",
      "comecar",
    ])
  ) {
    return {
      text:
        "Ótimo! Vou te guiar passo-a-passo. A calculadora tem 3 passos simples:\n\n1️⃣ **Selecione seus insumos** - Escolha os materiais que você usa\n2️⃣ **Configure os custos** - Adicione tempo, energia, acabamento\n3️⃣ **Veja o preço sugerido** - O app calcula automaticamente\n\nQual é o seu tipo de artesanato? (ex: bijuteria, cerâmica, costura)\nIsso me ajuda a dar dicas mais precisas.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "material",
      "estoque",
      "insumo",
      "meus materiais",
      "aba meus materiais",
      "como uso a aba meus materiais",
      "como usar meus materiais",
      "como adiciono um material",
      "adicionar um material",
      "adiciono um material",
      "qual informacao preciso do insumo",
      "qual informação preciso do insumo",
      "nao sei quanto custa o material",
      "não sei quanto custa o material",
      "material e vendido por metro",
      "material é vendido por metro",
      "vendido por metro",
      "cadastrar insumo",
      "cadastrar material",
      "materiais",
    ])
  ) {
    return {
      text:
        "Perfeito! Para adicionar um material, você precisa de:\n\n📌 **Nome** - Ex: \"Fio de Nylon\"\n💰 **Custo** - Quanto você paga por unidade\n📏 **Medida** - A unidade (kg, metro, peça, etc)\n📦 **Estoque** - Quanto você tem agora\n⚠️ **Estoque Mínimo** - Quando reabastecer\n\n**Dica:** Se você compra 1kg por R$50, o custo é R$50/kg.\nSe compra 10 metros por R$100, o custo é R$10/metro.\n\nQual é o seu material? Vou te ajudar a configurar.",
      targetTab: "inventory" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "categorize seus produtos",
      "categorizar produtos",
      "categorizar meus produtos",
      "categorias de produtos",
      "produtos premium",
      "produtos populares",
      "produtos desconto",
      "explorar mais o 2",
      "explorar o 2",
    ])
  ) {
    return {
      text:
        "Boa escolha. Categorizar produtos ajuda você a parar de usar a mesma margem para tudo.\n\n**1. Produtos Premium**\n- Margem sugerida: 60-70%\n- Produtos personalizados, exclusivos ou com acabamento superior\n- Exemplo: peça sob encomenda, kit especial, edição limitada\n\n**2. Produtos Populares**\n- Margem sugerida: 50-60%\n- Produtos que vendem bem e têm boa saída\n- Exemplo: item campeão de vendas, produto de vitrine, lembrancinha recorrente\n\n**3. Produtos de Desconto**\n- Margem sugerida: 30-40%\n- Produtos para atrair cliente, limpar estoque ou montar combo\n- Cuidado: use com estratégia para não vender no prejuízo\n\n**Como aplicar no app:**\nSalve o produto no catálogo, acompanhe no Resumo quais vendem mais e ajuste a margem na aba Calcular Preço.",
      targetTabs: ["calculator", "sales", "dashboard"],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "como calculo o custo do meu produto",
      "calculo o custo do meu produto",
      "calcular o custo do produto",
      "custo do meu produto",
      "qual e o custo",
      "qual é o custo",
      "custo de uma bijuteria",
      "preciso incluir mao de obra",
      "preciso incluir mão de obra",
      "como adiciono o tempo de producao",
      "como adiciono o tempo de produção",
      "tempo de producao",
      "tempo de produção",
    ])
  ) {
    return {
      text:
        "Ótimo! O custo tem 4 partes:\n\n1️⃣ **Custo de Material** - Quanto você gasta em insumos\n2️⃣ **Mão de Obra** - Tempo que você leva para fazer\n3️⃣ **Custos Operacionais** - Energia, aluguel, etc (rateado)\n4️⃣ **Acabamento** - Embalagem, etiqueta, frete (se aplicável)\n\n**Exemplo prático:**\n- Bijuteria com fio (R$2) + miçanga (R$3) = R$5 de material\n- Leva 15 minutos para fazer (R$2 de mão de obra)\n- Embalagem (R$1)\n- **Custo Total: R$8**\n\nQual é o seu produto? Vou ajudar a calcular.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "produto",
      "criar produto",
      "primeiro produto",
      "ficha",
      "ficha tecnica",
      "ficha técnica",
    ])
  ) {
    return {
      text:
        "Para criar um produto:\n1) Entre em Calcular Preço.\n2) Selecione os materiais do estoque e informe quanto usa de cada um.\n3) Preencha tempo de máquina ou tempo manual, se houver.\n4) Informe rendimento, perdas e custos extras.\n5) Veja o preço sugerido e salve no catálogo.\n\nA ficha técnica é o coração do preço: ela evita cobrar “no olho”.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "o que e margem",
      "o que é margem",
      "diferenca entre margem e lucro",
      "diferença entre margem e lucro",
      "50% de margem e bom",
      "50% de margem é bom",
      "50 de margem e bom",
      "50 de margem é bom",
      "como saber se meu preco esta certo",
      "como saber se meu preço está certo",
      "margem e lucro",
      "margem é lucro",
    ])
  ) {
    return {
      text:
        "Ótima dúvida! Muita gente confunde:\n\n**Margem** = % do preço que é lucro\n**Lucro** = Valor em reais que você ganha\n\n**Exemplo:**\n- Custo: R$8\n- Preço: R$16\n- Lucro: R$8 (em reais)\n- Margem: 50% (porque 8/16 = 50%)\n\n**Por que isso importa?**\n- Margem baixa (30%) = Você vende muito, mas ganha pouco\n- Margem alta (70%) = Você vende pouco, mas ganha mais\n- Margem ideal (50-60%) = Equilíbrio entre volume e lucro\n\n**Teste na calculadora:**\n1. Adicione um produto\n2. Veja a margem sugerida\n3. Ajuste para ver como muda o preço\n\nQuer que eu explique mais alguma coisa?",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "sou joalheiro",
      "sou joalheira",
      "joalheiro",
      "joalheira",
      "bijuteria",
    ])
  ) {
    return {
      text:
        "**🎨 BIJUTERIA**\n- Margem sugerida: 50-60%\n- Maior custo: material (fio, miçanga, corrente, fecho)\n- Atenção: peças pequenas parecem baratas, mas o tempo de montagem pesa\n- Dica: venda em kits ou lotes para aumentar o ticket médio\n\nNa calculadora, cadastre cada material e informe o tempo de montagem para não cobrar só o custo dos insumos.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "faço ceramica",
      "faço cerâmica",
      "faco ceramica",
      "faco cerâmica",
      "ceramica",
      "cerâmica",
    ])
  ) {
    return {
      text:
        "**🏺 CERÂMICA**\n- Margem sugerida: 60-70%\n- Maior custo: queima, material, perdas e tempo de acabamento\n- Atenção: inclua peças perdidas, esmalte, energia/forno e embalagem\n- Dica: produtos únicos, séries pequenas e personalização podem vender mais caro\n\nNa calculadora, use custos extras para queima/acabamento e ajuste a margem conforme exclusividade da peça.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "sou costureira",
      "sou costureiro",
      "costura",
      "preco medio",
      "preço médio",
    ])
  ) {
    return {
      text:
        "**🧵 COSTURA**\n- Margem sugerida: 40-50%\n- Maior custo: mão de obra\n- Atenção: não cobre só tecido, linha e aviamentos\n- Dica: cobre por hora trabalhada + material + acabamento\n\nNa calculadora, preencha bem o tempo manual. Esse é normalmente o ponto que mais muda o preço justo na costura.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "marcenaria",
      "madeira",
      "marceneiro",
      "marceneira",
    ])
  ) {
    return {
      text:
        "**🪵 MARCENARIA**\n- Margem sugerida: 50-60%\n- Maior custo: madeira, ferragens, acabamento e tempo de produção\n- Atenção: inclua perda de corte, lixa, verniz, energia e transporte\n- Dica: customização e medidas sob encomenda aumentam valor percebido\n\nNa calculadora, use custos extras para acabamento e transporte quando eles fizerem parte da entrega.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "arte/pintura",
      "pintura",
      "sou artista",
      "quadros",
      "tela",
    ])
  ) {
    return {
      text:
        "**🎭 ARTE/PINTURA**\n- Margem sugerida: 70-80%\n- Maior custo: tempo, técnica e exclusividade\n- Atenção: não cobre só tinta, tela e pincel\n- Dica: edições limitadas, assinatura e encomendas personalizadas podem elevar o preço\n\nNa calculadora, valorize seu tempo e use margem maior para peças autorais.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "brinquedo",
      "brinquedos",
      "pelucia",
      "pelúcia",
      "amigurumi",
    ])
  ) {
    return {
      text:
        "**🧸 BRINQUEDOS/PELÚCIA**\n- Margem sugerida: 40-50%\n- Maior custo: material + mão de obra\n- Atenção: peças com muitos detalhes consomem bastante tempo\n- Dica: personalização com nome, cor ou tema aumenta valor percebido\n\nNa calculadora, informe o tempo manual com cuidado e salve modelos recorrentes no catálogo.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "meu setor e diferente",
      "meu setor é diferente",
      "setor diferente",
      "setor",
    ])
  ) {
    return {
      text:
        "Entendi! Vou dar dicas específicas para seu setor.\n\n**🎨 BIJUTERIA**\n- Margem: 50-60%\n- Maior custo: Material (fio, miçanga, etc)\n- Dica: Venda em lotes para aumentar volume\n\n**🧵 COSTURA**\n- Margem: 40-50%\n- Maior custo: Mão de obra\n- Dica: Cobre por hora trabalhada + material\n\n**🏺 CERÂMICA**\n- Margem: 60-70%\n- Maior custo: Queima e material\n- Dica: Produtos únicos vendem mais caro\n\n**🪵 MARCENARIA**\n- Margem: 50-60%\n- Maior custo: Material (madeira)\n- Dica: Customização aumenta preço\n\n**🎭 ARTE/PINTURA**\n- Margem: 70-80%\n- Maior custo: Tempo\n- Dica: Edições limitadas vendem mais\n\n**🧸 BRINQUEDOS/PELÚCIA**\n- Margem: 40-50%\n- Maior custo: Material + mão de obra\n- Dica: Personalizações aumentam valor\n\nQual é seu setor? Vou dar dicas mais precisas!",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "qual preco devo cobrar",
      "qual preço devo cobrar",
      "qual e a margem ideal",
      "qual é a margem ideal",
      "meu preco esta bom",
      "meu preço está bom",
      "meu preço esta bom",
      "como nao vender no prejuizo",
      "como não vender no prejuízo",
      "nao vender no prejuizo",
      "não vender no prejuízo",
    ])
  ) {
    return {
      text:
        "Excelente pergunta! A fórmula é simples:\n\n**Preço = Custo ÷ (1 - Margem)**\n\n**Margens por tipo de artesanato:**\n- 🎨 Bijuteria: 50-60% (custo baixo, muita concorrência)\n- 🧵 Costura: 40-50% (mão de obra alta)\n- 🏺 Cerâmica: 60-70% (produto único, menos concorrência)\n- 🪵 Madeira: 50-60% (material caro, trabalho artesanal)\n\n**Exemplo:**\n- Custo: R$8\n- Margem desejada: 50%\n- Preço = 8 ÷ (1 - 0.5) = R$16\n\nQual é seu tipo de artesanato? Vou sugerir a margem ideal.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "preco",
      "preço",
      "precificar",
      "calcular",
      "preco sugerido",
      "preço sugerido",
      "margem",
      "lucro",
      "quanto cobrar",
    ])
  ) {
    if (
      includesAny(normalizedPrompt, [
        "margem",
        "lucro",
        "qual margem",
        "porcentagem",
        "percentual",
      ])
    ) {
      return {
        text:
          "Como ponto de partida, muitos artesãos testam margens entre 30% e 60%, dependendo do produto, acabamento, demanda e posicionamento.\n\nUse assim:\n- Produto simples e competitivo: margem menor.\n- Produto personalizado, delicado ou sob encomenda: margem maior.\n- Se a margem real ficar apertada, revise material, tempo ou preço de venda.\n\nO app mostra o lucro real depois que você informa os custos.",
        targetTab: "calculator" as const,
      } satisfies BotReply;
    }

    return {
      text:
        "Para calcular preço, o app soma material, perdas, tempo, custos operacionais e margem. O preço sugerido aparece na aba Calcular Preço.\n\nDica: se o preço ficou muito baixo, provavelmente algum custo ficou de fora. Se ficou muito alto, revise desperdício, tempo, rendimento e margem.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "mao de obra",
      "mão de obra",
      "hora",
      "tempo",
      "acabamento",
      "trabalho",
    ])
  ) {
    return {
      text:
        "Mão de obra é o valor do seu tempo. Informe quanto você quer ganhar por hora e depois preencha o tempo gasto no produto.\n\nExemplo: se sua hora vale R$ 30 e você gasta 30 minutos, o app considera metade desse valor no custo. Isso ajuda a parar de cobrar só material.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "energia",
      "maquina",
      "máquina",
      "laser",
      "cnc",
      "depreciacao",
      "depreciação",
    ])
  ) {
    return {
      text:
        "Custos de máquina entram quando você informa valor da máquina, vida útil, energia e tempo de uso. O app usa isso para estimar quanto aquele produto consumiu de máquina/energia.\n\nSe você não usa máquina, pode deixar esses campos zerados e focar em material + mão de obra.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "meu calculo esta errado",
      "meu cálculo está errado",
      "calculo esta errado",
      "cálculo está errado",
      "o preco nao faz sentido",
      "o preço não faz sentido",
      "preco nao faz sentido",
      "preço não faz sentido",
      "nao consigo adicionar um produto",
      "não consigo adicionar um produto",
      "nao consigo adicionar produto",
      "não consigo adicionar produto",
      "a calculadora nao esta funcionando",
      "a calculadora não está funcionando",
      "calculadora nao funciona",
      "calculadora não funciona",
      "nao consigo adicionar um insumo",
      "não consigo adicionar um insumo",
      "custo esta dobrando",
      "custo está dobrando",
    ])
  ) {
    return {
      text:
        "Sem problema! Vou ajudar a resolver.\n\nPode me descrever o problema? Por exemplo:\n- ❌ \"Adicionei um produto mas o preço ficou muito alto\"\n- ❌ \"Não consigo adicionar um insumo\"\n- ❌ \"O custo está dobrando sem motivo\"\n\nEnquanto isso, aqui estão os erros mais comuns:\n\n**Erro 1: Custo muito alto**\n→ Verifique se você incluiu corretamente a medida (kg, metro, etc)\n\n**Erro 2: Preço muito alto**\n→ Reduza a margem ou verifique os custos operacionais\n\n**Erro 3: Não consegue adicionar insumo**\n→ Certifique-se que preencheu TODOS os campos obrigatórios\n\nQual é seu problema específico?",
      targetTabs: ["calculator", "inventory", "operationCosts"],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "como aumento minha margem",
      "aumentar minha margem",
      "estou vendendo muito barato",
      "vendendo muito barato",
      "como nao perder dinheiro",
      "como não perder dinheiro",
      "qual e o preco minimo que devo cobrar",
      "qual é o preço mínimo que devo cobrar",
      "preco minimo",
      "preço mínimo",
      "preco baixo",
      "preço baixo",
      "otimizar preco",
      "otimizar preço",
    ])
  ) {
    return {
      text:
        "Vamos otimizar! 3 estratégias:\n\n**1. Reduzir Custos**\n- Compre material em maior quantidade (desconto)\n- Negocie com fornecedores\n- Otimize o tempo de produção\n- Reutilize embalagem\n\n**2. Aumentar Preço**\n- Teste aumentar 10% (muitos clientes não notam)\n- Cobre mais por customização\n- Adicione valor (embalagem premium, etc)\n\n**3. Mudar Produto**\n- Foque em produtos com margem maior\n- Crie produtos premium (preço mais alto)\n- Reduza produtos com baixa margem\n\n**Dica de Ouro:**\nTeste aumentar o preço em 10% e veja se as vendas caem.\nSe caírem menos de 20%, você ganha mais dinheiro!\n\nQual é seu maior desafio? Custos altos ou preço baixo?",
      targetTabs: ["calculator", "operationCosts", "dashboard"],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "qual e a melhor forma de usar",
      "qual é a melhor forma de usar",
      "melhor forma de usar",
      "me da uma dica",
      "me dá uma dica",
      "me de uma dica",
      "me dê uma dica",
      "dica",
      "como outros artesaos usam",
      "como outros artesãos usam",
      "qual e o segredo para ganhar mais",
      "qual é o segredo para ganhar mais",
      "segredo para ganhar mais",
      "boas praticas",
      "boas práticas",
    ])
  ) {
    return {
      text:
        "Ótimo! Aqui estão as melhores práticas:\n\n**1. Atualize seus custos regularmente**\n- Preço de material muda\n- Atualize a cada 3 meses\n\n**2. Categorize seus produtos**\n- Produtos premium (margem 60-70%)\n- Produtos populares (margem 50-60%)\n- Produtos desconto (margem 30-40%)\n\n**3. Acompanhe suas vendas**\n- Qual produto vende mais?\n- Qual tem melhor margem?\n- Foque nos vencedores\n\n**4. Teste preços**\n- Aumente 10% e veja o resultado\n- Reduza 5% e veja se vende mais\n- Encontre o ponto ótimo\n\n**5. Inclua tudo no custo**\n- Não esqueça embalagem\n- Não esqueça frete\n- Não esqueça seu tempo\n\n**Resultado esperado:**\nSeguindo essas práticas, artesãos aumentam a margem em 20-30%!\n\nQual dessas você quer explorar mais?",
      targetTabs: ["calculator", "sales", "dashboard"],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "erro",
      "erros",
      "prejuizo",
      "prejuízo",
      "barato",
      "caro",
      "errado",
      "evitar",
    ])
  ) {
    return {
      text:
        "Erros comuns na precificação:\n1) Cobrar só o material e esquecer sua mão de obra.\n2) Não incluir embalagem, taxas e perdas.\n3) Usar margem igual para todos os produtos.\n4) Não atualizar preço dos insumos.\n5) Dar desconto sem saber o lucro real.\n\nSe o preço parecer estranho, revise ficha técnica, rendimento, tempo e custos operacionais.",
      targetTabs: ["calculator", "inventory", "operationCosts"],
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["orcamento", "venda", "cliente", "proposta"])) {
    return {
      text:
        "Em Orçamentos e Vendas você transforma produtos salvos em proposta para o cliente. Também pode registrar a venda quando o pedido for fechado.\n\nDica: antes de dar desconto, confira o lucro líquido para não vender com margem negativa.",
      targetTab: "sales" as const,
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "custo",
      "fixo",
      "variavel",
      "variável",
      "operacao",
      "operação",
      "aluguel",
      "internet",
      "taxa",
      "embalagem",
    ])
  ) {
    return {
      text:
        "Custos da operação são despesas que não aparecem em um único produto, mas afetam seu negócio: aluguel, internet, energia do ateliê, embalagem, taxas, transporte e manutenção.\n\nCadastre esses valores para o app ratear melhor seus custos e evitar preço bonito que dá prejuízo.",
      targetTab: "operationCosts" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["resumo", "dashboard", "relatorio"])) {
    return {
      text:
        "No Resumo você acompanha a visão geral do período: resultados, sinais de atenção e dados para decidir mais rápido.",
      targetTab: "dashboard" as const,
    } satisfies BotReply;
  }

  return {
    text:
      activeTab === "calculator"
        ? "Entendi. Na calculadora, posso te ajudar com ficha técnica, margem, mão de obra, perdas, energia e preço sugerido.\n\nTente perguntar: “qual margem usar?”, “como cadastro material?” ou “por que meu preço ficou baixo?”."
        : "Entendi sua dúvida. Posso te orientar sobre cadastro de insumos, criação de produto, margem, custos e orçamento.\n\nSe quiser um caminho guiado, clique em “Como eu começo?”.",
    targetTabs: ["inventory", "calculator", "operationCosts", "sales"],
  } satisfies BotReply;
}

function createBotMessage(
  text: string,
  options?: {
    targetHref?: string;
    targetLabel?: string;
    targetTab?: ActiveTab;
    targetTabs?: ActiveTab[];
  },
): ChatMessage {
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "bot",
    text,
    targetHref: options?.targetHref,
    targetLabel: options?.targetLabel,
    targetTab: options?.targetTab,
    targetTabs: options?.targetTabs,
  };
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    text,
  };
}

export default function AppHelpAssistant({
  activeTab,
  assistantContext,
}: AppHelpAssistantProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [conversationFlow, setConversationFlow] =
    useState<ConversationFlowState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bot-initial",
      role: "bot",
      text: "Oi! Sou o assistente da Calcula Artesão. Posso te ajudar a cadastrar insumos, montar ficha técnica, entender custos e escolher uma margem inicial.",
    },
  ]);

  const chatSummary = useMemo(
    () => `Você está em ${TAB_LABELS[activeTab]}.`,
    [activeTab],
  );

  useEffect(() => {
    function handleContextHelp(event: Event) {
      const helpEvent = event as CustomEvent<AppHelpContextEventDetail>;
      const topic = helpEvent.detail?.topic;

      if (!topic) {
        return;
      }

      const botReply: BotReply | undefined = buildContextualHelpReply(topic);

      if (!botReply) {
        return;
      }

      setIsOpen(true);
      setConversationFlow(null);
      setMessages((currentMessages) => [
        ...currentMessages,
        createBotMessage(botReply.text, {
          targetHref: botReply.targetHref,
          targetLabel: botReply.targetLabel,
          targetTab: botReply.targetTab,
          targetTabs: botReply.targetTabs,
        }),
      ]);
    }

    window.addEventListener(APP_HELP_CONTEXT_EVENT, handleContextHelp);

    return () => {
      window.removeEventListener(APP_HELP_CONTEXT_EVENT, handleContextHelp);
    };
  }, []);

  function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const userMessage = createUserMessage(trimmedPrompt);
    const normalizedPrompt = normalizeText(trimmedPrompt);
    const flowReply = conversationFlow
      ? buildConversationStepReply(
          trimmedPrompt,
          conversationFlow,
          assistantContext,
        )
      : null;
    const shouldStartOnboardingFlow = shouldStartOnboarding(normalizedPrompt);
    const shouldStartPriceCalculationFlow =
      shouldStartPriceCalculation(normalizedPrompt);
    const shouldStartPriceDoubtFlow = shouldStartPriceDoubt(normalizedPrompt);
    const shouldStartOptimizationFlow =
      shouldStartOptimization(normalizedPrompt);
    const botReply: BotReply =
      flowReply?.reply ??
      (shouldStartOnboardingFlow
        ? buildOnboardingStartReply()
        : shouldStartPriceCalculationFlow
          ? buildPriceCalculationStartReply()
          : shouldStartPriceDoubtFlow
            ? buildPriceDoubtStartReply()
            : shouldStartOptimizationFlow
              ? buildOptimizationStartReply(
                  assistantContext.appData.savedProducts.length,
                )
              : buildBotReply(trimmedPrompt, activeTab));

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      createBotMessage(botReply.text, {
        targetHref: botReply.targetHref,
        targetLabel: botReply.targetLabel,
        targetTab: botReply.targetTab,
        targetTabs: botReply.targetTabs,
      }),
    ]);
    setConversationFlow(
      flowReply?.nextFlowState ??
        (shouldStartOnboardingFlow
          ? {
              type: "onboarding",
              step: 1,
            }
          : shouldStartPriceCalculationFlow
            ? {
                type: "price-calculation",
                step: 1,
              }
            : shouldStartPriceDoubtFlow
              ? {
                  type: "price-doubt",
                  step: 1,
                }
              : shouldStartOptimizationFlow
                ? {
                    type: "optimization",
                    step: 1,
                  }
          : null),
    );
    setInputValue("");
  }

  function goToTab(tab: ActiveTab) {
    router.push(getPathForActiveTab(tab));
    setIsOpen(false);
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[45] md:bottom-6 md:right-6">
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                Ajuda do app
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Assistente de precificação
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">{chatSummary}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Fechar assistente"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "bot"
                    ? "border border-amber-100 bg-amber-50/70 text-slate-800"
                    : "ml-7 bg-slate-900 text-white"
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>

                {message.role === "bot" && message.targetTab && (
                  <button
                    type="button"
                    onClick={() => goToTab(message.targetTab as ActiveTab)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                  >
                    Ir para {TAB_LABELS[message.targetTab]}
                    <ArrowRight size={12} />
                  </button>
                )}

                {message.role === "bot" && message.targetHref && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(message.targetHref as string);
                      setIsOpen(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                  >
                    {message.targetLabel ?? "Abrir"}
                    <ArrowRight size={12} />
                  </button>
                )}

                {message.role === "bot" &&
                  !message.targetTab &&
                  message.targetTabs &&
                  message.targetTabs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.targetTabs.map((tabId) => (
                        <button
                          key={`${message.id}-${tabId}`}
                          type="button"
                          onClick={() => goToTab(tabId)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-amber-700"
                        >
                          {TAB_LABELS[tabId]}
                          <ArrowRight size={11} />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((quickAction) => (
                <button
                  key={quickAction.id}
                  type="button"
                  onClick={() => submitPrompt(quickAction.prompt)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  {quickAction.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitPrompt(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ex: Como faço meu primeiro orçamento?"
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-black outline-none transition-colors focus:border-amber-500"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition-colors hover:bg-amber-700"
                aria-label="Enviar dúvida"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <CornerDownLeft size={12} />
              Orientação educativa. Para valores exatos, use a calculadora.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-lg transition-colors hover:bg-amber-50"
      >
        <Sparkles size={14} />
        Ajuda
        <MessageCircleQuestion size={16} />
      </button>
    </div>
  );
}
