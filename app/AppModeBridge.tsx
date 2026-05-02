"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator } from "lucide-react";

import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";

const DISPLAY_MODE_QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
];

function isInstalledAppMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const isStandaloneNavigator =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  const matchesDisplayMode = DISPLAY_MODE_QUERIES.some((query) =>
    window.matchMedia(query).matches,
  );

  return (
    isStandaloneNavigator ||
    matchesDisplayMode ||
    document.referrer.startsWith("android-app://")
  );
}

function syncInstalledAppClass(isInstalledApp: boolean) {
  document.documentElement.classList.toggle("app-installed", isInstalledApp);
  document.body.classList.toggle("app-installed", isInstalledApp);
}

export default function AppModeBridge() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(false);
  const launchTimeoutRef = useRef<number | null>(null);
  const hasHandledInitialModeRef = useRef(false);

  useEffect(() => {
    const mediaQueries = DISPLAY_MODE_QUERIES.map((query) =>
      window.matchMedia(query),
    );

    const handleModeChange = () => {
      const isInstalledApp = isInstalledAppMode();

      syncInstalledAppClass(isInstalledApp);

      if (!isInstalledApp) {
        setShowLaunchScreen(false);
        return;
      }

      if (!hasHandledInitialModeRef.current) {
        hasHandledInitialModeRef.current = true;
        setShowLaunchScreen(true);

        if (launchTimeoutRef.current !== null) {
          window.clearTimeout(launchTimeoutRef.current);
        }

        launchTimeoutRef.current = window.setTimeout(() => {
          setShowLaunchScreen(false);
        }, 1650);
      }
    };

    handleModeChange();

    mediaQueries.forEach((query) => {
      query.addEventListener("change", handleModeChange);
    });

    window.addEventListener("appinstalled", handleModeChange);

    return () => {
      mediaQueries.forEach((query) => {
        query.removeEventListener("change", handleModeChange);
      });
      window.removeEventListener("appinstalled", handleModeChange);

      if (launchTimeoutRef.current !== null) {
        window.clearTimeout(launchTimeoutRef.current);
      }
    };
  }, []);

  if (!showLaunchScreen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(253,230,138,0.95),_rgba(255,255,255,0.98)_52%,_rgba(248,250,252,1)_100%)] px-6">
      <div className="w-full max-w-xs rounded-[32px] border border-white/80 bg-white/90 px-6 py-7 text-center shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-24 w-40 items-center justify-center rounded-[24px] bg-amber-50 p-2 shadow-inner">
          <img
            src={DEFAULT_STORE_LOGO}
            alt="Logo da Calcula Artesão"
            className="h-full w-full rounded-2xl object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-800">
          <Calculator size={12} />
          Abrindo app
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
          Calcula Artesão
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Estoque, ficha tecnica e vendas em um unico lugar.
        </p>
      </div>
    </div>
  );
}
