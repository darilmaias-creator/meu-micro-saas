export type PremiumOfferTier = "founder" | "standard";

export const PREMIUM_FOUNDER_LIMIT = 200;
export const PREMIUM_STANDARD_PRICE_BRL = 1990;
export const PREMIUM_FOUNDER_PRICE_BRL = 990;

export function formatBrlPriceFromCents(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function getPremiumTierLabel(tier: PremiumOfferTier) {
  return tier === "founder" ? "Lançamento" : "Normal";
}

