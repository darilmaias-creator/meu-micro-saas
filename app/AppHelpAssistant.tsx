"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  getAssistantLastSeenStorageKey,
  getAssistantShownTriggersStorageKey,
  getNextAssistantAutoTrigger,
  readShownAssistantTriggers,
  serializeShownAssistantTriggers,
} from "@/lib/assistant-auto-triggers";
import {
  appendConversationMessages,
  createConversationContext,
  getConversationContextStorageKey,
  normalizeConversationContext,
  type ConversationContext,
} from "@/lib/assistant-conversation-context";
import {
  detectAssistantIntent,
  matchesAssistantIntent,
} from "@/lib/assistant-intents";
import {
  addAgentSessionDuration,
  calculateAgentMetrics,
  createDefaultAgentMetricsState,
  formatAgentMetricsDashboard,
  getAgentMetricsStorageKey,
  markAgentSessionStarted,
  normalizeAgentMetricsState,
  type AgentMetricsState,
} from "@/lib/assistant-metrics";

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
  operationCosts: "Gastos do Negócio",
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
    label: "Cadastrar material",
    prompt: "como cadastrar materiais",
  },
  {
    id: "pricing",
    label: "Calcular preço",
    prompt: "quero calcular preço de um novo produto",
  },
  {
    id: "margin",
    label: "Qual lucro usar?",
    prompt: "qual lucro desejado eu devo usar",
  },
  {
    id: "mistakes",
    label: "Erros comuns",
    prompt: "quais erros comuns devo evitar na precificação",
  },
  {
    id: "metrics",
    label: "Métricas IA",
    prompt: "métricas do agente",
  },
];

type BotReply = {
  text: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
  targetHref?: string;
  targetLabel?: string;
};

type GeminiAssistantReply = {
  response?: string;
  targetHref?: string;
  targetLabel?: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
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

type ConversationTopic = "materials";

const INITIAL_BOT_MESSAGE: ChatMessage = {
  id: "bot-initial",
  role: "bot",
  text: "Oi! Sou o assistente da Calcula Artesão. Posso te ajudar a cadastrar materiais, montar seu produto, entender custos e escolher um lucro inicial.",
};

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

function isGettingStartedQuestion(normalizedPrompt: string) {
  return (
    matchesAssistantIntent(normalizedPrompt, "HELP_GETTING_STARTED") ||
    includesAny(normalizedPrompt, [
      "como funciona a calculadora",
      "como funciona isso",
      "como funciona o app",
      "como isso funciona",
      "oi como funciona",
      "ola como funciona",
      "olá como funciona",
      "como comeco",
      "primeiro passo",
      "me ajuda a criar meu primeiro produto",
      "sou iniciante",
      "nao sei por onde comecar",
      "começar",
      "comecar",
    ])
  );
}

function isMaterialHelpQuestion(normalizedPrompt: string) {
  return (
    matchesAssistantIntent(normalizedPrompt, "HELP_ADD_MATERIALS") ||
    includesAny(normalizedPrompt, [
      "estoque",
      "meus materiais",
      "aba meus materiais",
      "como uso a aba meus materiais",
      "como usar meus materiais",
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
  );
}

function isFollowUpQuestion(normalizedPrompt: string) {
  return includesAny(normalizedPrompt, [
    "e depois",
    "depois",
    "proximo",
    "próximo",
    "qual o proximo",
    "qual o próximo",
    "continua",
    "continuar",
    "como continuo",
    "o que faco depois",
    "o que faço depois",
  ]);
}

function isAgentMetricsQuestion(normalizedPrompt: string) {
  return includesAny(normalizedPrompt, [
    "metricas ia",
    "métricas ia",
    "metricas do agente",
    "métricas do agente",
    "dashboard do agente",
    "analise do agente",
    "análise do agente",
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
    return "Ótimo! Bijuteria é um ótimo negócio. Um bom lucro desejado inicial é 50-60%.";
  }

  if (includesAny(normalizedCraftType, ["costura", "costureira", "costureiro"])) {
    return "Ótimo! Costura exige valorizar bem sua mão de obra. Um bom lucro desejado inicial é 40-50%.";
  }

  if (includesAny(normalizedCraftType, ["ceramica", "cerâmica"])) {
    return "Ótimo! Cerâmica tem muito valor artesanal. Um bom lucro desejado inicial é 60-70%.";
  }

  if (
    includesAny(normalizedCraftType, [
      "madeira",
      "marcenaria",
      "marceneiro",
      "marceneira",
    ])
  ) {
    return "Ótimo! Marcenaria costuma ter material e acabamento importantes. Um bom lucro desejado inicial é 50-60%.";
  }

  if (includesAny(normalizedCraftType, ["pintura", "arte", "quadros", "tela"])) {
    return "Ótimo! Arte autoral precisa valorizar técnica, tempo e exclusividade. Um bom lucro desejado inicial é 70-80%.";
  }

  return `Ótimo! ${craftType} pode ser precificado com segurança quando você separa material, tempo e lucro desejado.`;
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
    return "Ótimo! Então vamos usar seus materiais cadastrados como base para calcular melhor.";
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
        text: `${getCraftOnboardingReply(craftType)}\n\n2️⃣ Você já tem materiais cadastrados?`,
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
        "Entendo. Vou te ajudar a calcular o preço certo.\n\nVamos começar? Clique em “Adicionar material” e me diga qual é o seu primeiro material.",
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
        `Perfeito! Deixa eu calcular...\n\n📊 Seu produto: ${productName}\n- Materiais: ${materials}\n- Custo de material: R$5\n- Mão de obra (${productionTime}): R$2\n- Embalagem: R$1\n- **Custo Total: R$8**\n\nCom lucro desejado de 50%, o preço sugerido é: **R$16**\n\nIsso faz sentido para você? Quer ajustar?\n\nPara valores exatos, preencha esses dados na aba Calcular Preço.`,
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
          "Ah, entendi. Vamos comparar:\n\nSe você cobra R$10 em uma pulseira que custa R$8:\n- Lucro por pulseira: R$2\n- Lucro sobre o preço: 20% (bem apertado)\n- Você precisa vender muito mais para compensar\n\nSe você cobra R$16:\n- Lucro por pulseira: R$8\n- Lucro sobre o preço: 50%\n- Você vende menos, mas ganha mais por venda\n\nDica: Teste cobrar R$14 e veja se vende. Pode ser o ponto ótimo!",
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
        "Ainda não encontrei produtos cadastrados para analisar.\n\nPara otimizar de verdade, primeiro salve alguns produtos com custo, preço e lucro desejado. Depois eu posso te ajudar a comparar quais têm melhor resultado.\n\nQuer uma dica para preparar essa análise?",
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
        .map((product) => `- ${product.name}: lucro ainda não calculado`),
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
          ? "lucro não calculado"
          : `lucro ${product.margin.toFixed(1)}%`;

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
    )}\n\nRecomendações:\n1. Confira se todos têm custo e preço preenchidos\n2. Identifique qual tem melhor lucro\n3. Revise produtos com lucro baixo, custo alto ou preço manual muito apertado\n\nAbra o Resumo e me diga qual produto você quer ajustar primeiro.`;
  }

  const averageMargin =
    products.reduce((total, product) => total + (product.margin ?? 0), 0) /
    products.filter((product) => product.margin !== null).length;

  return `Analisando seus produtos cadastrados:\n${summaryLines.join(
    "\n",
  )}\n\nRecomendações:\n1. Revise ${lowestProduct.name} (menor lucro: ${lowestProduct.margin?.toFixed(
    1,
  )}%)\n2. Foque em ${bestProduct.name} (melhor lucro: ${bestProduct.margin?.toFixed(
    1,
  )}%)\n3. Compare materiais e tempo dos produtos com lucro menor\n\nSeu lucro médio nos produtos calculados está em ${averageMargin.toFixed(
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
          text: "Tudo bem. Quando quiser otimizar lucro, preço ou custos, é só me chamar.",
          targetTabs: ["calculator", "dashboard"],
        } satisfies BotReply,
      };
    }

    if (savedProductCount <= 0) {
      return {
        nextFlowState: null,
        reply: {
          text:
            "Perfeito. Comece salvando de 3 a 5 produtos. Para cada um, confira:\n\n1. Custo total por unidade\n2. Preço de venda\n3. Lucro em reais\n4. Lucro em percentual\n\nDepois compare assim:\n- Produto com lucro alto: foque mais nele\n- Produto com lucro baixo: aumente preço ou reduza custo\n- Produto que vende muito: teste pequenos aumentos de preço\n\nQuando tiver produtos salvos, me chame de novo para otimizar.",
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
        "Custo de Material é quanto você gasta nos materiais para fazer 1 unidade do produto.\n\nExemplo: Se você faz uma bijuteria com:\n- Fio de nylon: R$2\n- Miçanga: R$3\n- Total: R$5\n\nVocê já adicionou seus materiais? Se sim, selecione-os aqui.",
      targetTabs: ["inventory", "calculator"],
    } satisfies BotReply;
  }
}

function buildFollowUpReply(
  topic: ConversationTopic | null,
  normalizedPrompt: string,
) {
  if (!isFollowUpQuestion(normalizedPrompt)) {
    return null;
  }

  if (topic === "materials") {
    return {
      text:
        "Depois você vai para **Calcular Preço** e cria um novo produto.\n\nSelecione os materiais que você usa, informe a quantidade de cada um, adicione o tempo de produção e pronto: a calculadora mostra o custo e o preço sugerido.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  return {
    text:
      "O próximo passo é começar pelos materiais. Cadastre tudo em **Meus Materiais** e depois use a aba **Calcular Preço** para montar o produto.",
    targetTabs: ["inventory", "calculator"],
  } satisfies BotReply;
}

function getTopicFromReply(
  normalizedPrompt: string,
  botReply: BotReply,
): ConversationTopic | null {
  if (botReply.targetTab === "inventory" || isMaterialHelpQuestion(normalizedPrompt)) {
    return "materials";
  }

  return null;
}

function buildBotReply(userPrompt: string, activeTab: ActiveTab) {
  const normalizedPrompt = normalizeText(userPrompt);

  if (normalizedPrompt.length <= 2) {
    return {
      text:
        "Pode escrever sua dúvida com mais detalhe? Exemplo: “como criar meu primeiro produto?” ou “qual lucro eu uso?”.",
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
        "Ótima pergunta! Com Premium você ganha:\n\n✅ **Materiais ilimitados** (vs 20 no grátis)\n✅ **Produtos ilimitados** (vs 10 no grátis)\n✅ **Personalização** - Adicione seu logo nos orçamentos\n✅ **Backup automático** - Seus dados seguros\n✅ **Histórico completo** - Veja todas as mudanças\n\n**Vale a pena?**\nSe você tem mais de 20 materiais ou 10 produtos, sim.\nSe você quer personalizar seus orçamentos, também faz sentido.\n\n**Boa notícia:**\nVocê pode testar Premium por 7 dias, sem cartão de crédito!\n\nQuer ativar o teste agora? Clique aqui: [Ativar Trial]",
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
        "Eu sou o assistente da Calcula Artesão. Posso te orientar sobre como usar a calculadora, cadastrar materiais, montar produto, entender material, mão de obra, energia e lucro desejado.\n\nEu não substituo a calculadora do app: para valores exatos, use os campos da aba Calcular Preço. Também não acesso dados de outros usuários nem faço recomendações financeiras complexas.",
      targetTabs: ["inventory", "calculator", "operationCosts"],
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["cada um", "cada uma"])) {
    return {
      text:
        "Perfeito, vamos por partes:\n1) Meus Materiais: cadastre materiais, preço pago, medida e estoque.\n2) Calcular Preço: monte o produto, informe tempo, perdas e lucro desejado.\n3) Gastos do Negócio: inclua aluguel, luz, internet, embalagem e taxas.\n4) Orçamentos e Vendas: gere proposta para cliente e registre vendas.\n5) Resumo: acompanhe resultados e sinais de atenção.\n\nSe quiser, te levo direto para a aba certa.",
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
        "Claro! Resumo simples:\n1) Meus Materiais: cadastre tudo que entra no produto.\n2) Calcular Preço: transforme material + tempo + gastos em preço sugerido.\n3) Gastos do Negócio: registre despesas do negócio para não vender no prejuízo.\n4) Orçamentos e Vendas: envie proposta e registre venda fechada.\n5) Resumo: veja faturamento, lucro e pontos de atenção.",
      targetTabs: [
        "inventory",
        "calculator",
        "operationCosts",
        "sales",
        "dashboard",
      ],
    } satisfies BotReply;
  }

  if (isGettingStartedQuestion(normalizedPrompt)) {
    return {
      text:
        "Olá! 👋 Bem-vindo!\n\nA calculadora ajuda você a descobrir o preço certo para seus produtos.\n\nFunciona assim:\n1. Você adiciona seus materiais\n2. Você cria um produto e seleciona os materiais\n3. A calculadora mostra o custo e o preço sugerido\n\nPara começar, cadastre seu primeiro material em Meus Materiais.",
      targetTabs: ["inventory", "calculator"],
    } satisfies BotReply;
  }

  if (isMaterialHelpQuestion(normalizedPrompt)) {
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
        "Boa escolha. Categorizar produtos ajuda você a parar de usar o mesmo lucro desejado para tudo.\n\n**1. Produtos Premium**\n- Lucro sugerido: 60-70%\n- Produtos personalizados, exclusivos ou com acabamento superior\n- Exemplo: peça sob encomenda, kit especial, edição limitada\n\n**2. Produtos Populares**\n- Lucro sugerido: 50-60%\n- Produtos que vendem bem e têm boa saída\n- Exemplo: item campeão de vendas, produto de vitrine, lembrancinha recorrente\n\n**3. Produtos de Desconto**\n- Lucro sugerido: 30-40%\n- Produtos para atrair cliente, limpar estoque ou montar combo\n- Cuidado: use com estratégia para não vender no prejuízo\n\n**Como aplicar no app:**\nSalve o produto, acompanhe no Resumo quais vendem mais e ajuste o lucro desejado na aba Calcular Preço.",
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
        "Ótimo! O custo tem 4 partes:\n\n1️⃣ **Material** - Quanto você gasta no que entra no produto\n2️⃣ **Seu tempo** - Quanto tempo você leva para fazer\n3️⃣ **Gastos do negócio** - Energia, aluguel, internet, taxas etc\n4️⃣ **Acabamento** - Embalagem, etiqueta, frete, se fizer parte da entrega\n\n**Exemplo prático:**\n- Bijuteria com fio (R$2) + miçanga (R$3) = R$5 de material\n- Leva 15 minutos para fazer (R$2 de mão de obra)\n- Embalagem (R$1)\n- **Custo Total: R$8**\n\nQual é o seu produto? Vou ajudar a calcular.",
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
        "Para criar um produto:\n1) Entre em Calcular Preço.\n2) Selecione os materiais do estoque e informe quanto usa de cada um.\n3) Preencha tempo de máquina ou tempo fazendo com as mãos, se houver.\n4) Informe rendimento, perdas e outros gastos.\n5) Veja o preço sugerido e salve o produto.\n\nA lista de materiais e tempo é o coração do preço: ela evita cobrar “no olho”.",
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
        "Ótima dúvida! No app, pense assim:\n\n**Lucro em reais** = quanto sobra depois de pagar os custos\n**Lucro em %** = quanto essa sobra representa no preço\n\n**Exemplo:**\n- Custo: R$8\n- Preço: R$16\n- Lucro: R$8\n- Lucro em %: 50%\n\n**Por que isso importa?**\n- Lucro baixo (30%) = Você vende, mas sobra pouco\n- Lucro alto (70%) = Pode valer para produto exclusivo\n- Lucro equilibrado (50-60%) = Bom ponto de partida para muitos artesãos\n\n**Teste na calculadora:**\n1. Adicione um produto\n2. Veja o preço sugerido\n3. Ajuste o lucro desejado para ver como muda o preço\n\nQuer que eu explique mais alguma coisa?",
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
        "**🎨 BIJUTERIA**\n- Lucro sugerido: 50-60%\n- Maior custo: material (fio, miçanga, corrente, fecho)\n- Atenção: peças pequenas parecem baratas, mas o tempo de montagem pesa\n- Dica: venda em kits ou lotes para aumentar o ticket médio\n\nNa calculadora, cadastre cada material e informe o tempo de montagem para não cobrar só o custo dos materiais.",
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
        "**🏺 CERÂMICA**\n- Lucro sugerido: 60-70%\n- Maior custo: queima, material, perdas e tempo de acabamento\n- Atenção: inclua peças perdidas, esmalte, energia/forno e embalagem\n- Dica: produtos únicos, séries pequenas e personalização podem vender mais caro\n\nNa calculadora, use outros gastos do produto para queima/acabamento e ajuste o lucro desejado conforme exclusividade da peça.",
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
        "**🧵 COSTURA**\n- Lucro sugerido: 40-50%\n- Maior custo: mão de obra\n- Atenção: não cobre só tecido, linha e aviamentos\n- Dica: cobre por hora trabalhada + material + acabamento\n\nNa calculadora, preencha bem o tempo fazendo com as mãos. Esse é normalmente o ponto que mais muda o preço justo na costura.",
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
        "**🪵 MARCENARIA**\n- Lucro sugerido: 50-60%\n- Maior custo: madeira, ferragens, acabamento e tempo de produção\n- Atenção: inclua perda de corte, lixa, verniz, energia e transporte\n- Dica: customização e medidas sob encomenda aumentam valor percebido\n\nNa calculadora, use outros gastos do produto para acabamento e transporte quando eles fizerem parte da entrega.",
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
        "**🎭 ARTE/PINTURA**\n- Lucro sugerido: 70-80%\n- Maior custo: tempo, técnica e exclusividade\n- Atenção: não cobre só tinta, tela e pincel\n- Dica: edições limitadas, assinatura e encomendas personalizadas podem elevar o preço\n\nNa calculadora, valorize seu tempo e use lucro maior para peças autorais.",
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
        "**🧸 BRINQUEDOS/PELÚCIA**\n- Lucro sugerido: 40-50%\n- Maior custo: material + mão de obra\n- Atenção: peças com muitos detalhes consomem bastante tempo\n- Dica: personalização com nome, cor ou tema aumenta valor percebido\n\nNa calculadora, informe o tempo fazendo com as mãos com cuidado e salve modelos recorrentes.",
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
        "Entendi! Vou dar dicas específicas para seu setor.\n\n**🎨 BIJUTERIA**\n- Lucro sugerido: 50-60%\n- Maior custo: material (fio, miçanga, etc)\n- Dica: venda em lotes para aumentar volume\n\n**🧵 COSTURA**\n- Lucro sugerido: 40-50%\n- Maior custo: mão de obra\n- Dica: cobre por hora trabalhada + material\n\n**🏺 CERÂMICA**\n- Lucro sugerido: 60-70%\n- Maior custo: queima e material\n- Dica: produtos únicos vendem mais caro\n\n**🪵 MARCENARIA**\n- Lucro sugerido: 50-60%\n- Maior custo: material (madeira)\n- Dica: customização aumenta preço\n\n**🎭 ARTE/PINTURA**\n- Lucro sugerido: 70-80%\n- Maior custo: tempo\n- Dica: edições limitadas vendem mais\n\n**🧸 BRINQUEDOS/PELÚCIA**\n- Lucro sugerido: 40-50%\n- Maior custo: material + mão de obra\n- Dica: personalizações aumentam valor\n\nQual é seu setor? Vou dar dicas mais precisas!",
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
        "Excelente pergunta! A ideia é simples:\n\nVocê informa o custo e escolhe quanto quer ganhar. O app transforma isso em preço sugerido.\n\n**Lucro desejado por tipo de artesanato:**\n- 🎨 Bijuteria: 50-60% (custo baixo, muita concorrência)\n- 🧵 Costura: 40-50% (mão de obra alta)\n- 🏺 Cerâmica: 60-70% (produto único, menos concorrência)\n- 🪵 Madeira: 50-60% (material caro, trabalho artesanal)\n\n**Exemplo:**\n- Custo: R$8\n- Lucro desejado: 50%\n- Preço sugerido: R$16\n\nQual é seu tipo de artesanato? Vou sugerir um ponto de partida.",
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
          "Como ponto de partida, muitos artesãos testam lucro desejado entre 30% e 60%, dependendo do produto, acabamento, demanda e posicionamento.\n\nUse assim:\n- Produto simples e competitivo: lucro menor.\n- Produto personalizado, delicado ou sob encomenda: lucro maior.\n- Se o lucro real ficar apertado, revise material, tempo ou preço de venda.\n\nO app mostra o lucro real depois que você informa os custos.",
        targetTab: "calculator" as const,
      } satisfies BotReply;
    }

    return {
      text:
        "Para calcular preço, o app soma material, perdas, tempo, gastos do negócio e lucro desejado. O preço sugerido aparece na aba Calcular Preço.\n\nDica: se o preço ficou muito baixo, provavelmente algum custo ficou de fora. Se ficou muito alto, revise desperdício, tempo, rendimento e lucro desejado.",
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
        "Sem problema! Vou ajudar a resolver.\n\nPode me descrever o problema? Por exemplo:\n- ❌ \"Adicionei um produto mas o preço ficou muito alto\"\n- ❌ \"Não consigo adicionar um material\"\n- ❌ \"O custo está dobrando sem motivo\"\n\nEnquanto isso, aqui estão os erros mais comuns:\n\n**Erro 1: Custo muito alto**\n→ Verifique se você incluiu corretamente a medida (kg, metro, etc)\n\n**Erro 2: Preço muito alto**\n→ Reduza o lucro desejado ou verifique os gastos do negócio\n\n**Erro 3: Não consegue adicionar material**\n→ Certifique-se que preencheu todos os campos obrigatórios\n\nQual é seu problema específico?",
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
        "Vamos otimizar! 3 estratégias:\n\n**1. Reduzir custos**\n- Compre material em maior quantidade, se fizer sentido\n- Negocie com fornecedores\n- Otimize o tempo de produção\n- Reutilize embalagem quando possível\n\n**2. Aumentar preço**\n- Teste aumentar 10%\n- Cobre mais por customização\n- Adicione valor, como embalagem premium\n\n**3. Mudar o foco**\n- Foque em produtos com lucro maior\n- Crie produtos premium\n- Revise produtos com lucro baixo\n\n**Dica:**\nTeste aumentar o preço em 10% e veja se as vendas caem. Se caírem pouco, você ganha mais dinheiro.\n\nQual é seu maior desafio? Custos altos ou preço baixo?",
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
        "Ótimo! Aqui estão as melhores práticas:\n\n**1. Atualize seus custos regularmente**\n- Preço de material muda\n- Atualize a cada 3 meses\n\n**2. Categorize seus produtos**\n- Produtos premium (lucro 60-70%)\n- Produtos populares (lucro 50-60%)\n- Produtos desconto (lucro 30-40%)\n\n**3. Acompanhe suas vendas**\n- Qual produto vende mais?\n- Qual deixa mais lucro?\n- Foque nos vencedores\n\n**4. Teste preços**\n- Aumente 10% e veja o resultado\n- Reduza 5% e veja se vende mais\n- Encontre o ponto ótimo\n\n**5. Inclua tudo no custo**\n- Não esqueça embalagem\n- Não esqueça frete\n- Não esqueça seu tempo\n\nQual dessas você quer explorar mais?",
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
        "Erros comuns no preço:\n1) Cobrar só o material e esquecer sua mão de obra.\n2) Não incluir embalagem, taxas e perdas.\n3) Usar o mesmo lucro desejado para todos os produtos.\n4) Não atualizar preço dos materiais.\n5) Dar desconto sem saber o lucro real.\n\nSe o preço parecer estranho, revise materiais, rendimento, tempo e gastos do negócio.",
      targetTabs: ["calculator", "inventory", "operationCosts"],
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["orcamento", "venda", "cliente", "proposta"])) {
    return {
      text:
        "Em Orçamentos e Vendas você transforma produtos salvos em proposta para o cliente. Também pode registrar a venda quando o pedido for fechado.\n\nDica: antes de dar desconto, confira o lucro líquido para não vender no prejuízo.",
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
        "Gastos do negócio são despesas que não aparecem em um único produto, mas afetam seu negócio: aluguel, internet, energia do ateliê, embalagem, taxas, transporte e manutenção.\n\nCadastre esses valores para o app dividir melhor seus gastos e evitar preço bonito que dá prejuízo.",
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
        ? "Entendi. Na calculadora, posso te ajudar com materiais, lucro desejado, mão de obra, perdas, energia e preço sugerido.\n\nTente perguntar: “qual lucro usar?”, “como cadastro material?” ou “por que meu preço ficou baixo?”."
        : "Entendi sua dúvida. Posso te orientar sobre cadastro de materiais, criação de produto, lucro desejado, custos e orçamento.\n\nSe quiser um caminho guiado, clique em “Como eu começo?”.",
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

function getChatMessagesStorageKey(userId: string) {
  return `calcula-artesao:assistant-messages:${userId}`;
}

function getChatOpenStorageKey(userId: string) {
  return `calcula-artesao:assistant-open:${userId}`;
}

function isActiveTab(value: unknown): value is ActiveTab {
  return (
    value === "calculator" ||
    value === "inventory" ||
    value === "operationCosts" ||
    value === "sales" ||
    value === "dashboard"
  );
}

function normalizeStoredChatMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [INITIAL_BOT_MESSAGE];
  }

  const storedMessages = value
    .filter((message): message is Partial<ChatMessage> => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const role = (message as Partial<ChatMessage>).role;
      const text = (message as Partial<ChatMessage>).text;

      return (role === "bot" || role === "user") && typeof text === "string";
    })
    .slice(-30)
    .map((message, index) => ({
      id:
        typeof message.id === "string" && message.id
          ? message.id
          : `stored-${index}`,
      role: message.role as "bot" | "user",
      text: message.text as string,
      targetHref:
        typeof message.targetHref === "string" ? message.targetHref : undefined,
      targetLabel:
        typeof message.targetLabel === "string"
          ? message.targetLabel
          : undefined,
      targetTab: isActiveTab(message.targetTab) ? message.targetTab : undefined,
      targetTabs: Array.isArray(message.targetTabs)
        ? message.targetTabs.filter(isActiveTab)
        : undefined,
    }));

  return storedMessages.length > 0 ? storedMessages : [INITIAL_BOT_MESSAGE];
}

async function requestGeminiAssistantReply({
  activeTab,
  assistantContext,
  conversationHistory,
  message,
}: {
  activeTab: ActiveTab;
  assistantContext: AssistantContext;
  conversationHistory: ConversationContext["conversationHistory"];
  message: string;
}) {
  const response = await fetch("/api/ai-assistant/gemini", {
    body: JSON.stringify({
      activeTab,
      assistantContext,
      conversationHistory,
      message,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | GeminiAssistantReply
    | null;

  if (!payload?.response) {
    return null;
  }

  return {
    targetHref: payload.targetHref,
    targetLabel: payload.targetLabel,
    targetTab: isActiveTab(payload.targetTab) ? payload.targetTab : undefined,
    targetTabs: Array.isArray(payload.targetTabs)
      ? payload.targetTabs.filter(isActiveTab)
      : undefined,
    text: payload.response,
  } satisfies BotReply;
}

export default function AppHelpAssistant({
  activeTab,
  assistantContext,
}: AppHelpAssistantProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(
          getChatOpenStorageKey(assistantContext.user.id),
        ) === "true"
      );
    } catch {
      return false;
    }
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationFlow, setConversationFlow] =
    useState<ConversationFlowState | null>(null);
  const [conversationTopic, setConversationTopic] =
    useState<ConversationTopic | null>(null);
  const [persistentContext, setPersistentContext] =
    useState<ConversationContext>(() => {
      const fallbackContext = createConversationContext({
        userId: assistantContext.user.id,
        sector: assistantContext.user.sector ?? "",
        isPremium: assistantContext.user.isPremium,
      });

      if (typeof window === "undefined") {
        return fallbackContext;
      }

      try {
        const storedContext = window.localStorage.getItem(
          getConversationContextStorageKey(assistantContext.user.id),
        );

        return normalizeConversationContext(
          storedContext ? JSON.parse(storedContext) : null,
          fallbackContext,
        );
      } catch {
        return fallbackContext;
      }
    });
  const [agentMetrics, setAgentMetrics] = useState<AgentMetricsState>(() => {
    const fallbackMetrics = createDefaultAgentMetricsState(
      assistantContext.appData.savedProducts.length,
    );

    if (typeof window === "undefined") {
      return fallbackMetrics;
    }

    try {
      const storedMetrics = window.localStorage.getItem(
        getAgentMetricsStorageKey(assistantContext.user.id),
      );

      return normalizeAgentMetricsState(
        storedMetrics ? JSON.parse(storedMetrics) : null,
        fallbackMetrics,
      );
    } catch {
      return fallbackMetrics;
    }
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [INITIAL_BOT_MESSAGE];
    }

    try {
      const storedMessages = window.localStorage.getItem(
        getChatMessagesStorageKey(assistantContext.user.id),
      );

      return normalizeStoredChatMessages(
        storedMessages ? JSON.parse(storedMessages) : null,
      );
    } catch {
      return [INITIAL_BOT_MESSAGE];
    }
  });
  const scheduledAutoTriggerRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const sessionLastRecordedAtRef = useRef<number | null>(null);
  const hasMarkedSessionStartedRef = useRef(false);

  const chatSummary = useMemo(
    () => `Você está em ${TAB_LABELS[activeTab]}.`,
    [activeTab],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getConversationContextStorageKey(assistantContext.user.id),
        JSON.stringify(persistentContext),
      );
    } catch {
      // The assistant still works if browser storage is unavailable.
    }
  }, [assistantContext.user.id, persistentContext]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getChatMessagesStorageKey(assistantContext.user.id),
        JSON.stringify(messages),
      );
    } catch {
      // The assistant still works if browser storage is unavailable.
    }
  }, [assistantContext.user.id, messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getChatOpenStorageKey(assistantContext.user.id),
        String(isOpen),
      );
    } catch {
      // The assistant still works if browser storage is unavailable.
    }
  }, [assistantContext.user.id, isOpen]);

  useEffect(() => {
    if (hasMarkedSessionStartedRef.current) {
      return;
    }

    hasMarkedSessionStartedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      const now = Date.now();
      sessionStartedAtRef.current = now;
      sessionLastRecordedAtRef.current = now;
      setAgentMetrics((currentMetrics) =>
        markAgentSessionStarted(currentMetrics),
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function getSessionDurationDelta() {
    const now = Date.now();
    const lastRecordedAt = sessionLastRecordedAtRef.current ?? now;
    const durationDelta = now - lastRecordedAt;
    sessionStartedAtRef.current = sessionStartedAtRef.current ?? now;
    sessionLastRecordedAtRef.current = now;
    return durationDelta;
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getAgentMetricsStorageKey(assistantContext.user.id),
        JSON.stringify(agentMetrics),
      );
    } catch {
      // The assistant still works if browser storage is unavailable.
    }
  }, [agentMetrics, assistantContext.user.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAgentMetrics((currentMetrics) => {
        const productCount = assistantContext.appData.savedProducts.length;

        if (productCount <= currentMetrics.lastProductCount) {
          return currentMetrics;
        }

        return {
          ...currentMetrics,
          lastProductCount: productCount,
          productsCreatedAfterHelp:
            currentMetrics.totalMessages > 0
              ? currentMetrics.productsCreatedAfterHelp +
                (productCount - currentMetrics.lastProductCount)
              : currentMetrics.productsCreatedAfterHelp,
        };
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [assistantContext.appData.savedProducts.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shownTriggers = readShownAssistantTriggers(
      window.localStorage.getItem(
        getAssistantShownTriggersStorageKey(assistantContext.user.id),
      ),
    );
    const lastSeenAt = window.localStorage.getItem(
      getAssistantLastSeenStorageKey(assistantContext.user.id),
    );
    const hasConversationStarted =
      persistentContext.messagesCount > 0 || messages.length > 1;
    const autoTrigger = getNextAssistantAutoTrigger({
      assistantContext,
      hasConversationStarted,
      lastSeenAt,
      shownTriggers,
    });

    if (!autoTrigger) {
      window.localStorage.setItem(
        getAssistantLastSeenStorageKey(assistantContext.user.id),
        new Date().toISOString(),
      );
      scheduledAutoTriggerRef.current = null;
      return;
    }

    if (scheduledAutoTriggerRef.current === autoTrigger.id) {
      return;
    }

    scheduledAutoTriggerRef.current = autoTrigger.id;
    const timeoutId = window.setTimeout(() => {
      const nextShownTriggers = readShownAssistantTriggers(
        window.localStorage.getItem(
          getAssistantShownTriggersStorageKey(assistantContext.user.id),
        ),
      );

      if (nextShownTriggers.has(autoTrigger.id)) {
        return;
      }

      const botMessage = createBotMessage(autoTrigger.text, {
        targetHref: autoTrigger.targetHref,
        targetLabel: autoTrigger.targetLabel,
        targetTab: autoTrigger.targetTab,
        targetTabs: autoTrigger.targetTabs,
      });

      nextShownTriggers.add(autoTrigger.id);
      window.localStorage.setItem(
        getAssistantShownTriggersStorageKey(assistantContext.user.id),
        serializeShownAssistantTriggers(nextShownTriggers),
      );
      window.localStorage.setItem(
        getAssistantLastSeenStorageKey(assistantContext.user.id),
        new Date().toISOString(),
      );

      setIsOpen(true);
      setMessages((currentMessages) => [...currentMessages, botMessage]);
      setPersistentContext((currentContext) =>
        appendConversationMessages(currentContext, [
          { role: "bot", text: botMessage.text },
        ]),
      );
      setAgentMetrics((currentMetrics) => ({
        ...addAgentSessionDuration(
          currentMetrics,
          getSessionDurationDelta(),
        ),
        totalMessages: currentMetrics.totalMessages + 1,
      }));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    assistantContext,
    assistantContext.user.id,
    messages.length,
    persistentContext.messagesCount,
  ]);

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

      const botMessage = createBotMessage(botReply.text, {
        targetHref: botReply.targetHref,
        targetLabel: botReply.targetLabel,
        targetTab: botReply.targetTab,
        targetTabs: botReply.targetTabs,
      });

      setIsOpen(true);
      setConversationFlow(null);
      setMessages((currentMessages) => [...currentMessages, botMessage]);
      setPersistentContext((currentContext) =>
        appendConversationMessages(currentContext, [
          { role: "bot", text: botMessage.text },
        ]),
      );
      setAgentMetrics((currentMetrics) => ({
        ...addAgentSessionDuration(
          currentMetrics,
          getSessionDurationDelta(),
        ),
        totalMessages: currentMetrics.totalMessages + 1,
      }));
    }

    window.addEventListener(APP_HELP_CONTEXT_EVENT, handleContextHelp);

    return () => {
      window.removeEventListener(APP_HELP_CONTEXT_EVENT, handleContextHelp);
    };
  }, []);

  async function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isLoading) {
      return;
    }

    const userMessage = createUserMessage(trimmedPrompt);
    const normalizedPrompt = normalizeText(trimmedPrompt);
    const detectedIntent = detectAssistantIntent(trimmedPrompt);
    const flowReply = conversationFlow
      ? buildConversationStepReply(
          trimmedPrompt,
          conversationFlow,
          assistantContext,
        )
      : null;
    const followUpReply = conversationFlow
      ? null
      : buildFollowUpReply(conversationTopic, normalizedPrompt);
    const shouldStartOnboardingFlow = shouldStartOnboarding(normalizedPrompt);
    const shouldStartPriceCalculationFlow =
      shouldStartPriceCalculation(normalizedPrompt);
    const shouldStartPriceDoubtFlow = shouldStartPriceDoubt(normalizedPrompt);
    const shouldStartOptimizationFlow =
      shouldStartOptimization(normalizedPrompt);
    const metricsReply = isAgentMetricsQuestion(normalizedPrompt)
      ? ({
          text: formatAgentMetricsDashboard(calculateAgentMetrics(agentMetrics)),
          targetTab: "dashboard" as const,
        } satisfies BotReply)
      : null;
    const localBotReply: BotReply =
      flowReply?.reply ??
      followUpReply ??
      metricsReply ??
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
    const shouldUseGemini =
      !flowReply &&
      !followUpReply &&
      !metricsReply &&
      !shouldStartOnboardingFlow &&
      !shouldStartPriceCalculationFlow &&
      !shouldStartPriceDoubtFlow &&
      !shouldStartOptimizationFlow;

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    let geminiBotReply: BotReply | null = null;

    try {
      geminiBotReply = shouldUseGemini
        ? await requestGeminiAssistantReply({
            activeTab,
            assistantContext,
            conversationHistory: persistentContext.conversationHistory,
            message: trimmedPrompt,
          })
        : null;
    } catch {
      geminiBotReply = null;
    }

    const botReply = geminiBotReply ?? localBotReply;
    const botMessage = createBotMessage(botReply.text, {
      targetHref: botReply.targetHref,
      targetLabel: botReply.targetLabel,
      targetTab: botReply.targetTab,
      targetTabs: botReply.targetTabs,
    });

    setMessages((currentMessages) => [...currentMessages, botMessage]);
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
    setConversationTopic(getTopicFromReply(normalizedPrompt, botReply));
    setPersistentContext((currentContext) => {
      const nextContext = appendConversationMessages(currentContext, [
        { role: "user", text: userMessage.text },
        { role: "bot", text: botMessage.text },
      ]);

      if (
        flowReply?.nextFlowState?.type === "price-calculation" &&
        flowReply.nextFlowState.productName
      ) {
        nextContext.lastProductCreated = flowReply.nextFlowState.productName;
      }

      if (
        detectedIntent === "HELP_TROUBLESHOOT" ||
        shouldStartPriceDoubtFlow
      ) {
        nextContext.lastProblem = trimmedPrompt;
      }

      if (detectedIntent === "HELP_SUGGEST_PRICE") {
        nextContext.suggestedMargin = 50;
      }

      return nextContext;
    });
    setAgentMetrics((currentMetrics) => ({
      ...addAgentSessionDuration(
        currentMetrics,
        getSessionDurationDelta(),
      ),
      totalMessages: currentMetrics.totalMessages + 2,
      problemsSolved:
        detectedIntent === "HELP_TROUBLESHOOT" || shouldStartPriceDoubtFlow
          ? currentMetrics.problemsSolved + 1
          : currentMetrics.problemsSolved,
      priceOptimizationAttempts:
        detectedIntent === "HELP_OPTIMIZE_PRICE" || shouldStartOptimizationFlow
          ? currentMetrics.priceOptimizationAttempts + 1
          : currentMetrics.priceOptimizationAttempts,
    }));
    setIsLoading(false);
  }

  function goToTab(tab: ActiveTab) {
    router.push(getPathForActiveTab(tab));
  }

  function rateAssistantHelpfulness(isHelpful: boolean) {
    setAgentMetrics((currentMetrics) => ({
      ...currentMetrics,
      helpfulnessPositive: isHelpful
        ? currentMetrics.helpfulnessPositive + 1
        : currentMetrics.helpfulnessPositive,
      helpfulnessNegative: isHelpful
        ? currentMetrics.helpfulnessNegative
        : currentMetrics.helpfulnessNegative + 1,
    }));
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
                      if (message.targetHref === "/premium") {
                        setAgentMetrics((currentMetrics) => ({
                          ...currentMetrics,
                          trialSignupsFromAgent:
                            currentMetrics.trialSignupsFromAgent + 1,
                        }));
                      }

                      router.push(message.targetHref as string);
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

                {message.role === "bot" && message.id !== "bot-initial" && (
                  <div className="mt-2 flex items-center gap-1.5 border-t border-amber-100 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Foi útil?
                    </span>
                    <button
                      type="button"
                      onClick={() => rateAssistantHelpfulness(true)}
                      className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-green-700 ring-1 ring-green-100 transition-colors hover:bg-green-50"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => rateAssistantHelpfulness(false)}
                      className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-sm text-slate-600">
                Pensando com seus dados...
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((quickAction) => (
                <button
                  key={quickAction.id}
                  type="button"
                  onClick={() => submitPrompt(quickAction.prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={isLoading}
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-black outline-none transition-colors focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
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
