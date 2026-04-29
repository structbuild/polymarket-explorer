import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import {
	getAllMarketSlugs,
	getAllTags,
	getGlobalLeaderboard,
} from "@/lib/struct/market-queries";
import { getAllBuilderCodes } from "@/lib/struct/builder-queries";
import { normalizeWalletAddress } from "@/lib/utils";

export const maxDuration = 60;

// Per-shard caps keep each sitemap file well under the 50k URL limit; bump or shard further when datasets grow.
const MARKET_CAP = 5000;
const TRADER_CAP = 500;

const STATIC_SHARD = "0";
const TRADERS_SHARD = "1";
const MARKETS_SHARD = "2";

type SitemapEntry = MetadataRoute.Sitemap[number];

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id: raw } = await params;
	if (!raw.endsWith(".xml")) {
		return new Response("Not Found", { status: 404 });
	}

	const shardId = raw.slice(0, -".xml".length);
	const siteUrl = getSiteUrl().origin;

	let entries: SitemapEntry[];
	switch (shardId) {
		case STATIC_SHARD:
			entries = await buildStaticAndTagsShard(siteUrl);
			break;
		case TRADERS_SHARD:
			entries = await buildTradersShard(siteUrl);
			break;
		case MARKETS_SHARD:
			entries = await buildMarketsShard(siteUrl);
			break;
		default:
			return new Response("Not Found", { status: 404 });
	}

	return new Response(serializeUrlset(entries), {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=0, s-maxage=300, must-revalidate",
		},
	});
}

async function buildStaticAndTagsShard(
	siteUrl: string,
): Promise<SitemapEntry[]> {
	const [tags, builderCodes] = await Promise.all([getAllTags(), getAllBuilderCodes()]);
	const tagsWithSlug = tags.filter((tag) => tag.slug);
	const tagPageCount = getPageCount(tagsWithSlug.length, TAGS_PAGE_SIZE);

	const staticEntries: SitemapEntry[] = [
		{ url: siteUrl, changeFrequency: "hourly", priority: 1 },
		{ url: `${siteUrl}/markets`, changeFrequency: "hourly", priority: 0.9 },
		{ url: `${siteUrl}/traders`, changeFrequency: "hourly", priority: 0.9 },
		{ url: `${siteUrl}/builders`, changeFrequency: "daily", priority: 0.7 },
		{ url: `${siteUrl}/rewards`, changeFrequency: "daily", priority: 0.7 },
		{ url: `${siteUrl}/tags`, changeFrequency: "weekly", priority: 0.6 },
	];

	const tagEntries: SitemapEntry[] = tagsWithSlug.map((tag) => ({
		url: `${siteUrl}/tags/${tag.slug}`,
		changeFrequency: "daily",
		priority: 0.7,
	}));

	const tagPageEntries: SitemapEntry[] = Array.from(
		{ length: Math.max(tagPageCount - 1, 0) },
		(_, i) => ({
			url: `${siteUrl}/tags/page/${i + 2}`,
			changeFrequency: "weekly",
			priority: 0.5,
		}),
	);

	const builderEntries: SitemapEntry[] = builderCodes.map(({ code }) => ({
		url: `${siteUrl}/builders/${encodeURIComponent(code)}`,
		changeFrequency: "daily",
		priority: 0.6,
	}));

	return [...staticEntries, ...tagEntries, ...tagPageEntries, ...builderEntries];
}

async function buildTradersShard(siteUrl: string): Promise<SitemapEntry[]> {
	const { data: traders } = await getGlobalLeaderboard("lifetime", TRADER_CAP);

	return traders
		.map((entry): SitemapEntry | null => {
			const address = normalizeWalletAddress(entry.trader.address);
			if (!address) return null;
			return {
				url: `${siteUrl}/traders/${address}`,
				changeFrequency: "daily",
				priority: 0.6,
			};
		})
		.filter((entry): entry is SitemapEntry => entry !== null);
}

async function buildMarketsShard(siteUrl: string): Promise<SitemapEntry[]> {
	const marketSlugs = await getAllMarketSlugs(MARKET_CAP);

	return marketSlugs.map((entry) => ({
		url: `${siteUrl}/markets/${entry.slug}`,
		changeFrequency: "daily",
		priority: 0.8,
	}));
}

function serializeUrlset(entries: SitemapEntry[]) {
	const urls = entries
		.map((entry) => {
			const parts = [`<loc>${escapeXml(entry.url)}</loc>`];
			if (entry.lastModified) {
				const lastmod =
					typeof entry.lastModified === "string"
						? entry.lastModified
						: entry.lastModified.toISOString();
				parts.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`);
			}
			if (entry.changeFrequency) {
				parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
			}
			if (entry.priority !== undefined) {
				parts.push(`<priority>${entry.priority}</priority>`);
			}
			return `  <url>${parts.join("")}</url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function escapeXml(value: string) {
	return value.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return c;
		}
	});
}
