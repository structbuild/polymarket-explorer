import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { getLeaderboard } from "@/lib/polymarket/leaderboard";
import { normalizeWalletAddress } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl().origin;

  const leaderboard = await getLeaderboard();

  const traderEntries: MetadataRoute.Sitemap = leaderboard.map((entry) => ({
    url: `${siteUrl}/trader/${normalizeWalletAddress(entry.trader.address) ?? entry.trader.address}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...traderEntries,
  ];
}
