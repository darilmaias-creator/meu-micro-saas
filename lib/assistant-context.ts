import type { Session } from "next-auth";

import type { AppDataState, GenericRecord } from "@/lib/app-data/defaults";

export const ASSISTANT_SYSTEM_PROMPT = `
Você é um assistente de IA especializado em precificação para artesãos.
Seu objetivo é ajudar o usuário a:
1. Entender como usar a calculadora de preços
2. Calcular o preço certo para seus produtos
3. Otimizar sua margem de lucro
4. Evitar erros comuns de precificação

Você tem acesso aos dados do usuário (insumos, produtos, vendas).
Use esses dados para dar recomendações personalizadas.

Sempre:
- Seja amigável e encorajador
- Use exemplos práticos
- Explique conceitos de forma simples
- Ofereça dicas acionáveis
- Pergunte para entender melhor

Nunca:
- Dê conselhos financeiros complexos
- Acesse dados de outros usuários
- Prometa resultados garantidos
- Recomende preços específicos como certeza (apenas sugestões)
`.trim();

export type AssistantContext = {
  appData: {
    insumos: Array<{
      id: string;
      name: string;
      cost: number | null;
      measure: string | null;
    }>;
    quotes: Array<{
      id: string;
      clientName: string | null;
      status: string | null;
      total: number | null;
    }>;
    sales: Array<{
      id: string;
      cost: number | null;
      profit: number | null;
      productName: string | null;
      value: number | null;
    }>;
    savedProducts: Array<{
      id: string;
      cost: number | null;
      margin: number | null;
      name: string;
      suggestedPrice: number | null;
    }>;
  };
  systemPrompt: string;
  user: {
    id: string;
    isPremium: boolean;
    name: string | null;
    sector: string | null;
  };
};

function toStringId(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function toNullableNumber(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", "."))
        : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProductMargin(product: GenericRecord) {
  const storedMargin =
    toNullableNumber(product.margem) ??
    toNullableNumber(product.margin) ??
    toNullableNumber(product.profitMargin);

  if (storedMargin !== null) {
    return storedMargin;
  }

  const price =
    toNullableNumber(product.precoSugerido) ??
    toNullableNumber(product.suggestedPrice) ??
    toNullableNumber(product.activePrice);
  const cost =
    toNullableNumber(product.custo) ??
    toNullableNumber(product.cost) ??
    toNullableNumber(product.totalCost);

  if (!price || !cost || price <= 0) {
    return null;
  }

  return ((price - cost) / price) * 100;
}

export function buildAssistantContext(
  session: Session,
  appData: AppDataState,
): AssistantContext {
  return {
    appData: {
      insumos: appData.insumos.slice(0, 20).map((insumo) => ({
        id: toStringId(insumo.id),
        name: toNullableString(insumo.name) ?? "Insumo sem nome",
        cost:
          toNullableNumber(insumo.custo) ??
          toNullableNumber(insumo.cost) ??
          toNullableNumber(insumo.costPerUnit) ??
          toNullableNumber(insumo.costPerItem),
        measure:
          toNullableString(insumo.medida) ??
          toNullableString(insumo.measure) ??
          toNullableString(insumo.unit) ??
          toNullableString(insumo.type),
      })),
      savedProducts: appData.savedProducts.slice(0, 20).map((product) => ({
        id: toStringId(product.id),
        name: toNullableString(product.name) ?? "Produto sem nome",
        cost:
          toNullableNumber(product.custo) ??
          toNullableNumber(product.cost) ??
          toNullableNumber(product.totalCost),
        suggestedPrice:
          toNullableNumber(product.precoSugerido) ??
          toNullableNumber(product.suggestedPrice) ??
          toNullableNumber(product.activePrice),
        margin: getProductMargin(product),
      })),
      quotes: appData.quotes.slice(0, 20).map((quote) => ({
        id: toStringId(quote.id),
        clientName: toNullableString(quote.clientName),
        total:
          toNullableNumber(quote.total) ??
          toNullableNumber(quote.grossSale) ??
          toNullableNumber(quote.activePrice),
        status: toNullableString(quote.status),
      })),
      sales: appData.sales.slice(0, 20).map((sale) => ({
        id: toStringId(sale.id),
        productName:
          toNullableString(sale.produto) ??
          toNullableString(sale.productName) ??
          toNullableString(sale.name),
        value:
          toNullableNumber(sale.valor) ??
          toNullableNumber(sale.value) ??
          toNullableNumber(sale.grossSale) ??
          toNullableNumber(sale.activePrice),
        cost:
          toNullableNumber(sale.custo) ??
          toNullableNumber(sale.cost) ??
          toNullableNumber(sale.totalCost),
        profit:
          toNullableNumber(sale.lucro) ??
          toNullableNumber(sale.profit) ??
          toNullableNumber(sale.activeProfitValue),
      })),
    },
    systemPrompt: ASSISTANT_SYSTEM_PROMPT,
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      sector: null,
      isPremium: Boolean(session.user.isPremium),
    },
  };
}
