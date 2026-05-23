"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NOTIFICATION_CLICK_MESSAGE_TYPE = "CALC_ARTESAO_NOTIFICATION_CLICK";
const ALLOWED_NOTIFICATION_TARGETS = new Set([
  "/estoque",
  "/vendas",
  "/dashboard",
  "/ficha-tecnica",
  "/custos-operacao",
]);

function canRegisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function normalizeInternalTargetPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const targetUrl = new URL(value, window.location.origin);

    if (targetUrl.origin !== window.location.origin) {
      return null;
    }

    const targetPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    const targetBasePath = targetUrl.pathname;

    return ALLOWED_NOTIFICATION_TARGETS.has(targetBasePath)
      ? targetPath
      : null;
  } catch {
    return null;
  }
}

export default function PwaRegister() {
  const router = useRouter();

  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    const registerServiceWorker = () => {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      }).catch((error) => {
        console.error("[pwa:register]", error);
      });
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const message = event.data as
        | {
            targetPath?: unknown;
            type?: unknown;
          }
        | undefined;

      if (message?.type !== NOTIFICATION_CLICK_MESSAGE_TYPE) {
        return;
      }

      const targetPath = normalizeInternalTargetPath(message.targetPath);

      if (!targetPath) {
        return;
      }

      router.push(targetPath);
      window.focus();
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, [router]);

  return null;
}
