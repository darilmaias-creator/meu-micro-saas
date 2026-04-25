"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
type AppDataConflictResponse = {
  code: "REMOTE_STATE_CONFLICT";
  data: AppDataState;
  message: string;
  updatedAt: string | null;
};

const STORAGE_NAMESPACE = "meu-micro-saas";
const SYNC_POLL_INTERVAL_MS = 15_000;

type RuntimeAppDataCacheEntry = {
  lastRemoteUpdatedAt: string | null;
  lastSyncedState: string;
  latestSerializedState: string;
  state: AppDataState;
};

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
  quoteValidityDays: "calc_quoteValidityDays",
  quoteLeadTimeText: "calc_quoteLeadTimeText",
  quoteDeliveryText: "calc_quoteDeliveryText",
  quotePaymentText: "calc_quotePaymentText",
  quoteAdvanceText: "calc_quoteAdvanceText",
  quoteApprovalText: "calc_quoteApprovalText",
  quoteNotesText: "calc_quoteNotesText",
  businessInstagram: "calc_businessInstagram",
  businessWhatsapp: "calc_businessWhatsapp",
  fixedCostRent: "calc_fixedCostRent",
  fixedCostWater: "calc_fixedCostWater",
  fixedCostElectricity: "calc_fixedCostElectricity",
  fixedCostInternet: "calc_fixedCostInternet",
  variableCostPackaging: "calc_variableCostPackaging",
  variableCostTransport: "calc_variableCostTransport",
  variableCostFees: "calc_variableCostFees",
  monthlyProductionTarget: "calc_monthlyProductionTarget",
  productiveHoursPerMonth: "calc_productiveHoursPerMonth",
  operationCostMode: "calc_operationCostMode",
  operationCostMarkup: "calc_operationCostMarkup",
  customOperationCosts: "calc_customOperationCosts",
  insumos: "art_calc_insumos",
  sales: "art_calc_sales",
  quotes: "art_calc_quotes",
  savedProducts: "art_calc_products_v3",
} as const;

const runtimeAppDataCache = new Map<string, RuntimeAppDataCacheEntry>();

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
      quoteValidityDays: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteValidityDays),
        defaults.config.quoteValidityDays,
      ),
      quoteLeadTimeText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteLeadTimeText),
        defaults.config.quoteLeadTimeText,
      ),
      quoteDeliveryText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteDeliveryText),
        defaults.config.quoteDeliveryText,
      ),
      quotePaymentText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quotePaymentText),
        defaults.config.quotePaymentText,
      ),
      quoteAdvanceText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteAdvanceText),
        defaults.config.quoteAdvanceText,
      ),
      quoteApprovalText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteApprovalText),
        defaults.config.quoteApprovalText,
      ),
      quoteNotesText: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.quoteNotesText),
        defaults.config.quoteNotesText,
      ),
      businessInstagram: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.businessInstagram),
        defaults.config.businessInstagram,
      ),
      businessWhatsapp: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.businessWhatsapp),
        defaults.config.businessWhatsapp,
      ),
      fixedCostRent: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostRent),
        defaults.config.fixedCostRent,
      ),
      fixedCostWater: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostWater),
        defaults.config.fixedCostWater,
      ),
      fixedCostElectricity: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostElectricity),
        defaults.config.fixedCostElectricity,
      ),
      fixedCostInternet: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostInternet),
        defaults.config.fixedCostInternet,
      ),
      variableCostPackaging: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.variableCostPackaging),
        defaults.config.variableCostPackaging,
      ),
      variableCostTransport: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.variableCostTransport),
        defaults.config.variableCostTransport,
      ),
      variableCostFees: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.variableCostFees),
        defaults.config.variableCostFees,
      ),
      monthlyProductionTarget: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.monthlyProductionTarget),
        defaults.config.monthlyProductionTarget,
      ),
      productiveHoursPerMonth: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.productiveHoursPerMonth),
        defaults.config.productiveHoursPerMonth,
      ),
      operationCostMode: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.operationCostMode),
        defaults.config.operationCostMode,
      ),
      operationCostMarkup: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.operationCostMarkup),
        defaults.config.operationCostMarkup,
      ),
      customOperationCosts: readStorageValue(
        buildScopedStorageKey(userId, STORAGE_KEYS.customOperationCosts),
        defaults.config.customOperationCosts,
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
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteValidityDays),
    normalizedState.config.quoteValidityDays,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteLeadTimeText),
    normalizedState.config.quoteLeadTimeText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteDeliveryText),
    normalizedState.config.quoteDeliveryText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quotePaymentText),
    normalizedState.config.quotePaymentText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteAdvanceText),
    normalizedState.config.quoteAdvanceText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteApprovalText),
    normalizedState.config.quoteApprovalText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.quoteNotesText),
    normalizedState.config.quoteNotesText,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.businessInstagram),
    normalizedState.config.businessInstagram,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.businessWhatsapp),
    normalizedState.config.businessWhatsapp,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostRent),
    normalizedState.config.fixedCostRent,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostWater),
    normalizedState.config.fixedCostWater,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostElectricity),
    normalizedState.config.fixedCostElectricity,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.fixedCostInternet),
    normalizedState.config.fixedCostInternet,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.variableCostPackaging),
    normalizedState.config.variableCostPackaging,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.variableCostTransport),
    normalizedState.config.variableCostTransport,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.variableCostFees),
    normalizedState.config.variableCostFees,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.monthlyProductionTarget),
    normalizedState.config.monthlyProductionTarget,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.productiveHoursPerMonth),
    normalizedState.config.productiveHoursPerMonth,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.operationCostMode),
    normalizedState.config.operationCostMode,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.operationCostMarkup),
    normalizedState.config.operationCostMarkup,
  );
  writeStorageValue(
    buildScopedStorageKey(userId, STORAGE_KEYS.customOperationCosts),
    normalizedState.config.customOperationCosts,
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

function updateRuntimeAppDataCache({
  userId,
  state,
  lastRemoteUpdatedAt,
  lastSyncedState,
  latestSerializedState,
}: {
  userId: string;
  state: AppDataState;
  lastRemoteUpdatedAt: string | null;
  lastSyncedState: string;
  latestSerializedState: string;
}) {
  runtimeAppDataCache.set(userId, {
    lastRemoteUpdatedAt,
    lastSyncedState,
    latestSerializedState,
    state,
  });
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
  const [state, setState] = useState<AppDataState>(() => {
    const cachedEntry = runtimeAppDataCache.get(userId);

    if (cachedEntry) {
      return cachedEntry.state;
    }

    return readLocalAppData(userId);
  });
  const [isLoaded, setIsLoaded] = useState(() => {
    const cachedEntry = runtimeAppDataCache.get(userId);

    if (cachedEntry) {
      return true;
    }

    const localState = readLocalAppData(userId);
    return hasMeaningfulAppData(localState);
  });
  const hasHydratedRef = useRef(false);
  const lastSyncedStateRef = useRef("");
  const lastRemoteUpdatedAtRef = useRef<string | null>(null);
  const isLoadedRef = useRef(isLoaded);
  const latestNormalizedStateRef = useRef(normalizeAppDataState(state));
  const latestSerializedStateRef = useRef(serializeAppDataState(state));
  const saveInFlightRef = useRef(false);
  const pendingSaveSerializedRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const flushPendingSaveRef = useRef<(() => Promise<void>) | null>(null);

  const schedulePendingSave = useCallback((delayMs = 300) => {
    if (typeof window === "undefined") {
      return;
    }

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void flushPendingSaveRef.current?.();
    }, delayMs);
  }, []);

  const flushPendingSave = useCallback(async () => {
    if (!isLoadedRef.current || !hasHydratedRef.current || saveInFlightRef.current) {
      return;
    }

    const serializedState = pendingSaveSerializedRef.current;

    if (!serializedState || serializedState === lastSyncedStateRef.current) {
      return;
    }

    const requestBaseUpdatedAt = lastRemoteUpdatedAtRef.current ?? "";
    saveInFlightRef.current = true;

    try {
      const response = await fetch("/api/app-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-app-data-base-updated-at": requestBaseUpdatedAt,
        },
        body: serializedState,
      });

      if (response.ok) {
        const payload =
          (await response.json().catch(() => null)) as AppDataMutationResponse | null;
        const latestSerializedState = latestSerializedStateRef.current;
        const latestState =
          latestSerializedState === serializedState
            ? latestNormalizedStateRef.current
            : normalizeAppDataState(JSON.parse(serializedState) as AppDataState);

        lastRemoteUpdatedAtRef.current = payload?.updatedAt ?? null;

        if (pendingSaveSerializedRef.current === serializedState) {
          pendingSaveSerializedRef.current = null;
        }

        if (latestSerializedState === serializedState) {
          lastSyncedStateRef.current = serializedState;
        }

        updateRuntimeAppDataCache({
          userId,
          state: latestState,
          lastRemoteUpdatedAt: lastRemoteUpdatedAtRef.current,
          lastSyncedState: lastSyncedStateRef.current,
          latestSerializedState,
        });
        return;
      }

      if (response.status === 409) {
        const payload =
          (await response.json().catch(() => null)) as AppDataConflictResponse | null;

        if (payload?.code === "REMOTE_STATE_CONFLICT") {
          const remoteState = normalizeAppDataState(payload.data);
          const remoteSerializedState = serializeAppDataState(remoteState);
          const hasNewerLocalChanges =
            latestSerializedStateRef.current !== serializedState;

          lastRemoteUpdatedAtRef.current = payload.updatedAt;

          if (hasNewerLocalChanges) {
            console.warn(payload.message);
            return;
          }

          setState(remoteState);
          writeLocalAppData(userId, remoteState);
          latestNormalizedStateRef.current = remoteState;
          latestSerializedStateRef.current = remoteSerializedState;
          pendingSaveSerializedRef.current = null;
          lastSyncedStateRef.current = remoteSerializedState;
          updateRuntimeAppDataCache({
            userId,
            state: remoteState,
            lastRemoteUpdatedAt: payload.updatedAt,
            lastSyncedState: remoteSerializedState,
            latestSerializedState: remoteSerializedState,
          });

          console.warn(payload.message);
          return;
        }
      }

      console.error(await readResponseError(response));
    } catch (error) {
      // Fall back to the local cache if the database is unavailable.
      console.error(
        "Nao foi possivel salvar os dados no Supabase. Os dados ficaram apenas no navegador por enquanto.",
      );
      console.error(error);
    } finally {
      saveInFlightRef.current = false;

      if (
        pendingSaveSerializedRef.current &&
        pendingSaveSerializedRef.current !== lastSyncedStateRef.current
      ) {
        schedulePendingSave(0);
      }
    }
  }, [schedulePendingSave, userId]);

  useEffect(() => {
    let isCurrent = true;
    const cachedEntry = runtimeAppDataCache.get(userId);

    const localState = cachedEntry?.state ?? readLocalAppData(userId);
    const localSerializedState = serializeAppDataState(localState);
    const canRenderFromLocalState =
      Boolean(cachedEntry) || hasMeaningfulAppData(localState);

    setState(localState);
    setIsLoaded(canRenderFromLocalState);
    hasHydratedRef.current = Boolean(cachedEntry);
    lastSyncedStateRef.current = cachedEntry?.lastSyncedState ?? "";
    lastRemoteUpdatedAtRef.current = cachedEntry?.lastRemoteUpdatedAt ?? null;
    latestSerializedStateRef.current =
      cachedEntry?.latestSerializedState ?? localSerializedState;

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
          latestSerializedStateRef.current = localSerializedState;
          latestNormalizedStateRef.current = localState;
          lastSyncedStateRef.current = "";
          updateRuntimeAppDataCache({
            userId,
            state: localState,
            lastRemoteUpdatedAt: payload.updatedAt,
            lastSyncedState: "",
            latestSerializedState: localSerializedState,
          });
        } else {
          setState(remoteState);
          writeLocalAppData(userId, remoteState);
          latestSerializedStateRef.current = remoteSerializedState;
          latestNormalizedStateRef.current = remoteState;
          lastSyncedStateRef.current = remoteSerializedState;
          updateRuntimeAppDataCache({
            userId,
            state: remoteState,
            lastRemoteUpdatedAt: payload.updatedAt,
            lastSyncedState: remoteSerializedState,
            latestSerializedState: remoteSerializedState,
          });
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
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);

  useEffect(() => {
    const normalizedState = normalizeAppDataState(state);
    latestNormalizedStateRef.current = normalizedState;
    latestSerializedStateRef.current = serializeAppDataState(normalizedState);

    updateRuntimeAppDataCache({
      userId,
      state: normalizedState,
      lastRemoteUpdatedAt: lastRemoteUpdatedAtRef.current,
      lastSyncedState: lastSyncedStateRef.current,
      latestSerializedState: latestSerializedStateRef.current,
    });
  }, [state]);

  useEffect(() => {
    flushPendingSaveRef.current = flushPendingSave;

    return () => {
      flushPendingSaveRef.current = null;
    };
  }, [flushPendingSave]);

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

    pendingSaveSerializedRef.current = serializedState;
    schedulePendingSave();

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isLoaded, schedulePendingSave, state, userId]);

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
        latestNormalizedStateRef.current = remoteState;
        latestSerializedStateRef.current = remoteSerializedState;
        lastSyncedStateRef.current = remoteSerializedState;
        lastRemoteUpdatedAtRef.current = payload.updatedAt;
        updateRuntimeAppDataCache({
          userId,
          state: remoteState,
          lastRemoteUpdatedAt: payload.updatedAt,
          lastSyncedState: remoteSerializedState,
          latestSerializedState: remoteSerializedState,
        });
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
      setQuoteValidityDays: buildConfigFieldSetter(setState, "quoteValidityDays"),
      setQuoteLeadTimeText: buildConfigFieldSetter(setState, "quoteLeadTimeText"),
      setQuoteDeliveryText: buildConfigFieldSetter(setState, "quoteDeliveryText"),
      setQuotePaymentText: buildConfigFieldSetter(setState, "quotePaymentText"),
      setQuoteAdvanceText: buildConfigFieldSetter(setState, "quoteAdvanceText"),
      setQuoteApprovalText: buildConfigFieldSetter(setState, "quoteApprovalText"),
      setQuoteNotesText: buildConfigFieldSetter(setState, "quoteNotesText"),
      setBusinessInstagram: buildConfigFieldSetter(
        setState,
        "businessInstagram",
      ),
      setBusinessWhatsapp: buildConfigFieldSetter(
        setState,
        "businessWhatsapp",
      ),
      setFixedCostRent: buildConfigFieldSetter(setState, "fixedCostRent"),
      setFixedCostWater: buildConfigFieldSetter(setState, "fixedCostWater"),
      setFixedCostElectricity: buildConfigFieldSetter(
        setState,
        "fixedCostElectricity",
      ),
      setFixedCostInternet: buildConfigFieldSetter(setState, "fixedCostInternet"),
      setVariableCostPackaging: buildConfigFieldSetter(
        setState,
        "variableCostPackaging",
      ),
      setVariableCostTransport: buildConfigFieldSetter(
        setState,
        "variableCostTransport",
      ),
      setVariableCostFees: buildConfigFieldSetter(setState, "variableCostFees"),
      setMonthlyProductionTarget: buildConfigFieldSetter(
        setState,
        "monthlyProductionTarget",
      ),
      setProductiveHoursPerMonth: buildConfigFieldSetter(
        setState,
        "productiveHoursPerMonth",
      ),
      setOperationCostMode: buildConfigFieldSetter(setState, "operationCostMode"),
      setOperationCostMarkup: buildConfigFieldSetter(
        setState,
        "operationCostMarkup",
      ),
      setCustomOperationCosts: buildConfigFieldSetter(
        setState,
        "customOperationCosts",
      ),
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
