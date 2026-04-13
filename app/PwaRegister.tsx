"use client";

import { useEffect } from "react";

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

export default function PwaRegister() {
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

  return null;
}
