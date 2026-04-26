import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage(
  "como-calcular-mao-de-obra-no-artesanato",
);

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/como-calcular-mao-de-obra-no-artesanato",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/como-calcular-mao-de-obra-no-artesanato",
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

export default function ComoCalcularMaoDeObraNoArtesanatoPage() {
  return <SearchIntentPage content={content} />;
}
