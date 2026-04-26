import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("calculadora-para-biscuit");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/calculadora-para-biscuit",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/calculadora-para-biscuit",
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

export default function CalculadoraParaBiscuitPage() {
  return <SearchIntentPage content={content} />;
}
