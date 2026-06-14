"use client";

import { Cloud, CloudOff, RefreshCw, WifiOff } from "lucide-react";

import type { AppDataSyncStatus } from "@/app/hooks/useAppData";

type OfflineSyncBannerProps = {
  syncStatus: AppDataSyncStatus;
};

const statusConfig: Record<
  AppDataSyncStatus,
  {
    className: string;
    icon: typeof Cloud;
    message: string;
  }
> = {
  error: {
    className: "border-red-200 bg-red-50 text-red-800",
    icon: CloudOff,
    message:
      "Não foi possível sincronizar agora. Seus dados continuam salvos neste aparelho.",
  },
  offline: {
    className: "border-amber-200 bg-amber-50 text-amber-900",
    icon: WifiOff,
    message:
      "Modo offline ativo. Você pode usar a calculadora; as alterações sincronizam quando a internet voltar.",
  },
  pending: {
    className: "border-sky-200 bg-sky-50 text-sky-800",
    icon: RefreshCw,
    message: "Alterações salvas no aparelho. Aguardando sincronização.",
  },
  synced: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: Cloud,
    message: "Dados sincronizados.",
  },
  syncing: {
    className: "border-sky-200 bg-sky-50 text-sky-800",
    icon: RefreshCw,
    message: "Sincronizando seus dados...",
  },
};

export function OfflineSyncBanner({ syncStatus }: OfflineSyncBannerProps) {
  if (syncStatus === "synced") {
    return null;
  }

  const config = statusConfig[syncStatus];
  const Icon = config.icon;

  return (
    <div
      className={`mx-auto mt-4 flex w-[min(1120px,calc(100%-32px))] items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${config.className}`}
    >
      <Icon
        size={18}
        className={syncStatus === "syncing" ? "mt-0.5 animate-spin" : "mt-0.5"}
      />
      <p>{config.message}</p>
    </div>
  );
}
