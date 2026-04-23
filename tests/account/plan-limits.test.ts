import { describe, expect, it } from "vitest";

import { createDefaultAppDataState } from "@/lib/app-data/defaults";
import { validateAppDataPlanLimits } from "@/lib/app-data/plan-limits";

describe("app data plan limits", () => {
  it("allows a free account to keep quote settings saved while it was premium", () => {
    const currentState = createDefaultAppDataState();
    currentState.config.quoteLeadTimeText =
      "Prazo personalizado salvo no Premium.";

    const nextState = structuredClone(currentState);

    const violation = validateAppDataPlanLimits({
      currentState,
      isPremium: false,
      nextState,
    });

    expect(violation).toBeNull();
  });

  it("blocks free accounts from changing quote settings to a new custom value", () => {
    const currentState = createDefaultAppDataState();
    const nextState = createDefaultAppDataState();
    nextState.config.quoteLeadTimeText = "Prazo personalizado novo.";

    const violation = validateAppDataPlanLimits({
      currentState,
      isPremium: false,
      nextState,
    });

    expect(violation).toEqual({
      code: "FREE_QUOTE_SETTINGS_LOCKED",
      message:
        "As configuracoes do orçamento com textos e contatos personalizados sao exclusivas do plano Premium. No plano gratis, o app usa os textos padrao sem apagar o que voce ja deixou salvo.",
    });
  });

  it("allows free accounts to return quote settings to the default text", () => {
    const currentState = createDefaultAppDataState();
    currentState.config.quoteLeadTimeText =
      "Prazo personalizado salvo no Premium.";

    const nextState = createDefaultAppDataState();

    const violation = validateAppDataPlanLimits({
      currentState,
      isPremium: false,
      nextState,
    });

    expect(violation).toBeNull();
  });
});
