import type { AppDataState, GenericRecord } from "@/lib/app-data/defaults";

type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

type ValidationFailure = {
  ok: false;
  message: string;
  path?: string;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const MAX_APP_DATA_ARRAY_ITEMS = 5_000;
const MAX_APP_DATA_STRING_LENGTH = 5_000;
const MAX_RECORD_KEYS = 80;
const MAX_NESTING_DEPTH = 8;
const MAX_SAFE_PRICE = 1_000_000_000;
const MATERIAL_TYPES = new Set(["area", "length", "weight", "volume", "unit"]);
const OPERATION_COST_KINDS = new Set(["fixed", "variable"]);
const OPERATION_COST_MODES = new Set(["per_unit", "per_hour"]);

function fail(message: string, path?: string): ValidationFailure {
  return {
    ok: false,
    message,
    path,
  };
}

function isPlainObject(value: unknown): value is GenericRecord {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateString(value: unknown, path: string, maxLength = MAX_APP_DATA_STRING_LENGTH) {
  if (typeof value !== "string") {
    return fail("Texto invalido.", path);
  }

  if (value.length > maxLength) {
    return fail("Texto muito longo.", path);
  }

  return null;
}

function validateOptionalString(value: unknown, path: string, maxLength?: number) {
  if (value === undefined || value === null) {
    return null;
  }

  return validateString(value, path, maxLength);
}

function validateNumberRange(input: {
  allowZero?: boolean;
  max?: number;
  min?: number;
  path: string;
  value: unknown;
}) {
  const value = input.value;

  if (!isFiniteNumber(value)) {
    return fail("Numero invalido.", input.path);
  }

  const min = input.min ?? (input.allowZero ? 0 : Number.MIN_VALUE);
  const max = input.max ?? MAX_SAFE_PRICE;

  if (value < min || value > max) {
    return fail("Numero fora do intervalo permitido.", input.path);
  }

  return null;
}

function validateGenericJsonValue(
  value: unknown,
  path: string,
  depth: number,
): ValidationFailure | null {
  if (depth > MAX_NESTING_DEPTH) {
    return fail("Dados muito aninhados.", path);
  }

  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return typeof value === "string"
      ? validateString(value, path)
      : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? null : fail("Numero invalido.", path);
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_APP_DATA_ARRAY_ITEMS) {
      return fail("Lista muito grande.", path);
    }

    for (let index = 0; index < value.length; index += 1) {
      const error = validateGenericJsonValue(
        value[index],
        `${path}.${index}`,
        depth + 1,
      );

      if (error) {
        return error;
      }
    }

    return null;
  }

  if (!isPlainObject(value)) {
    return fail("Objeto invalido.", path);
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_RECORD_KEYS) {
    return fail("Objeto com muitos campos.", path);
  }

  for (const [key, entryValue] of entries) {
    const keyError = validateString(key, `${path}.${key}`, 80);

    if (keyError) {
      return keyError;
    }

    const valueError = validateGenericJsonValue(
      entryValue,
      `${path}.${key}`,
      depth + 1,
    );

    if (valueError) {
      return valueError;
    }
  }

  return null;
}

function validateAppDataArray(
  value: unknown,
  path: string,
  itemValidator?: (item: GenericRecord, path: string) => ValidationFailure | null,
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return fail("Lista invalida.", path);
  }

  if (value.length > MAX_APP_DATA_ARRAY_ITEMS) {
    return fail("Lista muito grande.", path);
  }

  for (let index = 0; index < value.length; index += 1) {
    const itemPath = `${path}.${index}`;
    const item = value[index];

    if (!isPlainObject(item)) {
      return fail("Item invalido.", itemPath);
    }

    const genericError = validateGenericJsonValue(item, itemPath, 0);

    if (genericError) {
      return genericError;
    }

    const itemError = itemValidator?.(item, itemPath);

    if (itemError) {
      return itemError;
    }
  }

  return null;
}

function validateInsumo(item: GenericRecord, path: string) {
  if ("name" in item) {
    const nameError = validateString(item.name, `${path}.name`, 100);

    if (nameError) {
      return nameError;
    }

    if (!String(item.name).trim()) {
      return fail("Nome do insumo e obrigatorio.", `${path}.name`);
    }
  }

  if ("type" in item && !MATERIAL_TYPES.has(String(item.type))) {
    return fail("Tipo de insumo invalido.", `${path}.type`);
  }

  for (const key of [
    "price",
    "packQty",
    "totalQty",
    "costPerUnit",
    "costPerItem",
    "stock",
    "minStock",
    "width",
    "height",
    "measurePerItem",
  ]) {
    const value = item[key];

    if (value === undefined || value === null) {
      continue;
    }

    const error = validateNumberRange({
      allowZero: key !== "packQty",
      path: `${path}.${key}`,
      value,
    });

    if (error) {
      return error;
    }
  }

  return null;
}

function validateSavedProduct(item: GenericRecord, path: string) {
  if ("name" in item) {
    const nameError = validateString(item.name, `${path}.name`, 100);

    if (nameError) {
      return nameError;
    }

    if (!String(item.name).trim()) {
      return fail("Nome do produto e obrigatorio.", `${path}.name`);
    }
  }

  for (const key of [
    "totalCost",
    "activePrice",
    "activeProfitValue",
    "profitMargin",
    "yieldQty",
    "laborCost",
    "materialTotalCost",
  ]) {
    const value = item[key];

    if (value === undefined || value === null) {
      continue;
    }

    const max = key === "profitMargin" ? 100 : MAX_SAFE_PRICE;
    const error = validateNumberRange({
      allowZero: true,
      max,
      path: `${path}.${key}`,
      value,
    });

    if (error) {
      return error;
    }
  }

  return null;
}

function validateQuoteOrSale(item: GenericRecord, path: string) {
  for (const key of ["clientName", "clientPhone", "productName", "status"]) {
    const error = validateOptionalString(item[key], `${path}.${key}`, 150);

    if (error) {
      return error;
    }
  }

  for (const key of [
    "grossSale",
    "netSale",
    "total",
    "totalCost",
    "quantity",
    "activePrice",
    "profit",
  ]) {
    const value = item[key];

    if (value === undefined || value === null) {
      continue;
    }

    const error = validateNumberRange({
      allowZero: true,
      path: `${path}.${key}`,
      value,
    });

    if (error) {
      return error;
    }
  }

  return null;
}

function validateConfig(config: unknown) {
  if (config === undefined || config === null) {
    return null;
  }

  if (!isPlainObject(config)) {
    return fail("Configuracao invalida.", "config");
  }

  const genericError = validateGenericJsonValue(config, "config", 0);

  if (genericError) {
    return genericError;
  }

  if (
    "operationCostMode" in config &&
    !OPERATION_COST_MODES.has(String(config.operationCostMode))
  ) {
    return fail("Modo de custo operacional invalido.", "config.operationCostMode");
  }

  if (Array.isArray(config.customOperationCosts)) {
    for (let index = 0; index < config.customOperationCosts.length; index += 1) {
      const item = config.customOperationCosts[index];
      const path = `config.customOperationCosts.${index}`;

      if (!isPlainObject(item)) {
        return fail("Custo operacional invalido.", path);
      }

      const nameError = validateOptionalString(item.name, `${path}.name`, 100);

      if (nameError) {
        return nameError;
      }

      if ("kind" in item && !OPERATION_COST_KINDS.has(String(item.kind))) {
        return fail("Tipo de custo operacional invalido.", `${path}.kind`);
      }
    }
  }

  return null;
}

export function validateAppDataInput(
  input: unknown,
): ValidationResult<Partial<AppDataState>> {
  if (!isPlainObject(input)) {
    return fail("Dados enviados em formato invalido.");
  }

  const configError = validateConfig(input.config);

  if (configError) {
    return configError;
  }

  const insumosError = validateAppDataArray(input.insumos, "insumos", validateInsumo);

  if (insumosError) {
    return insumosError;
  }

  const productsError = validateAppDataArray(
    input.savedProducts,
    "savedProducts",
    validateSavedProduct,
  );

  if (productsError) {
    return productsError;
  }

  const salesError = validateAppDataArray(input.sales, "sales", validateQuoteOrSale);

  if (salesError) {
    return salesError;
  }

  const quotesError = validateAppDataArray(input.quotes, "quotes", validateQuoteOrSale);

  if (quotesError) {
    return quotesError;
  }

  return {
    data: input as Partial<AppDataState>,
    ok: true,
  };
}
