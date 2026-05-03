import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("calculadora-para-lacos");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/calculadora-para-lacos",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/calculadora-para-lacos",
    siteName: "Calcula Artesão",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: content.metadataTitle,
    description: content.metadataDescription,
  },
};

export default function CalculadoraParaLacosPage() {
  return <SearchIntentPage content={content} />;
}
