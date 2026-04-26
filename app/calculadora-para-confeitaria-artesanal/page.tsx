import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage(
  "calculadora-para-confeitaria-artesanal",
);

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/calculadora-para-confeitaria-artesanal",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/calculadora-para-confeitaria-artesanal",
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

export default function CalculadoraParaConfeitariaArtesanalPage() {
  return <SearchIntentPage content={content} />;
}
