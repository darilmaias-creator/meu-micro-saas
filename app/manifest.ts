import type { MetadataRoute } from "next";

import {
  PWA_BACKGROUND_COLOR,
  PWA_APP_DESCRIPTION,
  PWA_APP_NAME,
  PWA_APP_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_APP_NAME,
    short_name: PWA_APP_SHORT_NAME,
    description: PWA_APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Ficha Tecnica",
        short_name: "Ficha",
        description: "Abra direto a area de ficha tecnica.",
        url: "/ficha-tecnica",
      },
      {
        name: "Estoque",
        short_name: "Estoque",
        description: "Abra direto o controle de estoque.",
        url: "/estoque",
      },
      {
        name: "Vendas",
        short_name: "Vendas",
        description: "Abra direto a area de vendas.",
        url: "/vendas",
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Abra direto o resumo geral do negocio.",
        url: "/dashboard",
      },
    ],
  };
}
