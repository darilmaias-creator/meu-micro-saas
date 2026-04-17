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
    id: "/",
    name: PWA_APP_NAME,
    short_name: PWA_APP_SHORT_NAME,
    description: PWA_APP_DESCRIPTION,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
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
      {
        src: "/screenshots/vendas.png",
        sizes: "733x286",
        type: "image/png",
        form_factor: "wide",
        label: "Tela de vendas, orcamentos e propostas",
      },
    ],
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
