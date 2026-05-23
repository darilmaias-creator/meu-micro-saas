export const INTENTS = {
  HELP_GETTING_STARTED: {
    patterns: [
      "como funciona",
      "por onde começo",
      "por onde comeco",
      "me ajuda",
      "não entendo",
      "nao entendo",
      "primeira vez",
      "novo aqui",
    ],
    response: "help_getting_started",
  },
  HELP_ADD_MATERIALS: {
    patterns: [
      "como adiciono",
      "material",
      "insumo",
      "custo do material",
      "medida",
    ],
    response: "help_add_materials",
  },
  HELP_CALCULATE_COST: {
    patterns: [
      "custo",
      "calcular",
      "mão de obra",
      "mao de obra",
      "tempo",
      "quanto custa",
    ],
    response: "help_calculate_cost",
  },
  HELP_SUGGEST_PRICE: {
    patterns: [
      "preço",
      "preco",
      "quanto cobrar",
      "margem",
      "lucro",
      "precificação",
      "precificacao",
    ],
    response: "help_suggest_price",
  },
  HELP_TROUBLESHOOT: {
    patterns: [
      "erro",
      "problema",
      "não funciona",
      "nao funciona",
      "errado",
      "bug",
    ],
    response: "help_troubleshoot",
  },
  HELP_PREMIUM_FEATURES: {
    patterns: ["premium", "assinar", "trial", "teste premium", "plano"],
    response: "help_premium_features",
  },
  HELP_BEST_PRACTICES: {
    patterns: ["dica", "boas práticas", "boas praticas", "melhor forma"],
    response: "help_best_practices",
  },
  HELP_OPTIMIZE_PRICE: {
    patterns: [
      "otimizar",
      "ganhar mais",
      "aumentar lucro",
      "melhorar margem",
      "vendendo muito barato",
      "muito barato",
      "preço baixo",
      "preco baixo",
      "perder dinheiro",
      "preço mínimo",
      "preco minimo",
    ],
    response: "help_optimize_price",
  },
} as const;

export type AssistantIntent = keyof typeof INTENTS;
export type AssistantIntentResponse =
  (typeof INTENTS)[AssistantIntent]["response"];

function normalizeIntentText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesAssistantIntent(
  normalizedText: string,
  intent: AssistantIntent,
) {
  return INTENTS[intent].patterns.some((pattern) =>
    normalizedText.includes(normalizeIntentText(pattern)),
  );
}

export function detectAssistantIntent(
  value: string,
): AssistantIntent | null {
  const normalizedText = normalizeIntentText(value);
  const intentKeys = Object.keys(INTENTS) as AssistantIntent[];

  return (
    intentKeys.find((intent) => matchesAssistantIntent(normalizedText, intent)) ??
    null
  );
}
