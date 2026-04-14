"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  Calculator,
  Crown,
  LogOut,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import CalculatorTab from "./CalculatorTab";
import DashboardTab from "./DashboardTab";
import InventoryTab from "./InventoryTab";
import ProfileModal from "./ProfileModal";
import SalesTab from "./SalesTab";
import { useAppData } from "./hooks/useAppData";
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
    icon: Calculator,
    id: "calculator",
    label: "Calcular Preco",
  },
  {
    icon: ShoppingBag,
    id: "sales",
    label: "Orcamento e Venda",
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

  if (!appData.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">
          Sincronizando banco de dados...
        </p>
      </div>
    );
  }

  const activeTab = initialTab;
  const isPremium = session.user.isPremium;
  const displayHeaderAvatar = isPremium ? session.user?.image : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 relative overflow-x-hidden">
      <div className="bg-amber-600 text-white py-4 shadow-md sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Calculator size={28} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight drop-shadow-sm">
                  Calculadora do Produtor
                </h1>
                <span className="text-xs text-amber-200 uppercase tracking-wider font-bold">
                  Orçamentos claros. Clientes seguros. Negócios fechados.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/politicas/cancelamento-e-reembolso"
                className="hidden rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50 md:inline-flex"
              >
                Politica Premium
              </Link>
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 text-sm bg-amber-700/30 px-3 py-1.5 rounded-full hover:bg-amber-700/45 transition-colors"
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
                className="bg-amber-700/50 hover:bg-amber-800 p-2 rounded-lg transition-colors text-amber-100 hover:text-white"
                title="Sair da Conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <nav className="flex bg-amber-700/50 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "inventory" && (
          <InventoryTab
            insumos={appData.insumos}
            setInsumos={appData.setInsumos}
            unit={appData.config.unit}
            isPremium={isPremium}
          />
        )}

        {activeTab === "calculator" && (
          <CalculatorTab appData={appData} isPremium={isPremium} />
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
    </div>
  );
}
