import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("como-nao-vender-no-prejuizo");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/como-nao-vender-no-prejuizo",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/como-nao-vender-no-prejuizo",
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

export default function ComoNaoVenderNoPrejuizoPage() {
  return <SearchIntentPage content={content} />;
}
