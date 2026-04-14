export type ActiveTab = "calculator" | "inventory" | "sales" | "dashboard";

export function resolveActiveTabFromParam(
  tab: string | string[] | null | undefined,
): ActiveTab {
  const normalizedTab = Array.isArray(tab) ? tab[0] : tab;

  switch (normalizedTab) {
    case "estoque":
      return "inventory";
    case "vendas":
      return "sales";
    case "dashboard":
      return "dashboard";
    default:
      return "inventory";
  }
}

export function getPathForActiveTab(activeTab: ActiveTab) {
  switch (activeTab) {
    case "inventory":
      return "/estoque";
    case "sales":
      return "/vendas";
    case "dashboard":
      return "/dashboard";
    default:
      return "/ficha-tecnica";
  }
}
