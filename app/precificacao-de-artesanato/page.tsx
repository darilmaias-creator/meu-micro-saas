import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage("precificacao-de-artesanato");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/precificacao-de-artesanato",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/precificacao-de-artesanato",
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

export default function PrecificacaoDeArtesanatoPage() {
  return <SearchIntentPage content={content} />;
}
