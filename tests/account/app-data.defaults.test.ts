import { describe, expect, it } from "vitest";

import {
  DEFAULT_MONTHLY_PRODUCTION_TARGET,
  DEFAULT_OPERATION_COST_MARKUP,
  DEFAULT_PRODUCTIVE_HOURS_PER_MONTH,
  DEFAULT_QUOTE_ADVANCE_TEXT,
  DEFAULT_QUOTE_APPROVAL_TEXT,
  DEFAULT_QUOTE_DELIVERY_TEXT,
  DEFAULT_QUOTE_LEAD_TIME_TEXT,
  DEFAULT_QUOTE_PAYMENT_TEXT,
  DEFAULT_QUOTE_VALIDITY_DAYS,
  createDefaultAppDataState,
  normalizeAppDataState,
  resolveQuoteDocumentConfig,
} from "@/lib/app-data/defaults";
import { resolveOperationCostConfig } from "@/lib/app-data/operation-costs";

describe("app data defaults", () => {
  it("fills the new quote settings with defaults during normalization", () => {
    const defaultConfig = createDefaultAppDataState().config;
    const state = normalizeAppDataState({
      config: {
        ...defaultConfig,
        storeName: "Minha Loja",
      },
    });

    expect(state.config.quoteValidityDays).toBe(DEFAULT_QUOTE_VALIDITY_DAYS);
    expect(state.config.quoteLeadTimeText).toBe(DEFAULT_QUOTE_LEAD_TIME_TEXT);
    expect(state.config.quoteDeliveryText).toBe(DEFAULT_QUOTE_DELIVERY_TEXT);
    expect(state.config.quotePaymentText).toBe(DEFAULT_QUOTE_PAYMENT_TEXT);
    expect(state.config.quoteAdvanceText).toBe(DEFAULT_QUOTE_ADVANCE_TEXT);
    expect(state.config.quoteApprovalText).toBe(DEFAULT_QUOTE_APPROVAL_TEXT);
    expect(state.config.quoteNotesText).toBe("");
    expect(state.config.businessInstagram).toBe("");
    expect(state.config.businessWhatsapp).toBe("");
    expect(state.config.fixedCostRent).toBe("");
    expect(state.config.fixedCostWater).toBe("");
    expect(state.config.fixedCostElectricity).toBe("");
    expect(state.config.fixedCostInternet).toBe("");
    expect(state.config.variableCostPackaging).toBe("");
    expect(state.config.variableCostTransport).toBe("");
    expect(state.config.variableCostFees).toBe("");
    expect(state.config.monthlyProductionTarget).toBe(
      DEFAULT_MONTHLY_PRODUCTION_TARGET,
    );
    expect(state.config.productiveHoursPerMonth).toBe(
      DEFAULT_PRODUCTIVE_HOURS_PER_MONTH,
    );
    expect(state.config.operationCostMode).toBe("per_unit");
    expect(state.config.operationCostMarkup).toBe(DEFAULT_OPERATION_COST_MARKUP);
    expect(state.config.customOperationCosts).toEqual([]);
  });

  it("keeps premium custom quote settings when resolving the document config", () => {
    const defaultConfig = createDefaultAppDataState().config;
    const state = normalizeAppDataState({
      config: {
        ...defaultConfig,
        quoteValidityDays: "7",
        quoteLeadTimeText: "Prazo confirmado após análise.",
        quoteDeliveryText: "Retirada no ateliê.",
        quotePaymentText: "Pix ou cartão.",
        quoteAdvanceText: "Entrada de 30% para iniciar.",
        quoteApprovalText: "Produção após aprovação da arte.",
        quoteNotesText: "Frete não incluso.",
        businessInstagram: "@nobretalhe",
        businessWhatsapp: "(67) 99999-0000",
      },
    });

    const resolvedConfig = resolveQuoteDocumentConfig(state.config, true);

    expect(resolvedConfig).toMatchObject({
      quoteValidityDays: "7",
      quoteLeadTimeText: "Prazo confirmado após análise.",
      quoteDeliveryText: "Retirada no ateliê.",
      quotePaymentText: "Pix ou cartão.",
      quoteAdvanceText: "Entrada de 30% para iniciar.",
      quoteApprovalText: "Produção após aprovação da arte.",
      quoteNotesText: "Frete não incluso.",
      businessInstagram: "@nobretalhe",
      businessWhatsapp: "(67) 99999-0000",
    });
  });

  it("falls back to the standard quote text on the free plan without removing saved premium values", () => {
    const defaultConfig = createDefaultAppDataState().config;
    const state = normalizeAppDataState({
      config: {
        ...defaultConfig,
        quoteValidityDays: "7",
        quoteLeadTimeText: "Prazo confirmado após análise.",
        quoteDeliveryText: "Retirada no ateliê.",
        quotePaymentText: "Pix ou cartão.",
        quoteAdvanceText: "Entrada de 30% para iniciar.",
        quoteApprovalText: "Produção após aprovação da arte.",
        quoteNotesText: "Frete não incluso.",
        businessInstagram: "@nobretalhe",
        businessWhatsapp: "(67) 99999-0000",
      },
    });

    const resolvedConfig = resolveQuoteDocumentConfig(state.config, false);

    expect(resolvedConfig).toMatchObject({
      quoteValidityDays: DEFAULT_QUOTE_VALIDITY_DAYS,
      quoteLeadTimeText: DEFAULT_QUOTE_LEAD_TIME_TEXT,
      quoteDeliveryText: DEFAULT_QUOTE_DELIVERY_TEXT,
      quotePaymentText: DEFAULT_QUOTE_PAYMENT_TEXT,
      quoteAdvanceText: DEFAULT_QUOTE_ADVANCE_TEXT,
      quoteApprovalText: DEFAULT_QUOTE_APPROVAL_TEXT,
      quoteNotesText: "",
      businessInstagram: "",
      businessWhatsapp: "",
    });
    expect(state.config.quoteLeadTimeText).toBe("Prazo confirmado após análise.");
    expect(state.config.businessInstagram).toBe("@nobretalhe");
  });

  it("normalizes and preserves the new operation cost settings", () => {
    const defaultConfig = createDefaultAppDataState().config;
    const state = normalizeAppDataState({
      config: {
        ...defaultConfig,
        fixedCostRent: "850",
        variableCostPackaging: "120",
        monthlyProductionTarget: "50",
        productiveHoursPerMonth: "90",
        operationCostMode: "per_hour",
        operationCostMarkup: "8",
        customOperationCosts: [
          { id: "custom-1", name: "Contador", amount: "150", kind: "fixed" },
          { id: "custom-2", name: "", amount: "15", kind: "variable" },
        ],
      },
    });

    expect(state.config.fixedCostRent).toBe("850");
    expect(state.config.variableCostPackaging).toBe("120");
    expect(state.config.monthlyProductionTarget).toBe("50");
    expect(state.config.productiveHoursPerMonth).toBe("90");
    expect(state.config.operationCostMode).toBe("per_hour");
    expect(state.config.operationCostMarkup).toBe("8");
    expect(state.config.customOperationCosts).toEqual([
      { id: "custom-1", name: "Contador", amount: "150", kind: "fixed" },
    ]);
  });

  it("uses only the basic operation costs on the free plan while preserving advanced premium values", () => {
    const defaultConfig = createDefaultAppDataState().config;
    const state = normalizeAppDataState({
      config: {
        ...defaultConfig,
        fixedCostRent: "800",
        variableCostPackaging: "100",
        monthlyProductionTarget: "50",
        productiveHoursPerMonth: "80",
        operationCostMode: "per_hour",
        operationCostMarkup: "12",
        customOperationCosts: [
          { id: "custom-1", name: "Contador", amount: "200", kind: "fixed" },
        ],
      },
    });

    const resolvedConfig = resolveOperationCostConfig(state.config, false);

    expect(resolvedConfig.monthlyTotal).toBe(900);
    expect(resolvedConfig.operationCostMode).toBe("per_unit");
    expect(resolvedConfig.operationCostMarkupRate).toBe(0);
    expect(resolvedConfig.customCosts).toEqual([]);
    expect(state.config.customOperationCosts).toHaveLength(1);
    expect(state.config.operationCostMode).toBe("per_hour");
  });
});
