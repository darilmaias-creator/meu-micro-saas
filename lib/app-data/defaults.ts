export type GenericRecord = Record<string, unknown>;

export const DEFAULT_STORE_NAME = "Calculadora do Produtor";
export const DEFAULT_STORE_SUBTITLE =
  "Orçamentos claros. Clientes seguros. Negócios fechados.";
export const DEFAULT_STORE_LOGO =
  "https://i.postimg.cc/ZqQzNQRW/calculadoradoprodutor.png";
export const LEGACY_STORE_NAME = "ATELIÊ";
export const LEGACY_STORE_SUBTITLE = "Artesanato e Produtos";
export const LEGACY_STORE_LOGO = "https://i.postimg.cc/hj2J824X/logo.png";

export type AppConfigState = {
  unit: string;
  machineCost: string;
  diodeLife: string;
  energyCost: string;
  machinePower: string;
  hourlyRate: string;
  profitMargin: string;
  userLogo: string;
  storeName: string;
  storeSubtitle: string;
};

export type AppDataState = {
  config: AppConfigState;
  insumos: GenericRecord[];
  savedProducts: GenericRecord[];
  sales: GenericRecord[];
  quotes: GenericRecord[];
};

export type AppDataResponse = {
  data: AppDataState;
  source: "database" | "default";
  updatedAt: string | null;
};

export function createDefaultAppDataState(): AppDataState {
  return {
    config: {
      unit: "mm",
      machineCost: "",
      diodeLife: "",
      energyCost: "",
      machinePower: "96",
      hourlyRate: "",
      profitMargin: "50",
      userLogo: DEFAULT_STORE_LOGO,
      storeName: DEFAULT_STORE_NAME,
      storeSubtitle: DEFAULT_STORE_SUBTITLE,
    },
    insumos: [],
    savedProducts: [],
    sales: [],
    quotes: [],
  };
}

export function normalizeBrandingValue(storageKey: string, storedValue: string) {
  if (storageKey.endsWith("calc_storeName") && storedValue === LEGACY_STORE_NAME) {
    return DEFAULT_STORE_NAME;
  }

  if (
    storageKey.endsWith("calc_storeSubtitle") &&
    storedValue === LEGACY_STORE_SUBTITLE
  ) {
    return DEFAULT_STORE_SUBTITLE;
  }

  if (storageKey.endsWith("calc_userLogo") && storedValue === LEGACY_STORE_LOGO) {
    return DEFAULT_STORE_LOGO;
  }

  return storedValue;
}

export function normalizeAppDataState(
  input: Partial<AppDataState> | null | undefined,
): AppDataState {
  const defaults = createDefaultAppDataState();

  return {
    config: {
      ...defaults.config,
      ...(input?.config ?? {}),
      storeName: normalizeBrandingValue(
        "calc_storeName",
        typeof input?.config?.storeName === "string"
          ? input.config.storeName
          : defaults.config.storeName,
      ),
      storeSubtitle: normalizeBrandingValue(
        "calc_storeSubtitle",
        typeof input?.config?.storeSubtitle === "string"
          ? input.config.storeSubtitle
          : defaults.config.storeSubtitle,
      ),
    },
    insumos: Array.isArray(input?.insumos) ? input.insumos : defaults.insumos,
    savedProducts: Array.isArray(input?.savedProducts)
      ? input.savedProducts
      : defaults.savedProducts,
    sales: Array.isArray(input?.sales) ? input.sales : defaults.sales,
    quotes: Array.isArray(input?.quotes) ? input.quotes : defaults.quotes,
  };
}

export function hasMeaningfulAppData(state: AppDataState) {
  const defaults = createDefaultAppDataState();

  return (
    state.insumos.length > 0 ||
    state.savedProducts.length > 0 ||
    state.sales.length > 0 ||
    state.quotes.length > 0 ||
    JSON.stringify(state.config) !== JSON.stringify(defaults.config)
  );
}
