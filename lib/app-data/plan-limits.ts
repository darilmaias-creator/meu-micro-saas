import {
  PREMIUM_OPERATION_COST_CONFIG_KEYS,
  QUOTE_DOCUMENT_CONFIG_KEYS,
  createDefaultAppDataState,
  type AppDataState,
} from "@/lib/app-data/defaults";

export const FREE_TIER_INSUMO_LIMIT = 20;
export const FREE_TIER_PRODUCT_LIMIT = 10;

type PlanLimitViolation =
  | {
      code: "FREE_INSUMO_LIMIT";
      message: string;
    }
  | {
      code: "FREE_PRODUCT_LIMIT";
      message: string;
    }
  | {
      code: "FREE_BRANDING_LOCKED";
      message: string;
    }
  | {
      code: "FREE_QUOTE_SETTINGS_LOCKED";
      message: string;
    }
  | {
      code: "FREE_OPERATION_COST_ADVANCED_LOCKED";
      message: string;
    };

function getAllowedCollectionSize(limit: number, currentSize: number) {
  return Math.max(limit, currentSize);
}

export function validateAppDataPlanLimits(input: {
  currentState: AppDataState;
  isPremium: boolean;
  nextState: AppDataState;
}): PlanLimitViolation | null {
  if (input.isPremium) {
    return null;
  }

  const allowedInsumos = getAllowedCollectionSize(
    FREE_TIER_INSUMO_LIMIT,
    input.currentState.insumos.length,
  );

  if (input.nextState.insumos.length > allowedInsumos) {
    return {
      code: "FREE_INSUMO_LIMIT",
      message:
        "Seu plano grátis permite manter até 20 insumos no estoque. Assine o Premium para liberar itens ilimitados.",
    };
  }

  const allowedProducts = getAllowedCollectionSize(
    FREE_TIER_PRODUCT_LIMIT,
    input.currentState.savedProducts.length,
  );

  if (input.nextState.savedProducts.length > allowedProducts) {
    return {
      code: "FREE_PRODUCT_LIMIT",
      message:
        "Seu plano grátis permite manter até 10 produtos salvos. Assine o Premium para liberar produtos ilimitados.",
    };
  }

  const defaultState = createDefaultAppDataState();
  const brandingKeys: Array<
    keyof Pick<
      AppDataState["config"],
      "storeName" | "storeSubtitle" | "userLogo"
    >
  > = ["storeName", "storeSubtitle", "userLogo"];

  for (const brandingKey of brandingKeys) {
    const currentValue = input.currentState.config[brandingKey];
    const nextValue = input.nextState.config[brandingKey];
    const defaultValue = defaultState.config[brandingKey];

    if (nextValue === currentValue || nextValue === defaultValue) {
      continue;
    }

    return {
      code: "FREE_BRANDING_LOCKED",
      message:
        "Personalização da marca nos documentos é exclusiva do plano Premium. No plano grátis, você pode manter o que já tinha salvo ou voltar ao padrão.",
    };
  }

  for (const quoteConfigKey of QUOTE_DOCUMENT_CONFIG_KEYS) {
    const currentValue = input.currentState.config[quoteConfigKey];
    const nextValue = input.nextState.config[quoteConfigKey];
    const defaultValue = defaultState.config[quoteConfigKey];

    if (nextValue === currentValue || nextValue === defaultValue) {
      continue;
    }

    return {
      code: "FREE_QUOTE_SETTINGS_LOCKED",
      message:
        "As configurações do orçamento com textos e contatos personalizados são exclusivas do plano Premium. No plano grátis, o app usa os textos padrão sem apagar o que você já deixou salvo.",
    };
  }

  for (const premiumOperationCostKey of PREMIUM_OPERATION_COST_CONFIG_KEYS) {
    const currentValue = input.currentState.config[premiumOperationCostKey];
    const nextValue = input.nextState.config[premiumOperationCostKey];
    const defaultValue = defaultState.config[premiumOperationCostKey];

    if (
      JSON.stringify(nextValue) === JSON.stringify(currentValue) ||
      JSON.stringify(nextValue) === JSON.stringify(defaultValue)
    ) {
      continue;
    }

    return {
      code: "FREE_OPERATION_COST_ADVANCED_LOCKED",
      message:
        "Os recursos avançados de custos operacionais ficam no Premium. No plano grátis, você usa os custos básicos e o rateio simples por unidade sem perder o que já deixou salvo.",
    };
  }

  return null;
}
