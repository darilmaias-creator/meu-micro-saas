"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

import PwaRegister from "./PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      {children}
    </SessionProvider>
  );
}
