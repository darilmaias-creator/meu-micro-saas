import {
  createDefaultAppDataState,
  type AppConfigState,
  type OperationCostEntry,
  type OperationCostMode,
} from "@/lib/app-data/defaults";

export type ResolvedOperationCostConfig = {
  fixedCosts: OperationCostEntry[];
  variableCosts: OperationCostEntry[];
  customCosts: OperationCostEntry[];
  monthlyProductionTarget: number;
  productiveHoursPerMonth: number;
  operationCostMode: OperationCostMode;
  operationCostMarkupRate: number;
  fixedMonthlyTotal: number;
  variableMonthlyTotal: number;
  customMonthlyTotal: number;
  monthlyTotal: number;
  monthlyCostPerUnit: number;
  monthlyCostPerHour: number;
};

type OperationCostBreakdownInput = {
  config: AppConfigState;
  isPremium: boolean;
  yieldQty: number;
  processMinutes: number;
  directUnitCost: number;
};

export type OperationCostBreakdown = ResolvedOperationCostConfig & {
  appliedOperationCostPerUnit: number;
  operationCostBatchTotal: number;
  markupValuePerUnit: number;
  markupBatchTotal: number;
  adjustedUnitCost: number;
  adjustedBatchCost: number;
};

function parseCurrencyLikeValue(value: string) {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildBaseOperationCosts(config: AppConfigState) {
  return {
    fixedCosts: [
      {
        id: "rent",
        name: "Aluguel",
        amount: config.fixedCostRent,
        kind: "fixed" as const,
      },
      {
        id: "water",
        name: "Agua",
        amount: config.fixedCostWater,
        kind: "fixed" as const,
      },
      {
        id: "electricity",
        name: "Luz",
        amount: config.fixedCostElectricity,
        kind: "fixed" as const,
      },
      {
        id: "internet",
        name: "Internet",
        amount: config.fixedCostInternet,
        kind: "fixed" as const,
      },
    ],
    variableCosts: [
      {
        id: "packaging",
        name: "Embalagem",
        amount: config.variableCostPackaging,
        kind: "variable" as const,
      },
      {
        id: "transport",
        name: "Transporte",
        amount: config.variableCostTransport,
        kind: "variable" as const,
      },
      {
        id: "fees",
        name: "Taxas",
        amount: config.variableCostFees,
        kind: "variable" as const,
      },
    ],
  };
}

function sumCosts(items: OperationCostEntry[]) {
  return items.reduce((total, item) => total + parseCurrencyLikeValue(item.amount), 0);
}

export function resolveOperationCostConfig(
  config: AppConfigState,
  isPremium: boolean,
): ResolvedOperationCostConfig {
  const defaults = createDefaultAppDataState().config;
  const baseCosts = buildBaseOperationCosts(config);
  const customCosts = isPremium ? config.customOperationCosts : defaults.customOperationCosts;
  const fixedMonthlyTotal =
    sumCosts(baseCosts.fixedCosts) +
    sumCosts(customCosts.filter((item) => item.kind === "fixed"));
  const variableMonthlyTotal =
    sumCosts(baseCosts.variableCosts) +
    sumCosts(customCosts.filter((item) => item.kind === "variable"));
  const customMonthlyTotal = sumCosts(customCosts);
  const monthlyTotal = fixedMonthlyTotal + variableMonthlyTotal;
  const monthlyProductionTarget = parseCurrencyLikeValue(config.monthlyProductionTarget);
  const productiveHoursPerMonth = isPremium
    ? parseCurrencyLikeValue(config.productiveHoursPerMonth)
    : parseCurrencyLikeValue(defaults.productiveHoursPerMonth);
  const operationCostMode = isPremium ? config.operationCostMode : defaults.operationCostMode;
  const operationCostMarkupRate = isPremium
    ? parseCurrencyLikeValue(config.operationCostMarkup)
    : parseCurrencyLikeValue(defaults.operationCostMarkup);
  const monthlyCostPerUnit =
    monthlyProductionTarget > 0 ? monthlyTotal / monthlyProductionTarget : 0;
  const monthlyCostPerHour =
    productiveHoursPerMonth > 0 ? monthlyTotal / productiveHoursPerMonth : 0;

  return {
    fixedCosts: baseCosts.fixedCosts,
    variableCosts: baseCosts.variableCosts,
    customCosts,
    monthlyProductionTarget,
    productiveHoursPerMonth,
    operationCostMode,
    operationCostMarkupRate,
    fixedMonthlyTotal,
    variableMonthlyTotal,
    customMonthlyTotal,
    monthlyTotal,
    monthlyCostPerUnit,
    monthlyCostPerHour,
  };
}

export function calculateOperationCostBreakdown(
  input: OperationCostBreakdownInput,
): OperationCostBreakdown {
  const resolved = resolveOperationCostConfig(input.config, input.isPremium);
  const safeYieldQty = input.yieldQty > 0 ? input.yieldQty : 1;
  const processHours = input.processMinutes > 0 ? input.processMinutes / 60 : 0;
  const appliedOperationCostPerUnit =
    resolved.operationCostMode === "per_hour"
      ? processHours > 0
        ? (resolved.monthlyCostPerHour * processHours) / safeYieldQty
        : 0
      : resolved.monthlyCostPerUnit;
  const operationCostBatchTotal = appliedOperationCostPerUnit * safeYieldQty;
  const markupBase = input.directUnitCost + appliedOperationCostPerUnit;
  const markupValuePerUnit = markupBase * (resolved.operationCostMarkupRate / 100);
  const markupBatchTotal = markupValuePerUnit * safeYieldQty;
  const adjustedUnitCost =
    input.directUnitCost + appliedOperationCostPerUnit + markupValuePerUnit;
  const adjustedBatchCost = adjustedUnitCost * safeYieldQty;

  return {
    ...resolved,
    appliedOperationCostPerUnit,
    operationCostBatchTotal,
    markupValuePerUnit,
    markupBatchTotal,
    adjustedUnitCost,
    adjustedBatchCost,
  };
}
