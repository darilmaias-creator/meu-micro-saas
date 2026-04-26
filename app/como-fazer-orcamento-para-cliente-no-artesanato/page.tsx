import type { Metadata } from "next";

import { SearchIntentPage } from "@/app/apresentacao/SearchIntentPage";
import { getRequiredSearchIntentPage } from "@/app/apresentacao/search-intents";

const content = getRequiredSearchIntentPage(
  "como-fazer-orcamento-para-cliente-no-artesanato",
);

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
  alternates: {
    canonical: "/como-fazer-orcamento-para-cliente-no-artesanato",
  },
  openGraph: {
    title: content.metadataTitle,
    description: content.metadataDescription,
    url: "/como-fazer-orcamento-para-cliente-no-artesanato",
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

export default function ComoFazerOrcamentoParaClienteNoArtesanatoPage() {
  return <SearchIntentPage content={content} />;
}
