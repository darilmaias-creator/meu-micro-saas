"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createDefaultAppDataState,
  hasMeaningfulAppData,
  normalizeAppDataState,
  type AppConfigState,
  type AppDataResponse,
  type AppDataState,
  type GenericRecord,
} from "@/lib/app-data/defaults";

type ConfigSetter = <K extends keyof AppConfigState>(
  key: K,
  value: AppConfigState[K] | ((prev: AppConfigState[K]) => AppConfigState[K]),
) => void;

const STORAGE_NAMESPACE = "meu-micro-saas";

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

function writeCachedAppData(userId: string, state: AppDataState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      buildScopedStorageKey(userId, "app_data_cache"),
      JSON.stringify(state),
    );
  } catch (error) {
    console.warn(error);
  }
}

function readCachedAppData(userId: string) {
  return normalizeAppDataState(
    readStorageValue<Partial<AppDataState>>(
      buildScopedStorageKey(userId, "app_data_cache"),
      createDefaultAppDataState(),
    ),
  );
}

function readLegacyLocalAppData(userId: string) {
  return normalizeAppDataState({
    config: {
      unit: readStorageValue(buildScopedStorageKey(userId, "calc_unit"), "mm"),
      machineCost: readStorageValue(
        buildScopedStorageKey(userId, "calc_machineCost"),
        "",
      ),
      diodeLife: readStorageValue(
        buildScopedStorageKey(userId, "calc_diodeLife"),
        "",
      ),
      energyCost: readStorageValue(
        buildScopedStorageKey(userId, "calc_energyCost"),
        "",
      ),
      machinePower: readStorageValue(
        buildScopedStorageKey(userId, "calc_machinePower"),
        "96",
      ),
      hourlyRate: readStorageValue(
        buildScopedStorageKey(userId, "calc_hourlyRate"),
        "",
      ),
      profitMargin: readStorageValue(
        buildScopedStorageKey(userId, "calc_profitMargin"),
        "50",
      ),
      userLogo: readStorageValue(
        buildScopedStorageKey(userId, "calc_userLogo"),
        "https://i.postimg.cc/hj2J824X/logo.png",
      ),
      storeName: readStorageValue(
        buildScopedStorageKey(userId, "calc_storeName"),
        "Calculadora do Produtor",
      ),
      storeSubtitle: readStorageValue(
        buildScopedStorageKey(userId, "calc_storeSubtitle"),
        "Orçamentos claros. Clientes seguros. Negócios fechados.",
      ),
    },
    insumos: readStorageValue<GenericRecord[]>(
      buildScopedStorageKey(userId, "art_calc_insumos"),
      [],
    ),
    savedProducts: readStorageValue<GenericRecord[]>(
      buildScopedStorageKey(userId, "art_calc_products_v3"),
      [],
    ),
    sales: readStorageValue<GenericRecord[]>(
      buildScopedStorageKey(userId, "art_calc_sales"),
      [],
    ),
    quotes: readStorageValue<GenericRecord[]>(
      buildScopedStorageKey(userId, "art_calc_quotes"),
      [],
    ),
  });
}

export function useAppData(userId: string) {
  const localFallbackState = useMemo(() => {
    const cachedState = readCachedAppData(userId);

    if (hasMeaningfulAppData(cachedState)) {
      return cachedState;
    }

    return readLegacyLocalAppData(userId);
  }, [userId]);

  const [appState, setAppState] = useState<AppDataState>(localFallbackState);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const hasFetchedFromServerRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const localState = localFallbackState;

    async function loadFromServer() {
      try {
        const response = await fetch("/api/app-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("APP_DATA_FETCH_FAILED");
        }

        const payload = (await response.json()) as AppDataResponse;
        const serverState = normalizeAppDataState(payload.data);

        if (!isMounted) {
          return;
        }

        if (payload.source === "default" && hasMeaningfulAppData(localState)) {
          setAppState(localState);
          writeCachedAppData(userId, localState);
<<<<<<< ours
<<<<<<< ours

          const migrationResponse = await fetch("/api/app-data", {
=======
          lastSyncedSnapshotRef.current = JSON.stringify(localState);

          await fetch("/api/app-data", {
>>>>>>> theirs
=======
          lastSyncedSnapshotRef.current = JSON.stringify(localState);

          await fetch("/api/app-data", {
>>>>>>> theirs
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(localState),
          });
<<<<<<< ours
<<<<<<< ours

          if (migrationResponse.ok) {
            lastSyncedSnapshotRef.current = JSON.stringify(localState);
          }
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        } else {
          setAppState(serverState);
          writeCachedAppData(userId, serverState);
          lastSyncedSnapshotRef.current = JSON.stringify(serverState);
        }
      } catch (error) {
        console.warn(error);

        if (!isMounted) {
          return;
        }

        setAppState(localState);
        writeCachedAppData(userId, localState);
        lastSyncedSnapshotRef.current = JSON.stringify(localState);
      } finally {
        if (isMounted) {
          hasFetchedFromServerRef.current = true;
          setIsLoaded(true);
        }
      }
    }

    setAppState(localState);
    setIsLoaded(false);
    hasFetchedFromServerRef.current = false;
    lastSyncedSnapshotRef.current = null;
    loadFromServer();

    return () => {
      isMounted = false;
    };
  }, [localFallbackState, userId]);

  useEffect(() => {
    if (!isLoaded || !hasFetchedFromServerRef.current) {
      return;
    }

    const nextSnapshot = JSON.stringify(appState);

    writeCachedAppData(userId, appState);

    if (nextSnapshot === lastSyncedSnapshotRef.current) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/app-data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appState),
        });

        if (!response.ok) {
          throw new Error("APP_DATA_SAVE_FAILED");
        }

        lastSyncedSnapshotRef.current = nextSnapshot;
      } catch (error) {
        console.warn(error);
      }
    }, 500);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [appState, isLoaded, userId]);

  const setConfigValue: ConfigSetter = (key, value) => {
    setAppState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]:
          typeof value === "function"
            ? (
                value as (prev: AppConfigState[typeof key]) => AppConfigState[typeof key]
              )(prev.config[key])
            : value,
      },
    }));
  };

  return {
    isLoaded,
    config: {
      unit: appState.config.unit,
      setUnit: (value: string) => setConfigValue("unit", value),
      machineCost: appState.config.machineCost,
      setMachineCost: (value: string) => setConfigValue("machineCost", value),
      diodeLife: appState.config.diodeLife,
      setDiodeLife: (value: string) => setConfigValue("diodeLife", value),
      energyCost: appState.config.energyCost,
      setEnergyCost: (value: string) => setConfigValue("energyCost", value),
      machinePower: appState.config.machinePower,
      setMachinePower: (value: string) => setConfigValue("machinePower", value),
      hourlyRate: appState.config.hourlyRate,
      setHourlyRate: (value: string) => setConfigValue("hourlyRate", value),
      profitMargin: appState.config.profitMargin,
      setProfitMargin: (value: string) => setConfigValue("profitMargin", value),
      userLogo: appState.config.userLogo,
      setUserLogo: (value: string) => setConfigValue("userLogo", value),
      storeName: appState.config.storeName,
      setStoreName: (value: string) => setConfigValue("storeName", value),
      storeSubtitle: appState.config.storeSubtitle,
      setStoreSubtitle: (value: string) =>
        setConfigValue("storeSubtitle", value),
    },
    insumos: appState.insumos,
    setInsumos: (
      value:
        | GenericRecord[]
        | ((prev: GenericRecord[]) => GenericRecord[]),
    ) =>
      setAppState((prev) => ({
        ...prev,
        insumos:
          typeof value === "function" ? value(prev.insumos) : value,
      })),
    savedProducts: appState.savedProducts,
    setSavedProducts: (
      value:
        | GenericRecord[]
        | ((prev: GenericRecord[]) => GenericRecord[]),
    ) =>
      setAppState((prev) => ({
        ...prev,
        savedProducts:
          typeof value === "function" ? value(prev.savedProducts) : value,
      })),
    sales: appState.sales,
    setSales: (
      value:
        | GenericRecord[]
        | ((prev: GenericRecord[]) => GenericRecord[]),
    ) =>
      setAppState((prev) => ({
        ...prev,
        sales: typeof value === "function" ? value(prev.sales) : value,
      })),
    quotes: appState.quotes,
    setQuotes: (
      value:
        | GenericRecord[]
        | ((prev: GenericRecord[]) => GenericRecord[]),
    ) =>
      setAppState((prev) => ({
        ...prev,
        quotes: typeof value === "function" ? value(prev.quotes) : value,
      })),
  };
}
