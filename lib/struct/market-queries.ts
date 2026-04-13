import "server-only";

import type {
	GlobalPnlTrader,
	MarketHoldersResponse,
	MarketResponse,
	MarketSortBy,
	PositionChartOutcome,
	SortDirection,
	Tag,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";

export const structMarketBySlugCacheTag = "struct-market-by-slug";
export const structMarketHoldersCacheTag = "struct-market-holders";
export const structMarketChartCacheTag = "struct-market-chart";
const structAllTagsCacheVersion = "v2";

export const structAllTagsCacheTag = `struct-all-tags-${structAllTagsCacheVersion}`;
export const structTagBySlugCacheTag = "struct-tag-by-slug";
export const structMarketsByTagCacheTag = "struct-markets-by-tag";
export const structGlobalLeaderboardCacheTag = "struct-global-leaderboard";
export const structTopMarketsCacheTag = "struct-top-markets";
export const structAllMarketSlugsCacheTag = "struct-all-market-slugs";

export type PaginatedResult<T> = {
	data: T[];
	hasMore: boolean;
	nextCursor: string | null;
};

const defaultPageSize = 24;
const shortRevalidateSeconds = 300;
const longRevalidateSeconds = 3600;
const maxPaginationRequests = 1000;

function readStatus(error: unknown) {
	if (typeof error !== "object" || error === null) {
		return null;
	}

	const record = error as Record<string, unknown>;
	const status = record.status;

	return typeof status === "number" ? status : null;
}

function logStructError(label: string, error: unknown) {
	console.error(`Struct SDK request failed: ${label}`, error);
}

function logPaginationLimitReached(label: string) {
	console.error(`Struct SDK pagination aborted after ${maxPaginationRequests} requests: ${label}`);
}

function hasTagSlug(tag: Tag): tag is Tag & { slug: string } {
	return typeof tag.slug === "string" && tag.slug.length > 0;
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
				return response.data;
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

export const getMarketHolders = cache(
	unstable_cache(
		async (marketSlug: string, limit: number = 10): Promise<MarketHoldersResponse | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.holders.getMarketHolders({
					market_slug: marketSlug,
					limit,
					include_pnl: true,
				});
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketHolders:${marketSlug}`, error);
				return null;
			}
		},
		[structMarketHoldersCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketHoldersCacheTag] },
	),
);

export const getMarketChart = cache(
	unstable_cache(
		async (conditionId: string): Promise<PositionChartOutcome[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getMarketChart({ condition_id: conditionId, resolution: "1H" });
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketChart:${conditionId}`, error);
				return null;
			}
		},
		[structMarketChartCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketChartCacheTag] },
	),
);

export const getAllTags = cache(
	unstable_cache(
		async (): Promise<Tag[]> => {
			const client = getStructClient();

			if (!client) {
				return [];
			}

			const results: Tag[] = [];
			let offset = 0;
			const batchSize = 250;

			try {
				let requestCount = 0;

				do {
					if (requestCount >= maxPaginationRequests) {
						logPaginationLimitReached("getAllTags");
						break;
					}

					const response = await client.tags.getTags({ limit: batchSize, offset });
					results.push(...response.data);
					requestCount += 1;

					if (response.data.length < batchSize) break;

					offset += batchSize;
				} while (true);

				return results;
			} catch (error) {
				logStructError("getAllTags", error);
				return results;
			}
		},
		[structAllTagsCacheTag],
		{ revalidate: longRevalidateSeconds, tags: [structAllTagsCacheTag] },
	),
);

export const getTagsPaginated = cache(
	unstable_cache(
		async (limit: number = defaultPageSize, offset: number = 0): Promise<PaginatedResult<Tag>> => {
			const tags = (await getAllTags()).filter(hasTagSlug);
			const data = tags.slice(offset, offset + limit);
			const hasMore = offset + limit < tags.length;

			return {
				data,
				hasMore,
				nextCursor: hasMore ? String(offset + limit) : null,
			};
		},
		[structAllTagsCacheTag],
		{ revalidate: longRevalidateSeconds, tags: [structAllTagsCacheTag] },
	),
);

export const getTagCount = cache(
	unstable_cache(
		async (): Promise<number> => {
			const tags = (await getAllTags()).filter(hasTagSlug);
			return tags.length;
		},
		[`struct-tag-count-${structAllTagsCacheVersion}`],
		{ revalidate: longRevalidateSeconds, tags: [structAllTagsCacheTag] },
	),
);

export const getTagBySlug = cache(
	unstable_cache(
		async (slug: string): Promise<Tag | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.tags.getTag({ identifier: slug });
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getTagBySlug:${slug}`, error);
				return null;
			}
		},
		[structTagBySlugCacheTag],
		{ revalidate: longRevalidateSeconds, tags: [structTagBySlugCacheTag] },
	),
);

export const getMarketsByTag = cache(
	unstable_cache(
		async (tag: string, limit: number = defaultPageSize, cursor?: string, sortBy: string = "volume", sortDir: string = "desc"): Promise<PaginatedResult<MarketResponse>> => {
			const client = getStructClient();

			if (!client) {
				return { data: [], hasMore: false, nextCursor: null };
			}

			try {
				const response = await client.markets.getMarkets({
					tags: tag,
					limit,
					sort_by: sortBy as MarketSortBy,
					sort_dir: sortDir as SortDirection,
					status: "open",
					include_metrics: true,
					...(cursor ? { pagination_key: cursor } : {}),
				});
				const hasMore = response.pagination?.has_more ?? false;
				const nextKey = response.pagination?.pagination_key;
				return {
					data: response.data,
					hasMore,
					nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
				};
			} catch (error) {
				logStructError(`getMarketsByTag:${tag}`, error);
				return { data: [], hasMore: false, nextCursor: null };
			}
		},
		[structMarketsByTagCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketsByTagCacheTag] },
	),
);

export const getGlobalLeaderboard = cache(
	unstable_cache(
		async (
			timeframe: string = "lifetime",
			limit: number = 100,
			cursor?: string,
		): Promise<PaginatedResult<GlobalPnlTrader>> => {
			const client = getStructClient();

			if (!client) {
				return { data: [], hasMore: false, nextCursor: null };
			}

			try {
				const response = await client.trader.getGlobalPnl({
					timeframe: timeframe as "1d" | "7d" | "30d" | "lifetime",
					sort_by: "realized_pnl_usd",
					sort_direction: "desc",
					limit,
					...(cursor ? { pagination_key: cursor } : {}),
				});
				const hasMore = response.pagination?.has_more ?? false;
				const nextKey = response.pagination?.pagination_key;
				return {
					data: response.data,
					hasMore,
					nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
				};
			} catch (error) {
				logStructError(`getGlobalLeaderboard:${timeframe}`, error);
				return { data: [], hasMore: false, nextCursor: null };
			}
		},
		[structGlobalLeaderboardCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structGlobalLeaderboardCacheTag] },
	),
);

export const getTopMarkets = cache(
	unstable_cache(
		async (limit: number = defaultPageSize, status: string = "open", cursor?: string, sortBy: string = "volume", sortDir: string = "desc"): Promise<PaginatedResult<MarketResponse>> => {
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
					include_metrics: true,
					...(cursor ? { pagination_key: cursor } : {}),
				});
				const hasMore = response.pagination?.has_more ?? false;
				const nextKey = response.pagination?.pagination_key;
				return {
					data: response.data,
					hasMore,
					nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
				};
			} catch (error) {
				logStructError(`getTopMarkets:${status}`, error);
				return { data: [], hasMore: false, nextCursor: null };
			}
		},
		[structTopMarketsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structTopMarketsCacheTag] },
	),
);

export const getAllMarketSlugs = cache(
	unstable_cache(
		async (): Promise<{ slug: string; lastModified: Date }[]> => {
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

				do {
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
		{ revalidate: longRevalidateSeconds, tags: [structAllMarketSlugsCacheTag] },
	),
);

