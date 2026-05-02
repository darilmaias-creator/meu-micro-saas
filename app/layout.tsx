import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";
import {
  PWA_APP_DESCRIPTION,
  PWA_APP_NAME,
  PWA_ICON_VERSION,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

const FAVICON_16_URL = `/favicon-16x16.png?v=${PWA_ICON_VERSION}`;
const FAVICON_32_URL = `/favicon-32x32.png?v=${PWA_ICON_VERSION}`;
const FAVICON_JPG_URL = `/favicon.jpg?v=${PWA_ICON_VERSION}`;
const APPLE_TOUCH_ICON_URL = `/icone-180x180.png?v=${PWA_ICON_VERSION}`;
const APPLE_TOUCH_ICON_LEGACY_URL = `/apple-touch-icon.png?v=${PWA_ICON_VERSION}`;
const ANDROID_192_ICON_URL = `/android-chrome-192x192.png?v=${PWA_ICON_VERSION}`;
const ANDROID_512_ICON_URL = `/android-chrome-512x512.png?v=${PWA_ICON_VERSION}`;
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
        url: FAVICON_32_URL,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: FAVICON_16_URL,
        sizes: "16x16",
        type: "image/png",
      },
    ],
    icon: [
      {
        url: FAVICON_32_URL,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: FAVICON_16_URL,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: FAVICON_JPG_URL,
        type: "image/jpeg",
      },
      {
        url: ANDROID_192_ICON_URL,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: ANDROID_512_ICON_URL,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: APPLE_TOUCH_ICON_URL,
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: APPLE_TOUCH_ICON_LEGACY_URL,
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
