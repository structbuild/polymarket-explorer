import type { MetadataRoute } from "next";

import { getSiteUrl, hasStructConfig } from "@/lib/env";
import { getFeaturedMarkets } from "@/lib/struct/queries";

export const runtime = "nodejs";
export const revalidate = 300;

function getLastModified(value: string | null): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl().origin;
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];

  if (!hasStructConfig()) {
    return routes;
  }

  const markets = await getFeaturedMarkets();

  return [
    ...routes,
    ...markets.map((market) => ({
      url: `${siteUrl}/markets/${market.slug}`,
      lastModified: getLastModified(market.endDate),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}

