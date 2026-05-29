"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

import type { ActiveTab } from "../lib/app-tabs";
import AuthenticatedAppShell from "./AuthenticatedAppShell";

type ProtectedSectionAppProps = {
  initialTab: ActiveTab;
};

const OFFLINE_SESSION_STORAGE_KEY = "calcula-artesao:last-session";

function readOfflineSession() {
  if (typeof window === "undefined" || navigator.onLine) {
    return null;
  }

  try {
    const storedSession = window.localStorage.getItem(
      OFFLINE_SESSION_STORAGE_KEY,
    );

    return storedSession ? (JSON.parse(storedSession) as Session) : null;
  } catch {
    return null;
  }
}

export default function ProtectedSectionApp({
  initialTab,
}: ProtectedSectionAppProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [offlineSession, setOfflineSession] = useState<Session | null>(() =>
    readOfflineSession(),
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setOfflineSession(readOfflineSession());
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (session) {
      try {
        window.localStorage.setItem(
          OFFLINE_SESSION_STORAGE_KEY,
          JSON.stringify(session),
        );
      } catch {
        // Offline session is best-effort only.
      }
    }
  }, [session]);

  useEffect(() => {
    if (status !== "unauthenticated" || !isOnline) {
      return;
    }

    const nextPath = pathname && pathname !== "/" ? pathname : "/estoque";
    window.location.assign(
      `/entrar?auth=required&next=${encodeURIComponent(nextPath)}`,
    );
  }, [isOnline, pathname, status]);

  const activeSession = session ?? (!isOnline ? offlineSession : null);

  if ((status === "loading" && !activeSession) || !activeSession) {
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
      key={`${activeSession.user.id}:${initialTab}`}
      session={activeSession}
      initialTab={initialTab}
    />
  );
}
