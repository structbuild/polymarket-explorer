import "server-only";

import type {
	GlobalCountsResponse,
	MarketResponse,
	MarketSortBy,
	MetricsTimeframe,
	SortDirection,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
	shortRevalidateSeconds,
} from "@/lib/struct/queries/_shared";

const structMarketCacheVersion = "v2";
export const structMarketBySlugCacheTag = `struct-market-by-slug-${structMarketCacheVersion}`;
export const structTopMarketsCacheTag = "struct-top-markets";
export const structAllMarketSlugsCacheTag = "struct-all-market-slugs";
export const structPlatformCountsCacheTag = "struct-platform-counts";

async function fetchTopMarkets(
	limit: number = defaultPageSize,
	status: string = "open",
	cursor?: string,
	sortBy: string = "volume",
	sortDir: string = "desc",
	timeframe: string = "24h",
	excludeTags?: string,
): Promise<PaginatedResult<MarketResponse>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.markets.getMarkets({
			limit,
			status: status as "open" | "closed" | "all",
			sort_by: sortBy as MarketSortBy,
			sort_dir: sortDir as SortDirection,
			timeframe: timeframe as MetricsTimeframe,
			include_metrics: true,
			...(cursor ? { pagination_key: cursor } : {}),
			...(excludeTags ? { exclude_tags: excludeTags } : {}),
		});
		const hasMore = response.pagination?.has_more ?? false;
		const nextKey = response.pagination?.pagination_key;
		return {
			data: response.data.map(normalizeMarketResponseImages),
			hasMore,
			nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
		};
	} catch (error) {
		logStructError(`getTopMarkets:${status}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export const getMarketBySlug = cache(
	unstable_cache(
		async (slug: string): Promise<MarketResponse | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getMarketBySlug({ marketSlug: slug });
				const data = response.data;
				return data ? normalizeMarketResponseImages(data) : null;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketBySlug:${slug}`, error);
				return null;
			}
		},
		[structMarketBySlugCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketBySlugCacheTag] },
	),
);

export const getTopMarkets = cache(
	unstable_cache(
		fetchTopMarkets,
		[structTopMarketsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structTopMarketsCacheTag] },
	),
);

export const getHomeTopMarkets = fetchTopMarkets;

export const getAllMarketSlugs = cache(
	unstable_cache(
		async (
			maxCount?: number,
		): Promise<{ slug: string; lastModified: Date }[]> => {
			const client = getStructClient();

			if (!client) {
				return [];
			}

			const results: { slug: string; lastModified: Date }[] = [];
			let paginationKey: string | undefined;
			const now = new Date();

			try {
				const seenPaginationKeys = new Set<string>();
				let requestCount = 0;

				outer: do {
					if (requestCount >= maxPaginationRequests) {
						logPaginationLimitReached("getAllMarketSlugs");
						break;
					}

					const response = await client.markets.getMarkets({
						status: "all",
						sort_by: "volume",
						sort_dir: "desc",
						limit: 100,
						...(paginationKey ? { pagination_key: paginationKey } : {}),
					});
					requestCount += 1;

					for (const market of response.data) {
						if (market.market_slug) {
							results.push({ slug: market.market_slug, lastModified: now });
							if (maxCount && results.length >= maxCount) {
								break outer;
							}
						}
					}

					const hasMore = response.pagination?.has_more ?? false;
					const nextKey = response.pagination?.pagination_key;
					paginationKey = hasMore && nextKey != null
						? String(nextKey)
						: undefined;

					if (!hasMore) break;
					if (!paginationKey || seenPaginationKeys.has(paginationKey)) break;

					seenPaginationKeys.add(paginationKey);
				} while (true);

				return results;
			} catch (error) {
				logStructError("getAllMarketSlugs", error);
				return results;
			}
		},
		[structAllMarketSlugsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structAllMarketSlugsCacheTag] },
	),
);

export const getPlatformCounts = cache(
	unstable_cache(
		async (): Promise<GlobalCountsResponse | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.analytics.getCounts();
				return response.data;
			} catch (error) {
				logStructError("getPlatformCounts", error);
				return null;
			}
		},
		[structPlatformCountsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structPlatformCountsCacheTag] },
	),
);
