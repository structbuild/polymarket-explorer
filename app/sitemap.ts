import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import {
	getAllMarketSlugs,
	getAllTags,
	getGlobalLeaderboard,
} from "@/lib/struct/market-queries";
import { normalizeWalletAddress } from "@/lib/utils";

export const revalidate = 3600;
export const maxDuration = 60;

const MARKET_CAP = 5000;
const TRADER_CAP = 500;

const STATIC_SHARD = "0";
const TRADERS_SHARD = "1";
const MARKETS_SHARD = "2";

export async function generateSitemaps() {
	return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap(props: {
	id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
	const id = await props.id;
	const siteUrl = getSiteUrl().origin;

	switch (id) {
		case STATIC_SHARD:
			return buildStaticAndTagsShard(siteUrl);
		case TRADERS_SHARD:
			return buildTradersShard(siteUrl);
		case MARKETS_SHARD:
			return buildMarketsShard(siteUrl);
		default:
			return [];
	}
}

async function buildStaticAndTagsShard(
	siteUrl: string,
): Promise<MetadataRoute.Sitemap> {
	const tags = await getAllTags();
	const tagsWithSlug = tags.filter((tag) => tag.slug);
	const tagPageCount = getPageCount(tagsWithSlug.length, TAGS_PAGE_SIZE);

	const staticEntries: MetadataRoute.Sitemap = [
		{ url: siteUrl, changeFrequency: "hourly", priority: 1 },
		{ url: `${siteUrl}/markets`, changeFrequency: "hourly", priority: 0.9 },
		{ url: `${siteUrl}/traders`, changeFrequency: "hourly", priority: 0.9 },
		{ url: `${siteUrl}/rewards`, changeFrequency: "daily", priority: 0.7 },
		{ url: `${siteUrl}/tags`, changeFrequency: "weekly", priority: 0.6 },
	];

	const tagEntries: MetadataRoute.Sitemap = tagsWithSlug.map((tag) => ({
		url: `${siteUrl}/tags/${tag.slug}`,
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	const tagPageEntries: MetadataRoute.Sitemap = Array.from(
		{ length: Math.max(tagPageCount - 1, 0) },
		(_, i) => ({
			url: `${siteUrl}/tags/page/${i + 2}`,
			changeFrequency: "weekly" as const,
			priority: 0.5,
		}),
	);

	return [...staticEntries, ...tagEntries, ...tagPageEntries];
}

async function buildTradersShard(
	siteUrl: string,
): Promise<MetadataRoute.Sitemap> {
	const { data: traders } = await getGlobalLeaderboard("lifetime", TRADER_CAP);

	return traders
		.map((entry) => {
			const address = normalizeWalletAddress(entry.trader.address);
			if (!address) return null;
			return {
				url: `${siteUrl}/traders/${address}`,
				changeFrequency: "daily" as const,
				priority: 0.6,
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

async function buildMarketsShard(
	siteUrl: string,
): Promise<MetadataRoute.Sitemap> {
	const marketSlugs = await getAllMarketSlugs(MARKET_CAP);

	return marketSlugs.map((entry) => ({
		url: `${siteUrl}/markets/${entry.slug}`,
		changeFrequency: "daily" as const,
		priority: 0.8,
	}));
}
