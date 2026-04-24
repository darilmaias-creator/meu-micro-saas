import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("orcamento-para-artesanato");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/orcamento-para-artesanato",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/orcamento-para-artesanato",
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

export default function OrcamentoParaArtesanatoPage() {
  return <SearchIntentPage content={content} />;
}
