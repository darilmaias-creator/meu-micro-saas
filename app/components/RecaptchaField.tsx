"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          sitekey: string;
        },
      ) => number;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

type RecaptchaFieldProps = {
  action?: string;
  onTokenChange: (token: string | null) => void;
  siteKey?: string;
};

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v2-script";
const RECAPTCHA_TIMEOUT_MS = 10_000;

function loadRecaptchaScript() {
  const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.id = RECAPTCHA_SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src =
    "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
  document.head.appendChild(script);
}

export function RecaptchaField({
  onTokenChange,
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
}: RecaptchaFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    siteKey ? "loading" : "ready",
  );

  useEffect(() => {
    let isMounted = true;

    onTokenChange(null);

    if (!siteKey) {
      return undefined;
    }

    const renderCheckbox = () => {
      if (
        !isMounted ||
        !containerRef.current ||
        !window.grecaptcha ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      window.clearTimeout(timeout);

      try {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            onTokenChange(token);
            setStatus("ready");
          },
          "expired-callback": () => {
            onTokenChange(null);
          },
          "error-callback": () => {
            onTokenChange(null);
            setStatus("error");
          },
        });
        setStatus("ready");
      } catch {
        onTokenChange(null);
        setStatus("error");
      }
    };

    const timeout = window.setTimeout(() => {
      if (isMounted && widgetIdRef.current === null) {
        onTokenChange(null);
        setStatus("error");
      }
    }, RECAPTCHA_TIMEOUT_MS);

    window.onRecaptchaLoad = renderCheckbox;
    loadRecaptchaScript();

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderCheckbox);
    }

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);

      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }

      widgetIdRef.current = null;
      onTokenChange(null);
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      {status === "loading" && (
        <p className="text-xs text-slate-500">
          Carregando verificação de segurança...
        </p>
      )}
      {status === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          Não foi possível carregar o reCAPTCHA agora. Atualize a página e
          tente novamente.
        </p>
      )}
    </div>
  );
}
