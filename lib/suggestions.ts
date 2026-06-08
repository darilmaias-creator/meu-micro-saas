import type { ActiveTab } from "@/lib/app-tabs";

export const SUGGESTION_MAX_LENGTH = 1000;

export const SUGGESTION_CATEGORIES = [
  "ideia",
  "erro",
  "duvida",
  "melhoria",
] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export type SuggestionStatus =
  | "new"
  | "reviewing"
  | "planned"
  | "resolved"
  | "archived";

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  duvida: "Duvida",
  erro: "Erro",
  ideia: "Ideia",
  melhoria: "Melhoria",
};

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  archived: "Arquivada",
  new: "Nova",
  planned: "Planejada",
  resolved: "Resolvida",
  reviewing: "Em analise",
};

export function isSuggestionCategory(
  value: unknown,
): value is SuggestionCategory {
  return (
    typeof value === "string" &&
    SUGGESTION_CATEGORIES.includes(value as SuggestionCategory)
  );
}

export function isValidSuggestionTab(value: unknown): value is ActiveTab {
  return (
    value === "calculator" ||
    value === "dashboard" ||
    value === "inventory" ||
    value === "operationCosts" ||
    value === "sales"
  );
}
