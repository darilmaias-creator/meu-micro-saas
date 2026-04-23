export type GenericRecord = Record<string, unknown>;

export const DEFAULT_STORE_NAME = "Calculadora do Produtor";
export const DEFAULT_STORE_SUBTITLE =
  "Orçamentos claros. Clientes seguros. Negócios fechados.";
export const DEFAULT_STORE_LOGO =
  "https://i.postimg.cc/52qj8Q2P/logo.png";
export const DEFAULT_QUOTE_VALIDITY_DAYS = "15";
export const DEFAULT_QUOTE_LEAD_TIME_TEXT =
  "O prazo pode variar conforme quantidade e personalização.";
export const DEFAULT_QUOTE_DELIVERY_TEXT =
  "Entrega e frete combinados na confirmação do pedido.";
export const DEFAULT_QUOTE_PAYMENT_TEXT =
  "Forma de pagamento combinada na confirmação do pedido.";
export const DEFAULT_QUOTE_ADVANCE_TEXT =
  "O início da produção ocorre mediante confirmação e pagamento de 50%.";
export const DEFAULT_QUOTE_APPROVAL_TEXT =
  "A produção começa após a confirmação do cliente.";
export const DEFAULT_QUOTE_NOTES_TEXT = "";
export const DEFAULT_BUSINESS_INSTAGRAM = "";
export const DEFAULT_BUSINESS_WHATSAPP = "";
export const LEGACY_STORE_NAME = "ATELIÊ";
export const LEGACY_STORE_SUBTITLE = "Artesanato e Produtos";
export const LEGACY_STORE_LOGOS = [
  "https://i.postimg.cc/hj2J824X/logo.png",
  "https://i.postimg.cc/ZqQzNQRW/calculadoradoprodutor.png",
];

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
  quoteValidityDays: string;
  quoteLeadTimeText: string;
  quoteDeliveryText: string;
  quotePaymentText: string;
  quoteAdvanceText: string;
  quoteApprovalText: string;
  quoteNotesText: string;
  businessInstagram: string;
  businessWhatsapp: string;
};

export type QuoteDocumentConfig = Pick<
  AppConfigState,
  | "quoteValidityDays"
  | "quoteLeadTimeText"
  | "quoteDeliveryText"
  | "quotePaymentText"
  | "quoteAdvanceText"
  | "quoteApprovalText"
  | "quoteNotesText"
  | "businessInstagram"
  | "businessWhatsapp"
>;

export const QUOTE_DOCUMENT_CONFIG_KEYS: Array<keyof QuoteDocumentConfig> = [
  "quoteValidityDays",
  "quoteLeadTimeText",
  "quoteDeliveryText",
  "quotePaymentText",
  "quoteAdvanceText",
  "quoteApprovalText",
  "quoteNotesText",
  "businessInstagram",
  "businessWhatsapp",
];

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
      quoteValidityDays: DEFAULT_QUOTE_VALIDITY_DAYS,
      quoteLeadTimeText: DEFAULT_QUOTE_LEAD_TIME_TEXT,
      quoteDeliveryText: DEFAULT_QUOTE_DELIVERY_TEXT,
      quotePaymentText: DEFAULT_QUOTE_PAYMENT_TEXT,
      quoteAdvanceText: DEFAULT_QUOTE_ADVANCE_TEXT,
      quoteApprovalText: DEFAULT_QUOTE_APPROVAL_TEXT,
      quoteNotesText: DEFAULT_QUOTE_NOTES_TEXT,
      businessInstagram: DEFAULT_BUSINESS_INSTAGRAM,
      businessWhatsapp: DEFAULT_BUSINESS_WHATSAPP,
    },
    insumos: [],
    savedProducts: [],
    sales: [],
    quotes: [],
  };
}

export function createDefaultQuoteDocumentConfig(): QuoteDocumentConfig {
  const defaultConfig = createDefaultAppDataState().config;

  return {
    quoteValidityDays: defaultConfig.quoteValidityDays,
    quoteLeadTimeText: defaultConfig.quoteLeadTimeText,
    quoteDeliveryText: defaultConfig.quoteDeliveryText,
    quotePaymentText: defaultConfig.quotePaymentText,
    quoteAdvanceText: defaultConfig.quoteAdvanceText,
    quoteApprovalText: defaultConfig.quoteApprovalText,
    quoteNotesText: defaultConfig.quoteNotesText,
    businessInstagram: defaultConfig.businessInstagram,
    businessWhatsapp: defaultConfig.businessWhatsapp,
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

  if (
    storageKey.endsWith("calc_userLogo") &&
    LEGACY_STORE_LOGOS.includes(storedValue)
  ) {
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
      userLogo: normalizeBrandingValue(
        "calc_userLogo",
        typeof input?.config?.userLogo === "string"
          ? input.config.userLogo
          : defaults.config.userLogo,
      ),
      quoteValidityDays:
        typeof input?.config?.quoteValidityDays === "string"
          ? input.config.quoteValidityDays
          : defaults.config.quoteValidityDays,
      quoteLeadTimeText:
        typeof input?.config?.quoteLeadTimeText === "string"
          ? input.config.quoteLeadTimeText
          : defaults.config.quoteLeadTimeText,
      quoteDeliveryText:
        typeof input?.config?.quoteDeliveryText === "string"
          ? input.config.quoteDeliveryText
          : defaults.config.quoteDeliveryText,
      quotePaymentText:
        typeof input?.config?.quotePaymentText === "string"
          ? input.config.quotePaymentText
          : defaults.config.quotePaymentText,
      quoteAdvanceText:
        typeof input?.config?.quoteAdvanceText === "string"
          ? input.config.quoteAdvanceText
          : defaults.config.quoteAdvanceText,
      quoteApprovalText:
        typeof input?.config?.quoteApprovalText === "string"
          ? input.config.quoteApprovalText
          : defaults.config.quoteApprovalText,
      quoteNotesText:
        typeof input?.config?.quoteNotesText === "string"
          ? input.config.quoteNotesText
          : defaults.config.quoteNotesText,
      businessInstagram:
        typeof input?.config?.businessInstagram === "string"
          ? input.config.businessInstagram
          : defaults.config.businessInstagram,
      businessWhatsapp:
        typeof input?.config?.businessWhatsapp === "string"
          ? input.config.businessWhatsapp
          : defaults.config.businessWhatsapp,
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

function normalizeQuoteValidityDays(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return fallback;
  }

  return String(Math.max(1, Number(digitsOnly)));
}

function normalizeOptionalText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

export function resolveQuoteDocumentConfig(
  config: AppConfigState,
  isPremium: boolean,
): QuoteDocumentConfig {
  const defaults = createDefaultQuoteDocumentConfig();

  if (!isPremium) {
    return defaults;
  }

  return {
    quoteValidityDays: normalizeQuoteValidityDays(
      config.quoteValidityDays,
      defaults.quoteValidityDays,
    ),
    quoteLeadTimeText: normalizeOptionalText(
      config.quoteLeadTimeText,
      defaults.quoteLeadTimeText,
    ),
    quoteDeliveryText: normalizeOptionalText(
      config.quoteDeliveryText,
      defaults.quoteDeliveryText,
    ),
    quotePaymentText: normalizeOptionalText(
      config.quotePaymentText,
      defaults.quotePaymentText,
    ),
    quoteAdvanceText: normalizeOptionalText(
      config.quoteAdvanceText,
      defaults.quoteAdvanceText,
    ),
    quoteApprovalText: normalizeOptionalText(
      config.quoteApprovalText,
      defaults.quoteApprovalText,
    ),
    quoteNotesText: normalizeOptionalText(
      config.quoteNotesText,
      defaults.quoteNotesText,
    ),
    businessInstagram: normalizeOptionalText(
      config.businessInstagram,
      defaults.businessInstagram,
    ),
    businessWhatsapp: normalizeOptionalText(
      config.businessWhatsapp,
      defaults.businessWhatsapp,
    ),
  };
}
