"use client";

import { useState } from "react";

type StorageUpdater<T> = T | ((prev: T) => T);
type GenericRecord = Record<string, unknown>;

const STORAGE_EVENT_NAME = "meu-micro-saas:storage-change";
const STORAGE_NAMESPACE = "meu-micro-saas";
const DEFAULT_STORE_NAME = "Calculadora do Produtor";
const DEFAULT_STORE_SUBTITLE =
  "Orçamentos claros. Clientes seguros. Negócios fechados.";
const LEGACY_STORE_NAME = "ATELIÊ";
const LEGACY_STORE_SUBTITLE = "Artesanato e Produtos";

function buildScopedStorageKey(userId: string, key: string) {
  return `${STORAGE_NAMESPACE}:user:${userId}:${key}`;
}

function readStorageValue<T>(storageKey: string, defaultValue: T) {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue === null) {
      return defaultValue;
    }

    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.warn(error);
    return defaultValue;
  }
}

function normalizeBrandingValue(storageKey: string, storedValue: string) {
  if (storageKey.endsWith("calc_storeName") && storedValue === LEGACY_STORE_NAME) {
    return DEFAULT_STORE_NAME;
  }

  if (
    storageKey.endsWith("calc_storeSubtitle") &&
    storedValue === LEGACY_STORE_SUBTITLE
  ) {
    return DEFAULT_STORE_SUBTITLE;
  }

  return storedValue;
}

function emitStorageChange(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT_NAME, {
      detail: { storageKey },
    }),
  );
}

export function usePersistentState<T>(storageKey: string, defaultValue: T) {
  const [state, setLocalState] = useState<T>(() =>
    readStorageValue(storageKey, defaultValue),
  );

  const setState = (value: StorageUpdater<T>) => {
    setLocalState((previousValue) => {
      const nextValue =
        typeof value === "function"
          ? (value as (prev: T) => T)(previousValue)
          : value;

      if (typeof window === "undefined") {
        return nextValue;
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
        emitStorageChange(storageKey);
      } catch (error) {
        console.warn(error);
      }

      return nextValue;
    });
  };

  return [state, setState] as const;
}

export function useAppData(userId: string) {
  const [unit, setUnit] = usePersistentState(
    buildScopedStorageKey(userId, "calc_unit"),
    "mm",
  );
  const [machineCost, setMachineCost] = usePersistentState(
    buildScopedStorageKey(userId, "calc_machineCost"),
    "",
  );
  const [diodeLife, setDiodeLife] = usePersistentState(
    buildScopedStorageKey(userId, "calc_diodeLife"),
    "",
  );
  const [energyCost, setEnergyCost] = usePersistentState(
    buildScopedStorageKey(userId, "calc_energyCost"),
    "",
  );
  const [machinePower, setMachinePower] = usePersistentState(
    buildScopedStorageKey(userId, "calc_machinePower"),
    "96",
  );
  const [hourlyRate, setHourlyRate] = usePersistentState(
    buildScopedStorageKey(userId, "calc_hourlyRate"),
    "",
  );
  const [profitMargin, setProfitMargin] = usePersistentState(
    buildScopedStorageKey(userId, "calc_profitMargin"),
    "50",
  );
  const [userLogo, setUserLogo] = usePersistentState(
    buildScopedStorageKey(userId, "calc_userLogo"),
    "https://i.postimg.cc/hj2J824X/logo.png",
  );
  const [storeName, setStoreName] = usePersistentState(
    buildScopedStorageKey(userId, "calc_storeName"),
    DEFAULT_STORE_NAME,
  );
  const [storeSubtitle, setStoreSubtitle] = usePersistentState(
    buildScopedStorageKey(userId, "calc_storeSubtitle"),
    DEFAULT_STORE_SUBTITLE,
  );

  const normalizedStoreName = normalizeBrandingValue(
    buildScopedStorageKey(userId, "calc_storeName"),
    storeName,
  );
  const normalizedStoreSubtitle = normalizeBrandingValue(
    buildScopedStorageKey(userId, "calc_storeSubtitle"),
    storeSubtitle,
  );

  const [insumos, setInsumos] = usePersistentState<GenericRecord[]>(
    buildScopedStorageKey(userId, "art_calc_insumos"),
    [],
  );
  const [sales, setSales] = usePersistentState<GenericRecord[]>(
    buildScopedStorageKey(userId, "art_calc_sales"),
    [],
  );
  const [quotes, setQuotes] = usePersistentState<GenericRecord[]>(
    buildScopedStorageKey(userId, "art_calc_quotes"),
    [],
  );
  const [savedProducts, setSavedProducts] = usePersistentState<GenericRecord[]>(
    buildScopedStorageKey(userId, "art_calc_products_v3"),
    [],
  );

  return {
    isLoaded: true,
    config: {
      unit,
      setUnit,
      machineCost,
      setMachineCost,
      diodeLife,
      setDiodeLife,
      energyCost,
      setEnergyCost,
      machinePower,
      setMachinePower,
      hourlyRate,
      setHourlyRate,
      profitMargin,
      setProfitMargin,
      userLogo,
      setUserLogo,
      storeName: normalizedStoreName,
      setStoreName,
      storeSubtitle: normalizedStoreSubtitle,
      setStoreSubtitle,
    },
    insumos,
    setInsumos,
    savedProducts,
    setSavedProducts,
    sales,
    setSales,
    quotes,
    setQuotes,
  };
}
