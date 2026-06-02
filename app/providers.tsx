"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

import AppModeBridge from "./AppModeBridge";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import PwaRegister from "./PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      <AppModeBridge />
      {children}
      <CookieConsentBanner />
    </SessionProvider>
  );
}
