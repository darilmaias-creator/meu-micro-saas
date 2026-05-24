"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "calcula-artesao-cookie-consent-v1";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsVisible(
        window.localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted",
      );
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  function acceptCookies() {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl md:left-auto md:right-4 md:max-w-md">
      <p className="text-sm font-bold text-slate-900">Uso de cookies</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        Usamos cookies essenciais para login, segurança e funcionamento do app.
        Ao continuar, voce concorda com a nossa{" "}
        <Link
          href="/politicas/privacidade"
          className="font-bold text-amber-700 underline"
        >
          Politica de Privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={acceptCookies}
          className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
