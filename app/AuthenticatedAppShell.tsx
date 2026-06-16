"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  Calculator,
  Crown,
  DollarSign,
  Lightbulb,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import CalculatorTab from "./CalculatorTab";
import DashboardTab from "./DashboardTab";
import GlobalAnnouncementBanner from "./GlobalAnnouncementBanner";
import InventoryTab from "./InventoryTab";
import OperationCostsTab from "./OperationCostsTab";
import ProfileModal from "./ProfileModal";
import SalesTab from "./SalesTab";
import AppHelpAssistant from "./AppHelpAssistant";
import { ActivityTracker } from "./components/ActivityTracker";
import EmailVerificationNotice from "./components/EmailVerificationNotice";
import { OfflineSyncBanner } from "./components/OfflineSyncBanner";
import { SuggestionModal } from "./components/SuggestionModal";
import OnboardingGuide from "./onboarding/OnboardingGuide";
import { useAppData } from "./hooks/useAppData";
import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";
import { buildAssistantContext } from "@/lib/assistant-context";
import type { ActiveTab } from "../lib/app-tabs";
import { getPathForActiveTab } from "../lib/app-tabs";

type AuthenticatedAppShellProps = {
  initialTab: ActiveTab;
  session: Session;
};

const TAB_ITEMS = [
  {
    icon: Package,
    id: "inventory",
    label: "Meus Materiais",
  },
  {
    icon: DollarSign,
    id: "operationCosts",
    label: "Gastos do Negocio",
  },
  {
    icon: Calculator,
    id: "calculator",
    label: "Calcular Preço",
  },
  {
    icon: ShoppingBag,
    id: "sales",
    label: "Orçamentos e Vendas",
  },
  {
    icon: BarChart2,
    id: "dashboard",
    label: "Resumo",
  },
] satisfies {
  icon: typeof Calculator;
  id: ActiveTab;
  label: string;
}[];
const OFFLINE_SESSION_STORAGE_KEY = "calcula-artesao:last-session";
const CACHE_APP_ROUTES_MESSAGE_TYPE = "CALC_ARTESAO_CACHE_APP_ROUTES";
const OFFLINE_APP_ROUTES = [
  "/estoque",
  "/custos-operacao",
  "/ficha-tecnica",
  "/vendas",
  "/dashboard",
  "/meu-negocio",
];

export default function AuthenticatedAppShell({
  initialTab,
  session,
}: AuthenticatedAppShellProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const appData = useAppData(session.user.id);

  const activeTab = initialTab;
  const isPremium = session.user.isPremium;
  const shouldShowEmailVerificationNotice = Boolean(
    session.user.email && !session.user.emailVerifiedAt,
  );
  const displayHeaderAvatar = isPremium ? session.user?.image : null;
  const assistantContext = buildAssistantContext(session, {
    config: appData.config,
    insumos: appData.insumos,
    savedProducts: appData.savedProducts,
    sales: appData.sales,
    quotes: appData.quotes,
  });
  const isOffline = appData.syncStatus === "offline";

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !navigator.onLine
    ) {
      return;
    }

    void navigator.serviceWorker.ready
      .then((registration) => {
        registration.active?.postMessage({
          type: CACHE_APP_ROUTES_MESSAGE_TYPE,
          routes: OFFLINE_APP_ROUTES,
        });
      })
      .catch(() => undefined);
  }, [session.user.id]);

  if (!appData.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">
          Sincronizando banco de dados...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent pb-24 font-sans text-slate-800 md:pb-12">
      <ActivityTracker />
      <div className="app-safe-top sticky top-0 z-40 bg-amber-600/95 text-white shadow-md backdrop-blur-xl">
        <div className="app-shell-surface mx-auto max-w-6xl rounded-b-[30px] bg-amber-600 px-4 pb-4 pt-3 md:rounded-b-3xl md:pt-4">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm md:h-20 md:w-20">
                <img
                  src={DEFAULT_STORE_LOGO}
                  alt="Logo da Calcula Artesão"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight drop-shadow-sm">
                  Calcula Artesão
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
                  Orçamentos claros. Clientes seguros. Negócios fechados.
                </span>
              </div>
            </div>
            {session?.user?.isPremium && session?.user?.premiumTrialExpiresAt && (
              <div className="text-sm text-amber-100">
                Premium Trial:{" "}
                {Math.ceil(
                  (new Date(session.user.premiumTrialExpiresAt).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                dias restantes
              </div>
            )}

            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end md:gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Link
                  href="/meu-negocio"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50"
                >
                  <Store size={14} />
                  Meu Negócio
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSuggestionOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50"
                >
                  <Lightbulb size={14} />
                  Sugestões
                </button>
                <Link
                  href="/politicas/cancelamento-e-reembolso"
                  className="hidden rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50 md:inline-flex"
                >
                  Política Premium
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 rounded-full bg-amber-700/30 px-3 py-1.5 text-sm transition-colors hover:bg-amber-700/45"
              >
                {displayHeaderAvatar ? (
                  <img
                    src={displayHeaderAvatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-amber-300 object-cover bg-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-amber-300 bg-white flex items-center justify-center">
                    <UserRound size={16} className="text-slate-400" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <span className="block font-bold text-amber-50 leading-tight">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-amber-100/90">
                    <Crown size={10} />
                    {isPremium ? "Premium" : "Gratis"}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  window.localStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY);
                  void signOut();
                }}
                className="rounded-lg bg-amber-700/50 p-2 text-amber-100 transition-colors hover:bg-amber-800 hover:text-white"
                title="Sair da Conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <nav className="hidden max-w-full overflow-x-auto rounded-2xl bg-amber-700/50 p-1 no-scrollbar md:flex">
            {TAB_ITEMS.map((tabItem) => {
              const Icon = tabItem.icon;
              const tabPath = getPathForActiveTab(tabItem.id);
              const tabClassName = `px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tabItem.id
                  ? "bg-white text-amber-700 shadow"
                  : "text-amber-50 hover:bg-amber-700"
              }`;
              const tabContent = (
                <>
                  <Icon size={16} />
                  {tabItem.label}
                </>
              );

              return isOffline ? (
                <a key={tabItem.id} href={tabPath} className={tabClassName}>
                  {tabContent}
                </a>
              ) : (
                <Link
                  key={tabItem.id}
                  href={tabPath}
                  className={tabClassName}
                >
                  {tabContent}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <GlobalAnnouncementBanner userId={session.user.id} />
      <OfflineSyncBanner syncStatus={appData.syncStatus} />
      {shouldShowEmailVerificationNotice && session.user.email && (
        <EmailVerificationNotice email={session.user.email} />
      )}

      <main className="mx-auto max-w-6xl px-4 py-5 md:py-6">
        {activeTab === "inventory" && (
          <InventoryTab
            insumos={appData.insumos}
            setInsumos={appData.setInsumos}
            unit={appData.config.unit}
            setUnit={appData.config.setUnit}
            isPremium={isPremium}
          />
        )}

        {activeTab === "calculator" && (
          <CalculatorTab appData={appData} isPremium={isPremium} />
        )}

        {activeTab === "operationCosts" && (
          <OperationCostsTab appData={appData} isPremium={isPremium} />
        )}

        {activeTab === "sales" && (
          <SalesTab appData={appData} isPremium={isPremium} />
        )}

        {activeTab === "dashboard" && (
          <DashboardTab appData={appData} isPremium={isPremium} />
        )}
      </main>

      <OnboardingGuide userId={session.user.id} activeTab={activeTab} />
      <AppHelpAssistant
        activeTab={activeTab}
        assistantContext={assistantContext}
      />
      <SuggestionModal
        activeTab={activeTab}
        isOpen={isSuggestionOpen}
        onClose={() => setIsSuggestionOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onRestoreAppData={appData.replaceAllData}
      />

      <nav className="app-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {TAB_ITEMS.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            const tabPath = getPathForActiveTab(tabItem.id);
            const tabClassName = `flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-bold transition-all ${
              isActive
                ? "bg-amber-50 text-amber-700 shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`;
            const tabContent = (
              <>
                <Icon size={18} />
                <span className="text-center leading-tight">
                  {tabItem.id === "inventory"
                    ? "Materiais"
                    : tabItem.id === "operationCosts"
                      ? "Gastos"
                    : tabItem.id === "calculator"
                      ? "Preco"
                      : tabItem.id === "sales"
                        ? "Vendas"
                        : "Resumo"}
                </span>
              </>
            );

            return isOffline ? (
              <a key={tabItem.id} href={tabPath} className={tabClassName}>
                {tabContent}
              </a>
            ) : (
              <Link
                key={tabItem.id}
                href={tabPath}
                className={tabClassName}
              >
                {tabContent}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
