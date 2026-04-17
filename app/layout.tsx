import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";
import {
  PWA_APP_DESCRIPTION,
  PWA_APP_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

export const metadata: Metadata = {
  title: {
    default: PWA_APP_NAME,
    template: `%s | ${PWA_APP_NAME}`,
  },
  description: PWA_APP_DESCRIPTION,
  applicationName: PWA_APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    shortcut: [
      {
        url: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    icon: [
      {
        url: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon",
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
