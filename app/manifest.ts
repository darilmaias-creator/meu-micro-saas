import type { MetadataRoute } from "next";

import {
  PWA_BACKGROUND_COLOR,
  PWA_APP_DESCRIPTION,
  PWA_APP_NAME,
  PWA_APP_SHORT_NAME,
  PWA_ICON_VERSION,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

const APP_ICON_URL = `/android-chrome-512x512.png?v=${PWA_ICON_VERSION}`;
const APP_ICON_192_URL = `/android-chrome-192x192.png?v=${PWA_ICON_VERSION}`;
const APPLE_ICON_URL = `/icone-180x180.png?v=${PWA_ICON_VERSION}`;
const APPLE_ICON_LEGACY_URL = `/apple-touch-icon.png?v=${PWA_ICON_VERSION}`;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PWA_APP_NAME,
    short_name: PWA_APP_SHORT_NAME,
    description: PWA_APP_DESCRIPTION,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/entrar",
    scope: "/",
    display: "standalone",
    display_override: [
      "standalone",
      "minimal-ui",
      "window-controls-overlay",
    ],
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    prefer_related_applications: false,
    categories: ["business", "finance", "productivity"],
    screenshots: [
      {
        src: "/screenshots/login.png",
        sizes: "380x824",
        type: "image/png",
        form_factor: "narrow",
        label: "Tela de login da Calculadora do Produtor",
      },
      {
        src: "/screenshots/estoque.png",
        sizes: "957x844",
        type: "image/png",
        form_factor: "wide",
        label: "Tela de estoque com cadastro de materiais",
      },
      {
        src: "/screenshots/fichatecnica.png",
        sizes: "712x872",
        type: "image/png",
        form_factor: "wide",
        label: "Tela de ficha tecnica e precificacao de produtos",
      },
    ],
    icons: [
      {
        src: APP_ICON_192_URL,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_URL,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_URL,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: APPLE_ICON_URL,
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: APPLE_ICON_LEGACY_URL,
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Meus Materiais",
        short_name: "Materiais",
        description: "Abra direto o cadastro e controle dos materiais.",
        url: "/estoque",
      },
      {
        name: "Calcular Preço",
        short_name: "Preço",
        description: "Abra direto a área para montar e precificar produtos.",
        url: "/ficha-tecnica",
      },
      {
        name: "Orçamentos e Vendas",
        short_name: "Vendas",
        description: "Abra direto a área de orçamentos e vendas.",
        url: "/vendas",
      },
      {
        name: "Resumo",
        short_name: "Resumo",
        description: "Abra direto o resumo geral do negocio.",
        url: "/dashboard",
      },
    ],
  };
}
