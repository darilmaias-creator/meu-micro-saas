import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";
import {
  PWA_APP_DESCRIPTION,
  PWA_APP_NAME,
  PWA_ICON_VERSION,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

const APP_ICON_URL = `/icon?v=${PWA_ICON_VERSION}`;
const APPLE_ICON_URL = `/apple-icon?v=${PWA_ICON_VERSION}`;
const APP_MASKABLE_ICON_URL = `/pwa-maskable-512.png?v=${PWA_ICON_VERSION}`;
const SITE_URL = "https://calculaartesao.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: PWA_APP_NAME,
    template: `%s | ${PWA_APP_NAME}`,
  },
  description: PWA_APP_DESCRIPTION,
  applicationName: PWA_APP_NAME,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    shortcut: [
      {
        url: APP_ICON_URL,
        type: "image/png",
      },
    ],
    icon: [
      {
        url: APP_ICON_URL,
        type: "image/png",
      },
      {
        url: APP_MASKABLE_ICON_URL,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: APPLE_ICON_URL,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
