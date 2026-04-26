import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage(
  "calculadora-para-papelaria-personalizada",
);

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/calculadora-para-papelaria-personalizada",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/calculadora-para-papelaria-personalizada",
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

export default function CalculadoraParaPapelariaPersonalizadaPage() {
  return <SearchIntentPage content={content} />;
}
