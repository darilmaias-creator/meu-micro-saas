import { describe, expect, it } from "vitest";

import { createDefaultAppDataState } from "@/lib/app-data/defaults";
import { calculateOperationCostBreakdown } from "@/lib/app-data/operation-costs";

describe("operation costs", () => {
  it("uses only the mixed free-plan basics with simple per-unit allocation", () => {
    const config = createDefaultAppDataState().config;
    config.fixedCostRent = "1000";
    config.fixedCostWater = "100";
    config.variableCostPackaging = "50";
    config.monthlyProductionTarget = "100";
    config.productiveHoursPerMonth = "60";
    config.operationCostMode = "per_hour";
    config.operationCostMarkup = "15";
    config.customOperationCosts = [
      { id: "custom-1", name: "Contador", amount: "200", kind: "fixed" },
    ];

    const breakdown = calculateOperationCostBreakdown({
      config,
      isPremium: false,
      yieldQty: 10,
      processMinutes: 120,
      directUnitCost: 20,
    });

    expect(breakdown.monthlyTotal).toBe(1150);
    expect(breakdown.operationCostMode).toBe("per_unit");
    expect(breakdown.customCosts).toEqual([]);
    expect(breakdown.appliedOperationCostPerUnit).toBeCloseTo(11.5, 5);
    expect(breakdown.markupValuePerUnit).toBe(0);
    expect(breakdown.adjustedUnitCost).toBeCloseTo(31.5, 5);
  });

  it("unlocks custom costs, per-hour allocation and markup on the premium plan", () => {
    const config = createDefaultAppDataState().config;
    config.fixedCostRent = "1000";
    config.fixedCostWater = "100";
    config.variableCostPackaging = "50";
    config.monthlyProductionTarget = "100";
    config.productiveHoursPerMonth = "50";
    config.operationCostMode = "per_hour";
    config.operationCostMarkup = "10";
    config.customOperationCosts = [
      { id: "custom-1", name: "Contador", amount: "250", kind: "fixed" },
      { id: "custom-2", name: "Taxa marketplace", amount: "150", kind: "variable" },
    ];

    const breakdown = calculateOperationCostBreakdown({
      config,
      isPremium: true,
      yieldQty: 10,
      processMinutes: 120,
      directUnitCost: 20,
    });

    expect(breakdown.fixedMonthlyTotal).toBe(1350);
    expect(breakdown.variableMonthlyTotal).toBe(200);
    expect(breakdown.monthlyTotal).toBe(1550);
    expect(breakdown.monthlyCostPerHour).toBeCloseTo(31, 5);
    expect(breakdown.appliedOperationCostPerUnit).toBeCloseTo(6.2, 5);
    expect(breakdown.markupValuePerUnit).toBeCloseTo(2.62, 5);
    expect(breakdown.adjustedUnitCost).toBeCloseTo(28.82, 5);
  });
});
