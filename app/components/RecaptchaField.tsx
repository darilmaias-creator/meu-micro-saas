"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          callback: (token: string) => void;
          "expired-callback": () => void;
          sitekey: string;
        },
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

type RecaptchaFieldProps = {
  onTokenChange: (token: string | null) => void;
  siteKey?: string;
};

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-script";

function loadRecaptchaScript() {
  const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.id = RECAPTCHA_SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
  document.head.appendChild(script);
}

export function RecaptchaField({
  onTokenChange,
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
}: RecaptchaFieldProps) {
  const fallbackId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onTokenChange(null);

    if (!siteKey) {
      return undefined;
    }

    loadRecaptchaScript();

    const interval = window.setInterval(() => {
      if (window.grecaptcha && containerRef.current) {
        window.clearInterval(interval);
        setIsReady(true);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
      onTokenChange(null);
    };
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (!isReady || !siteKey || !containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";
    widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      sitekey: siteKey,
    });
  }, [isReady, onTokenChange, siteKey]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null) {
        window.grecaptcha?.reset(widgetIdRef.current);
      }
    };
  }, []);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div
        id={`recaptcha-${fallbackId}`}
        ref={containerRef}
        className="min-h-[78px]"
      />
    </div>
  );
}
