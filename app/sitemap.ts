import type { MetadataRoute } from "next";

import { SEARCH_INTENT_PAGES } from "./apresentacao/search-intents";

const SITE_URL = "https://calculaartesao.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/politicas/cancelamento-e-reembolso`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politicas/privacidade`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...SEARCH_INTENT_PAGES.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
