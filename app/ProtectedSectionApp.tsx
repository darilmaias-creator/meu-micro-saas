"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import type { ActiveTab } from "../lib/app-tabs";
import AuthenticatedAppShell from "./AuthenticatedAppShell";

type ProtectedSectionAppProps = {
  initialTab: ActiveTab;
};

export default function ProtectedSectionApp({
  initialTab,
}: ProtectedSectionAppProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const nextPath = pathname && pathname !== "/" ? pathname : "/estoque";
    window.location.assign(
      `/entrar?auth=required&next=${encodeURIComponent(nextPath)}`,
    );
  }, [pathname, status]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">
          Carregando aplicação...
        </p>
      </div>
    );
  }

  return (
    <AuthenticatedAppShell
      key={`${session.user.id}:${initialTab}`}
      session={session}
      initialTab={initialTab}
    />
  );
}
