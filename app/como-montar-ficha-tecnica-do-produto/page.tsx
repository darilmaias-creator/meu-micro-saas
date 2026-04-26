import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage(
  "como-montar-ficha-tecnica-do-produto",
);

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/como-montar-ficha-tecnica-do-produto",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/como-montar-ficha-tecnica-do-produto",
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

export default function ComoMontarFichaTecnicaDoProdutoPage() {
  return <SearchIntentPage content={content} />;
}
