import "server-only";

import type {
	GlobalCountsResponse,
	MarketResponse,
	MarketSortBy,
	MarketStatus,
	MetricsTimeframe,
	SortDirection,
} from "@structbuild/sdk";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";

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
	return fetchTopMarkets(limit, status, cursor, sortBy, sortDir, timeframe, excludeTags);
}

export const getHomeTopMarkets = getTopMarkets;

export async function getAllMarketSlugs(
	maxCount?: number,
): Promise<{ slug: string }[]> {
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
