"use client";

import { useEffect, useRef, useState } from "react";

import {
  createDefaultAppDataState,
  hasMeaningfulAppData,
  normalizeAppDataState,
  normalizeBrandingValue,
  type AppConfigState,
  type AppDataResponse,
  type AppDataState,
} from "@/lib/app-data/defaults";

type StorageUpdater<T> = T | ((prev: T) => T);
type CollectionKey = "insumos" | "savedProducts" | "sales" | "quotes";
type AppDataMutationResponse = {
  ok: boolean;
  updatedAt: string | null;
};

const STORAGE_NAMESPACE = "meu-micro-saas";
const SYNC_POLL_INTERVAL_MS = 15_000;

const STORAGE_KEYS = {
  unit: "calc_unit",
  machineCost: "calc_machineCost",
  diodeLife: "calc_diodeLife",
  energyCost: "calc_energyCost",
  machinePower: "calc_machinePower",
  hourlyRate: "calc_hourlyRate",
  profitMargin: "calc_profitMargin",
  userLogo: "calc_userLogo",
  storeName: "calc_storeName",
  storeSubtitle: "calc_storeSubtitle",
  insumos: "art_calc_insumos",
  sales: "art_calc_sales",
  quotes: "art_calc_quotes",
  savedProducts: "art_calc_products_v3",
} as const;

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

    const parsedValue = JSON.parse(storedValue) as T;

    if (typeof parsedValue === "string") {
      return normalizeBrandingValue(storageKey, parsedValue) as T;
    }

    return parsedValue;
  } catch {
    return defaultValue;
  }
}

function writeStorageValue<T>(storageKey: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Keep the app usable even if the browser blocks storage writes.
  }
}

function readLocalAppData(userId: string) {
  const defaults = createDefaultAppDataState();

  return normalizeAppDataState({
    config: {
      unit: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.unit),
        defaults.config.unit,
      ),
      machineCost: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.machineCost),
        defaults.config.machineCost,
      ),
      diodeLife: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.diodeLife),
        defaults.config.diodeLife,
      ),
      energyCost: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.energyCost),
        defaults.config.energyCost,
      ),
      machinePower: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.machinePower),
        defaults.config.machinePower,
      ),
      hourlyRate: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.hourlyRate),
        defaults.config.hourlyRate,
      ),
      profitMargin: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.profitMargin),
        defaults.config.profitMargin,
      ),
      userLogo: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.userLogo),
        defaults.config.userLogo,
      ),
      storeName: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.storeName),
        defaults.config.storeName,
      ),
      storeSubtitle: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.storeSubtitle),
        defaults.config.storeSubtitle,
      ),
    },
    insumos: readStorageValue(
      buildScopedStorageKey(userId, STORAGE_KEYS.insumos),
      defaults.insumos,
    ),
    savedProducts: readStorageValue(
      buildScopedStorageKey(userId, STORAGE_KEYS.savedProducts),
      defaults.savedProducts,
    ),
    sales: readStorageValue(
      buildScopedStorageKey(userId, STORAGE_KEYS.sales),
      defaults.sales,
    ),
    quotes: readStorageValue(
      buildScopedStorageKey(userId, STORAGE_KEYS.quotes),
      defaults.quotes,
    ),
  });
}

function writeLocalAppData(userId: string, state: AppDataState) {
  const normalizedState = normalizeAppDataState(state);

  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.unit),
    normalizedState.config.unit,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.machineCost),
    normalizedState.config.machineCost,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.diodeLife),
    normalizedState.config.diodeLife,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.energyCost),
    normalizedState.config.energyCost,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.machinePower),
    normalizedState.config.machinePower,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.hourlyRate),
    normalizedState.config.hourlyRate,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.profitMargin),
    normalizedState.config.profitMargin,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.userLogo),
    normalizedState.config.userLogo,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.storeName),
    normalizedState.config.storeName,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.storeSubtitle),
    normalizedState.config.storeSubtitle,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.insumos),
    normalizedState.insumos,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.savedProducts),
    normalizedState.savedProducts,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.sales),
    normalizedState.sales,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quotes),
    normalizedState.quotes,
  );
}

export function clearLocalAppDataCache(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(buildScopedStorageKey(userId, key));
  });
}

function serializeAppDataState(state: AppDataState) {
  return JSON.stringify(normalizeAppDataState(state));
}

async function readResponseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      details?: string;
    };

    return payload.details
      ? `${payload.message ?? "Erro desconhecido"} (${payload.details})`
      : payload.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function buildConfigFieldSetter(
  setState: React.Dispatch<React.SetStateAction<AppDataState>>,
  key: keyof AppConfigState,
) {
  return (value: StorageUpdater<AppConfigState[typeof key]>) => {
    setState((previousState) => {
      const previousValue = previousState.config[key];
      const nextValue =
        typeof value === "function"
          ? (
              value as (
                prev: AppConfigState[typeof key],
              ) => AppConfigState[typeof key]
            )(previousValue)
          : value;

      return {
        ...previousState,
        config: {
          ...previousState.config,
          [key]: nextValue,
        },
      };
    });
  };
}

function buildCollectionSetter(
  setState: React.Dispatch<React.SetStateAction<AppDataState>>,
  key: CollectionKey,
) {
  return (value: StorageUpdater<AppDataState[typeof key]>) => {
    setState((previousState) => {
      const previousValue = previousState[key];
      const nextValue =
        typeof value === "function"
          ? (
              value as (prev: AppDataState[typeof key]) => AppDataState[typeof key]
            )(previousValue)
          : value;

      return {
        ...previousState,
        [key]: nextValue,
      };
    });
  };
}

export function useAppData(userId: string) {
  const [state, setState] = useState<AppDataState>(() => readLocalAppData(userId));
  const [isLoaded, setIsLoaded] = useState(false);
  const hasHydratedRef = useRef(false);
  const lastSyncedStateRef = useRef("");
  const lastRemoteUpdatedAtRef = useRef<string | null>(null);
  const latestSerializedStateRef = useRef(serializeAppDataState(state));

  useEffect(() => {
    let isCurrent = true;

    const localState = readLocalAppData(userId);
    const localSerializedState = serializeAppDataState(localState);

    setState(localState);
    setIsLoaded(false);
    hasHydratedRef.current = false;
    lastSyncedStateRef.current = "";
    lastRemoteUpdatedAtRef.current = null;
    latestSerializedStateRef.current = localSerializedState;

    async function loadFromDatabase() {
      try {
        const response = await fetch("/api/app-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readResponseError(response));
        }

        const payload = (await response.json()) as AppDataResponse;

        if (!isCurrent) {
          return;
        }

        const remoteState = normalizeAppDataState(payload.data);
        const remoteSerializedState = serializeAppDataState(remoteState);
        const shouldKeepLocalState =
          payload.source === "default" && hasMeaningfulAppData(localState);

        if (shouldKeepLocalState) {
          setState(localState);
        } else {
          setState(remoteState);
          writeLocalAppData(userId, remoteState);
          latestSerializedStateRef.current = remoteSerializedState;
          lastSyncedStateRef.current = remoteSerializedState;
        }

        lastRemoteUpdatedAtRef.current = payload.updatedAt;
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        console.error(
          "Nao foi possivel carregar os dados do Supabase. O app continuou com o armazenamento local.",
        );
        console.error(error);
        setState(localState);
      } finally {
        if (isCurrent) {
          hasHydratedRef.current = true;
          setIsLoaded(true);
        }
      }
    }

    void loadFromDatabase();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    latestSerializedStateRef.current = serializeAppDataState(state);
  }, [state]);

  useEffect(() => {
    if (!isLoaded || !hasHydratedRef.current) {
      return;
    }

    const normalizedState = normalizeAppDataState(state);
    writeLocalAppData(userId, normalizedState);

    if (!hasMeaningfulAppData(normalizedState)) {
      return;
    }

    const serializedState = serializeAppDataState(normalizedState);

    if (serializedState === lastSyncedStateRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/app-data", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: serializedState,
        });

        if (response.ok) {
          const payload =
            (await response.json().catch(() => null)) as AppDataMutationResponse | null;

          lastSyncedStateRef.current = serializedState;
          lastRemoteUpdatedAtRef.current = payload?.updatedAt ?? null;
          return;
        }

        console.error(await readResponseError(response));
      } catch (error) {
        // Fall back to the local cache if the database is unavailable.
        console.error(
          "Nao foi possivel salvar os dados no Supabase. Os dados ficaram apenas no navegador por enquanto.",
        );
        console.error(error);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoaded, state, userId]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") {
      return;
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key) {
        return;
      }

      const scopedPrefix = `${STORAGE_NAMESPACE}:user:${userId}:`;

      if (!event.key.startsWith(scopedPrefix)) {
        return;
      }

      const nextState = readLocalAppData(userId);
      const nextSerializedState = serializeAppDataState(nextState);

      if (nextSerializedState === latestSerializedStateRef.current) {
        return;
      }

      setState(nextState);
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isCancelled = false;

    async function refreshFromDatabase() {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (latestSerializedStateRef.current !== lastSyncedStateRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/app-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readResponseError(response));
        }

        const payload = (await response.json()) as AppDataResponse;

        if (isCancelled) {
          return;
        }

        if (!payload.updatedAt || payload.updatedAt === lastRemoteUpdatedAtRef.current) {
          return;
        }

        const remoteState = normalizeAppDataState(payload.data);
        const remoteSerializedState = serializeAppDataState(remoteState);

        if (remoteSerializedState === latestSerializedStateRef.current) {
          lastRemoteUpdatedAtRef.current = payload.updatedAt;
          lastSyncedStateRef.current = remoteSerializedState;
          return;
        }

        setState(remoteState);
        writeLocalAppData(userId, remoteState);
        latestSerializedStateRef.current = remoteSerializedState;
        lastSyncedStateRef.current = remoteSerializedState;
        lastRemoteUpdatedAtRef.current = payload.updatedAt;
      } catch (error) {
        console.error(
          "Nao foi possivel atualizar os dados da conta a partir do Supabase.",
        );
        console.error(error);
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshFromDatabase();
    }, SYNC_POLL_INTERVAL_MS);

    function handleVisibilityOrFocus() {
      void refreshFromDatabase();
    }

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [isLoaded, userId]);

  return {
    isLoaded,
    replaceAllData: (value: Partial<AppDataState>) => {
      setState(normalizeAppDataState(value));
    },
    config: {
      ...state.config,
      setUnit: buildConfigFieldSetter(setState, "unit"),
      setMachineCost: buildConfigFieldSetter(setState, "machineCost"),
      setDiodeLife: buildConfigFieldSetter(setState, "diodeLife"),
      setEnergyCost: buildConfigFieldSetter(setState, "energyCost"),
      setMachinePower: buildConfigFieldSetter(setState, "machinePower"),
      setHourlyRate: buildConfigFieldSetter(setState, "hourlyRate"),
      setProfitMargin: buildConfigFieldSetter(setState, "profitMargin"),
      setUserLogo: buildConfigFieldSetter(setState, "userLogo"),
      setStoreName: buildConfigFieldSetter(setState, "storeName"),
      setStoreSubtitle: buildConfigFieldSetter(setState, "storeSubtitle"),
    },
    insumos: state.insumos,
    setInsumos: buildCollectionSetter(setState, "insumos"),
    savedProducts: state.savedProducts,
    setSavedProducts: buildCollectionSetter(setState, "savedProducts"),
    sales: state.sales,
    setSales: buildCollectionSetter(setState, "sales"),
    quotes: state.quotes,
    setQuotes: buildCollectionSetter(setState, "quotes"),
  };
}
