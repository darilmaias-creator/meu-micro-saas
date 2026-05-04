"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Calculator,
  CheckCircle2,
  Crown,
  DollarSign,
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
import InventoryTab from "./InventoryTab";
import OperationCostsTab from "./OperationCostsTab";
import ProfileModal from "./ProfileModal";
import SalesTab from "./SalesTab";
import { useAppData } from "./hooks/useAppData";
import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";
import type { ActiveTab } from "../lib/app-tabs";
import { getPathForActiveTab } from "../lib/app-tabs";

type AuthenticatedAppShellProps = {
  initialTab: ActiveTab;
  session: Session;
};

const getSetupOnboardingStorageKey = (userId: string) =>
  `calcula-artesao:setup-onboarding-completed:${userId}`;

const TAB_ITEMS = [
  {
    icon: Package,
    id: "inventory",
    label: "Meus Materiais",
  },
  {
    icon: DollarSign,
    id: "operationCosts",
    label: "Custos da Operacao",
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

export default function AuthenticatedAppShell({
  initialTab,
  session,
}: AuthenticatedAppShellProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const appData = useAppData(session.user.id);

  const activeTab = initialTab;
  const isPremium = session.user.isPremium;
  const displayHeaderAvatar = isPremium ? session.user?.image : null;
  const setupSteps = [
    {
      id: "insumo",
      label: "Cadastre seu primeiro insumo",
      description:
        "Comece em Meus Materiais. Adicione nome, preço e estoque para o app calcular corretamente.",
      href: getPathForActiveTab("inventory"),
      isDone: appData.insumos.length > 0,
    },
    {
      id: "ficha-tecnica",
      label: "Monte sua primeira ficha técnica",
      description:
        "Na aba Calcular Preço, salve um produto para transformar custo em preço sugerido.",
      href: getPathForActiveTab("calculator"),
      isDone: appData.savedProducts.length > 0,
    },
    {
      id: "orcamento",
      label: "Gere seu primeiro orçamento",
      description:
        "Em Orçamentos e Vendas, gere o primeiro orçamento para já validar o fluxo de venda.",
      href: getPathForActiveTab("sales"),
      isDone: appData.quotes.length > 0 || appData.sales.length > 0,
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.isDone).length;
  const setupProgressPercent = Math.round(
    (completedSetupSteps / setupSteps.length) * 100,
  );
  const setupOnboardingStorageKey = getSetupOnboardingStorageKey(
    session.user.id,
  );
  const hasCompletedSetupOnce =
    typeof window !== "undefined" &&
    window.localStorage.getItem(setupOnboardingStorageKey) === "1";

  useEffect(() => {
    if (completedSetupSteps < setupSteps.length || hasCompletedSetupOnce) {
      return;
    }

    window.localStorage.setItem(setupOnboardingStorageKey, "1");
  }, [
    completedSetupSteps,
    hasCompletedSetupOnce,
    setupOnboardingStorageKey,
    setupSteps.length,
  ]);

  const shouldShowSetupOnboarding =
    !hasCompletedSetupOnce &&
    completedSetupSteps < setupSteps.length;

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
      <div className="app-safe-top sticky top-0 z-40 bg-amber-600/95 text-white shadow-md backdrop-blur-xl">
        <div className="app-shell-surface mx-auto max-w-6xl rounded-b-[30px] bg-amber-600 px-4 pb-4 pt-3 md:rounded-b-3xl md:pt-4">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm md:h-20 md:w-28">
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

            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end md:gap-4">
              <Link
                href="/meu-negocio"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50"
              >
                <Store size={14} />
                Meu Negocio
              </Link>
              <Link
                href="/politicas/cancelamento-e-reembolso"
                className="hidden rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50 md:inline-flex"
              >
                Politica Premium
              </Link>
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
                onClick={() => signOut()}
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

              return (
                <Link
                  key={tabItem.id}
                  href={getPathForActiveTab(tabItem.id)}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tabItem.id
                      ? "bg-white text-amber-700 shadow"
                      : "text-amber-50 hover:bg-amber-700"
                  }`}
                >
                  <Icon size={16} />
                  {tabItem.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5 md:py-6">
        {shouldShowSetupOnboarding && (
          <section className="mb-6 rounded-[28px] border border-amber-200/70 bg-white px-4 py-4 shadow-sm md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Setup inicial guiado
              </p>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                {completedSetupSteps}/{setupSteps.length} concluídos
              </span>
            </div>

            <h2 className="mt-2 text-xl font-black text-slate-900 md:text-2xl">
              Complete seu setup em 3 passos
            </h2>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Assim você passa da configuração para o primeiro orçamento sem se
              perder.
            </p>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${setupProgressPercent}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {setupSteps.map((step, index) => (
                <article
                  key={step.id}
                  className={`rounded-2xl border p-3.5 ${
                    step.isDone
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                        step.isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {step.isDone ? <CheckCircle2 size={14} /> : index + 1}
                    </div>
                    {step.isDone && (
                      <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                        Concluído
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-900 md:text-base">
                    {step.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 md:text-sm">
                    {step.description}
                  </p>
                  {step.isDone ? (
                    <p className="mt-3 text-xs font-bold text-emerald-700">
                      Etapa finalizada.
                    </p>
                  ) : (
                    <Link
                      href={step.href}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm ring-1 ring-amber-200 transition-colors hover:bg-amber-50"
                    >
                      Ir para esta etapa
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

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

        {activeTab === "dashboard" && <DashboardTab appData={appData} />}
      </main>

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

            return (
              <Link
                key={tabItem.id}
                href={getPathForActiveTab(tabItem.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-amber-50 text-amber-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon size={18} />
                <span className="text-center leading-tight">
                  {tabItem.id === "inventory"
                    ? "Materiais"
                    : tabItem.id === "operationCosts"
                      ? "Custos"
                    : tabItem.id === "calculator"
                      ? "Preco"
                      : tabItem.id === "sales"
                        ? "Vendas"
                        : "Resumo"}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
