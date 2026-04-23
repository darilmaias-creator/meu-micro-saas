import { describe, expect, it } from "vitest";

import {
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
});
