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
        name: "Meus Materiais",
        short_name: "Materiais",
        description: "Abra direto o cadastro e controle dos materiais.",
        url: "/estoque",
      },
      {
        name: "Calcular Preco",
        short_name: "Preco",
        description: "Abra direto a area para montar e precificar produtos.",
        url: "/ficha-tecnica",
      },
      {
        name: "Orcamento e Venda",
        short_name: "Vendas",
        description: "Abra direto a area de orcamentos e vendas.",
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
