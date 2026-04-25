import "server-only";

import type {
	GlobalCountsResponse,
	MarketResponse,
	MarketSortBy,
	MarketStatus,
	MetricsTimeframe,
	SortDirection,
} from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";

export const structMarketBySlugCacheTag = "struct-market-by-slug-v2";
export const structTopMarketsCacheTag = "struct-top-markets";
export const structAllMarketSlugsCacheTag = "struct-all-market-slugs";
export const structPlatformCountsCacheTag = "struct-platform-counts";

async function fetchTopMarkets(
	limit: number = defaultPageSize,
	status: MarketStatus = "open",
	cursor?: string,
	sortBy: MarketSortBy = "volume",
	sortDir: SortDirection = "desc",
	timeframe: MetricsTimeframe = "24h",
	excludeTags?: string,
): Promise<PaginatedResult<MarketResponse>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.markets.getMarkets({
			limit,
			status,
			sort_by: sortBy,
			sort_dir: sortDir,
			timeframe,
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

export async function getMarketBySlug(slug: string): Promise<MarketResponse | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketBySlugCacheTag);

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
		throw error;
	}
}

export async function getTopMarkets(
	limit: number = defaultPageSize,
	status: MarketStatus = "open",
	cursor?: string,
	sortBy: MarketSortBy = "volume",
	sortDir: SortDirection = "desc",
	timeframe: MetricsTimeframe = "24h",
	excludeTags?: string,
): Promise<PaginatedResult<MarketResponse>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTopMarketsCacheTag);

	return fetchTopMarkets(limit, status, cursor, sortBy, sortDir, timeframe, excludeTags);
}

// Bypasses the "use cache" wrapper used by getTopMarkets so the home page always sees freshest data.
export const getHomeTopMarkets = fetchTopMarkets;

export async function getAllMarketSlugs(
	maxCount?: number,
): Promise<{ slug: string }[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAllMarketSlugsCacheTag);

	if (maxCount !== undefined && maxCount <= 0) {
		return [];
	}

	const client = getStructClient();

	if (!client) {
		return [];
	}

	const results: { slug: string }[] = [];
	let paginationKey: string | undefined;

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
					results.push({ slug: market.market_slug });
					if (maxCount !== undefined && results.length >= maxCount) {
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
		throw error;
	}
}

export async function getPlatformCounts(): Promise<GlobalCountsResponse | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structPlatformCountsCacheTag);

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
}
