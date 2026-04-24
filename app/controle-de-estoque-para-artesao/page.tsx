import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("controle-de-estoque-para-artesao");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/controle-de-estoque-para-artesao",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/controle-de-estoque-para-artesao",
    siteName: "Calculadora do Produtor",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: content.metadataTitle,
    description: content.metadataDescription,
  },
};

export default function ControleDeEstoqueParaArtesaoPage() {
  return <SearchIntentPage content={content} />;
}
