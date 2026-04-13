import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import {
	getAllMarketSlugs,
	getAllTags,
	getGlobalLeaderboard,
} from "@/lib/struct/market-queries";
import { normalizeWalletAddress } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getSiteUrl().origin;

	const [tags, marketSlugs, { data: traders }] = await Promise.all([
		getAllTags(),
		getAllMarketSlugs(),
		getGlobalLeaderboard("lifetime", 200),
	]);

	const tagsWithSlug = tags.filter((tag) => tag.slug);
	const tagPageCount = getPageCount(tagsWithSlug.length, TAGS_PAGE_SIZE);

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: siteUrl,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 1,
		},
		{
			url: `${siteUrl}/markets`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/traders`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/rewards`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.7,
		},
		{
			url: `${siteUrl}/tags`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		},
	];

	const tagEntries: MetadataRoute.Sitemap = tagsWithSlug.map((tag) => ({
		url: `${siteUrl}/tags/${tag.slug}`,
		lastModified: new Date(),
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	const tagPageEntries: MetadataRoute.Sitemap = Array.from(
		{ length: tagPageCount - 1 },
		(_, i) => ({
			url: `${siteUrl}/tags/page/${i + 2}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.5,
		}),
	);

	const marketEntries: MetadataRoute.Sitemap = marketSlugs.map((entry) => ({
		url: `${siteUrl}/markets/${entry.slug}`,
		lastModified: entry.lastModified,
		changeFrequency: "daily" as const,
		priority: 0.8,
	}));

	const traderEntries: MetadataRoute.Sitemap = traders
		.map((entry) => {
			const address = normalizeWalletAddress(entry.trader.address);
			if (!address) return null;
			return {
				url: `${siteUrl}/traders/${address}`,
				lastModified: new Date(),
				changeFrequency: "daily" as const,
				priority: 0.6,
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

	return [
		...staticEntries,
		...tagEntries,
		...tagPageEntries,
		...marketEntries,
		...traderEntries,
	];
}
