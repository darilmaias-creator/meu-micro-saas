"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (
        siteKey: string,
        options: {
          action: string;
        },
      ) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

type RecaptchaFieldProps = {
  action: string;
  onTokenChange: (token: string | null) => void;
  siteKey?: string;
};

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v3-script";

function loadRecaptchaScript(siteKey: string) {
  const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.id = RECAPTCHA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  document.head.appendChild(script);
}

export function RecaptchaField({
  action,
  onTokenChange,
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
}: RecaptchaFieldProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    siteKey ? "loading" : "ready",
  );

  useEffect(() => {
    let isMounted = true;

    onTokenChange(null);

    if (!siteKey) {
      setStatus("ready");
      return undefined;
    }

    loadRecaptchaScript(siteKey);

    const timeout = window.setTimeout(() => {
      if (isMounted) {
        setStatus("error");
      }
    }, 10_000);

    const interval = window.setInterval(() => {
      if (!window.grecaptcha) {
        return;
      }

      window.clearInterval(interval);
      window.clearTimeout(timeout);

      window.grecaptcha.ready(() => {
        window.grecaptcha
          ?.execute(siteKey, { action })
          .then((token) => {
            if (!isMounted) {
              return;
            }

            onTokenChange(token);
            setStatus("ready");
          })
          .catch(() => {
            if (!isMounted) {
              return;
            }

            onTokenChange(null);
            setStatus("error");
          });
      });
    }, 250);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      onTokenChange(null);
    };
  }, [action, onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
      {status === "loading"
        ? "Verificando segurança do formulário..."
        : status === "error"
          ? "Não foi possível validar o reCAPTCHA agora. Atualize a página e tente novamente."
          : "Formulário protegido por reCAPTCHA."}
    </div>
  );
}
