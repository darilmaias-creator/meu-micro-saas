import {
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
        "Seu plano gratis permite manter ate 20 insumos no estoque. Assine o Premium para liberar itens ilimitados.",
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
        "Seu plano gratis permite manter ate 10 produtos salvos. Assine o Premium para liberar produtos ilimitados.",
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
        "Personalizacao da marca nos documentos e exclusiva do plano Premium. No plano gratis, voce pode manter o que ja tinha salvo ou voltar ao padrao.",
    };
  }

  return null;
}
