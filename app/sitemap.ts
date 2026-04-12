import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import {
	getAllEventSlugs,
	getAllMarketSlugs,
	getAllTags,
	getGlobalLeaderboard,
} from "@/lib/struct/market-queries";
import { normalizeWalletAddress } from "@/lib/utils";

const MARKETS_PER_SEGMENT = 1000;

const SEGMENT_STATIC = 0;
const SEGMENT_EVENTS = 1;
const SEGMENT_TRADERS = 2;
const SEGMENT_MARKETS_START = 3;

export async function generateSitemaps() {
	const marketSlugs = await getAllMarketSlugs();
	const marketSegmentCount = Math.max(1, Math.ceil(marketSlugs.length / MARKETS_PER_SEGMENT));

	const ids: { id: number }[] = [
		{ id: SEGMENT_STATIC },
		{ id: SEGMENT_EVENTS },
		{ id: SEGMENT_TRADERS },
	];

	for (let i = 0; i < marketSegmentCount; i++) {
		ids.push({ id: SEGMENT_MARKETS_START + i });
	}

	return ids;
}

export default async function sitemap({
	id,
}: {
	id: number;
}): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getSiteUrl().origin;

	if (id === SEGMENT_STATIC) {
		return buildStaticSegment(siteUrl);
	}

	if (id === SEGMENT_EVENTS) {
		return buildEventsSegment(siteUrl);
	}

	if (id === SEGMENT_TRADERS) {
		return buildTradersSegment(siteUrl);
	}

	return buildMarketsSegment(siteUrl, id - SEGMENT_MARKETS_START);
}

async function buildStaticSegment(siteUrl: string): Promise<MetadataRoute.Sitemap> {
	const tags = await getAllTags();
	const tagsWithSlug = tags.filter((tag) => tag.slug);

	const tagEntries: MetadataRoute.Sitemap = tagsWithSlug.map((tag) => ({
		url: `${siteUrl}/tags/${tag.slug}`,
		lastModified: new Date(),
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	const tagPageCount = getPageCount(tagsWithSlug.length, TAGS_PAGE_SIZE);
	const tagPageEntries: MetadataRoute.Sitemap = Array.from(
		{ length: tagPageCount - 1 },
		(_, i) => ({
			url: `${siteUrl}/tags/page/${i + 2}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.5,
		}),
	);

	return [
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
			url: `${siteUrl}/events`,
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
		...tagEntries,
		...tagPageEntries,
	];
}

async function buildEventsSegment(siteUrl: string): Promise<MetadataRoute.Sitemap> {
	const eventSlugs = await getAllEventSlugs();

	return eventSlugs.map((entry) => ({
		url: `${siteUrl}/event/${entry.slug}`,
		lastModified: entry.lastModified,
		changeFrequency: "daily" as const,
		priority: 0.8,
	}));
}

async function buildTradersSegment(siteUrl: string): Promise<MetadataRoute.Sitemap> {
	const { data: traders } = await getGlobalLeaderboard("lifetime", 200);

	return traders
		.map((entry) => {
			const address = normalizeWalletAddress(entry.trader.address);
			if (!address) return null;
			return {
				url: `${siteUrl}/trader/${address}`,
				lastModified: new Date(),
				changeFrequency: "daily" as const,
				priority: 0.6,
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

async function buildMarketsSegment(
	siteUrl: string,
	segmentIndex: number,
): Promise<MetadataRoute.Sitemap> {
	const allSlugs = await getAllMarketSlugs();
	const start = segmentIndex * MARKETS_PER_SEGMENT;
	const end = start + MARKETS_PER_SEGMENT;
	const slugs = allSlugs.slice(start, end);

	return slugs.map((entry) => ({
		url: `${siteUrl}/market/${entry.slug}`,
		lastModified: entry.lastModified,
		changeFrequency: "daily" as const,
		priority: 0.8,
	}));
}
