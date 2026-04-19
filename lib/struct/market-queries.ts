import "server-only";

import type {
	GlobalCountsResponse,
	HolderHistoryCandle,
	LeaderboardEntry,
	MarketHoldersResponse,
	MarketResponse,
	MarketSortBy,
	MetricsTimeframe,
	PositionChartOutcome,
	PositionVolumeDataPoint,
	PriceJump,
	SortDirection,
	HttpClient,
	StructClient,
	Tag,
	TagSortBy,
	TagSortTimeframe,
	Trade,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import type { PaginatedResource } from "@/lib/struct/types";

const structMarketCacheVersion = "v2";
export const structMarketBySlugCacheTag = `struct-market-by-slug-${structMarketCacheVersion}`;
export const structMarketHoldersCacheTag = `struct-market-holders-${structMarketCacheVersion}`;
export const structMarketChartCacheTag = `struct-market-chart-${structMarketCacheVersion}`;
export const structPositionVolumeChartCacheTag = `struct-position-volume-chart-${structMarketCacheVersion}`;
export const structMarketTradesCacheTag = `struct-market-trades-${structMarketCacheVersion}`;
export const structMarketPriceJumpsCacheTag = `struct-market-price-jumps-${structMarketCacheVersion}`;
export const structMarketHoldersHistoryCacheTag = `struct-market-holders-history-${structMarketCacheVersion}`;
const structAllTagsCacheVersion = "v2";
const structTagBySlugCacheVersion = "v2";
const structMarketsByTagCacheVersion = "v2";

export const structAllTagsCacheTag = `struct-all-tags-${structAllTagsCacheVersion}`;
export const structTagBySlugCacheTag = `struct-tag-by-slug-${structTagBySlugCacheVersion}`;
export const structMarketsByTagCacheTag = `struct-markets-by-tag-${structMarketsByTagCacheVersion}`;
export const structGlobalLeaderboardCacheTag = "struct-global-leaderboard-v2";
export const structTopMarketsCacheTag = "struct-top-markets";
export const structAllMarketSlugsCacheTag = "struct-all-market-slugs";
export const structPlatformCountsCacheTag = "struct-platform-counts";

const MAX_LEADERBOARD_PAGE_SIZE = 50;
export const defaultMarketTradesPageSize = 25;

function parseOffsetCursor(cursor: string | undefined): number {
	if (!cursor) return 0;
	const parsed = Number.parseInt(cursor, 10);
	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export type PaginatedResult<T> = {
	data: T[];
	hasMore: boolean;
	nextCursor: string | null;
};

export type GetMarketTradesRequest = NonNullable<Parameters<StructClient["markets"]["getTrades"]>[0]>;
export type MarketTradesPageOptions = Omit<GetMarketTradesRequest, "condition_ids">;

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

function emptyOffsetPage<T>(limit: number): PaginatedResource<T, number> {
	return {
		data: [],
		hasMore: false,
		nextCursor: null,
		pageSize: limit,
	};
}

function hasTagSlug(tag: Tag): tag is Tag & { slug: string } {
	return typeof tag.slug === "string" && tag.slug.length > 0;
}

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
				const response = await client.markets.getMarketChart({ condition_id: conditionId, resolution: "ALL" });
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

export const getPositionVolumeChart = cache(
	unstable_cache(
		async (positionId: string): Promise<PositionVolumeDataPoint[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getPositionVolumeChart({ position_id: positionId, resolution: "60" });
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getPositionVolumeChart:${positionId}`, error);
				return null;
			}
		},
		[structPositionVolumeChartCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structPositionVolumeChartCacheTag] },
	),
);

const getMarketTradesPageCached = unstable_cache(
	async (conditionId: string, options?: MarketTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
		const client = getStructClient();
		const limit = options?.limit ?? defaultMarketTradesPageSize;

		if (!client) {
			return emptyOffsetPage<Trade>(limit);
		}

		const offset = options?.offset ?? 0;
		const { limit: _limit, offset: _offset, sort_desc, trade_types, ...restOptions } = (options ?? {}) as MarketTradesPageOptions;

		try {
			const response = await client.markets.getTrades({
				condition_ids: conditionId,
				...restOptions,
				limit: limit + 1,
				offset,
				sort_desc: sort_desc ?? true,
				trade_types: trade_types ?? "OrderFilled,OrdersMatched",
			});
			const data = response.data.slice(0, limit);
			const hasMore = response.data.length > limit;
			const nextCursor = hasMore ? offset + data.length : null;

			return {
				data,
				hasMore,
				nextCursor,
				pageSize: limit,
			};
		} catch (error) {
			if (readStatus(error) === 404) {
				return emptyOffsetPage<Trade>(limit);
			}

			logStructError(`getMarketTradesPage:${conditionId}`, error);
			return emptyOffsetPage<Trade>(limit);
		}
	},
	[structMarketTradesCacheTag],
	{ revalidate: shortRevalidateSeconds, tags: [structMarketTradesCacheTag] },
);

export const getMarketTradesPage = cache(
	async (conditionId: string, options?: MarketTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
		return getMarketTradesPageCached(conditionId, options);
	},
);

export const getMarketTrades = cache(
	async (conditionId: string, limit: number = defaultMarketTradesPageSize): Promise<Trade[]> => {
		const page = await getMarketTradesPage(conditionId, { limit });
		return page.data;
	},
);

export const getMarketHoldersHistory = cache(
	unstable_cache(
		async (conditionId: string, hours: number = 336): Promise<HolderHistoryCandle[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.holders.getMarketHoldersHistory({
					condition_id: conditionId,
					hours,
				});
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketHoldersHistory:${conditionId}`, error);
				return null;
			}
		},
		[structMarketHoldersHistoryCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketHoldersHistoryCacheTag] },
	),
);

export const getMarketPriceJumps = cache(
	unstable_cache(
		async (conditionId: string): Promise<PriceJump[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getPriceJumps({
					condition_id: conditionId,
					resolution: "5",
					min_change_pct: 10,
					lookback: 1440,
				});
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketPriceJumps:${conditionId}`, error);
				return null;
			}
		},
		[structMarketPriceJumpsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketPriceJumpsCacheTag] },
	),
);

export const getAllTags = cache(
	unstable_cache(
		async (sort?: TagSortBy, timeframe?: TagSortTimeframe): Promise<Tag[]> => {
			const client = getStructClient();

			if (!client) {
				return [];
			}

			const results: Tag[] = [];
			let offset = 0;
			const batchSize = 250;
			const sortParams = sort
				? { sort, timeframe: timeframe ?? ("lifetime" as TagSortTimeframe) }
				: undefined;

			try {
				let requestCount = 0;

				do {
					if (requestCount >= maxPaginationRequests) {
						logPaginationLimitReached("getAllTags");
						break;
					}

					const response = await client.tags.getTags({
						limit: batchSize,
						offset,
						...sortParams,
					});
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
	async (
		limit: number = defaultPageSize,
		offset: number = 0,
		sort?: TagSortBy,
		timeframe?: TagSortTimeframe,
	): Promise<PaginatedResult<Tag>> => {
		const tags = (await getAllTags(sort, timeframe)).filter(hasTagSlug);
		const data = tags.slice(offset, offset + limit);
		const hasMore = offset + limit < tags.length;

		return {
			data,
			hasMore,
			nextCursor: hasMore ? String(offset + limit) : null,
		};
	},
);

export const searchTags = cache(
	async (
		query: string,
		sort?: TagSortBy,
		timeframe?: TagSortTimeframe,
	): Promise<Tag[]> => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		const tags = (await getAllTags(sort, timeframe)).filter(hasTagSlug);
		return tags.filter((tag) => tag.label.toLowerCase().includes(q));
	},
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
				const http = (client.tags as unknown as { http: HttpClient }).http;
				const response = await http.get<Tag>(
					`/polymarket/tags/${encodeURIComponent(slug)}`,
					{ params: { include_metrics: true, timeframe: "lifetime" } },
				);
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
		async (tag: string, limit: number = defaultPageSize, cursor?: string, sortBy: string = "volume", sortDir: string = "desc", status: "open" | "closed" | "all" = "open"): Promise<PaginatedResult<MarketResponse>> => {
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
					status,
					include_metrics: true,
					...(cursor ? { pagination_key: cursor } : {}),
				});
				const hasMore = response.pagination?.has_more ?? false;
				const nextKey = response.pagination?.pagination_key;
				return {
					data: response.data.map(normalizeMarketResponseImages),
					hasMore,
					nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
				};
			} catch (error) {
				if (readStatus(error) === 404) {
					return { data: [], hasMore: false, nextCursor: null };
				}

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
			limit: number = MAX_LEADERBOARD_PAGE_SIZE,
			cursor?: string,
		): Promise<PaginatedResult<LeaderboardEntry>> => {
			const client = getStructClient();

			if (!client) {
				return { data: [], hasMore: false, nextCursor: null };
			}

			const startOffset = parseOffsetCursor(cursor);
			const tf = timeframe as "1d" | "7d" | "30d" | "lifetime";
			const data: LeaderboardEntry[] = [];
			let offset = startOffset;
			let hasMore = false;

			try {
				let requestsMade = 0;

				while (data.length < limit) {
					if (requestsMade >= maxPaginationRequests) {
						logPaginationLimitReached("getGlobalLeaderboard");
						hasMore = false;
						break;
					}

					const chunkLimit = Math.min(MAX_LEADERBOARD_PAGE_SIZE, limit - data.length);
					const response = await client.trader.getLeaderboard({
						timeframe: tf,
						sort_by: "pnl",
						limit: chunkLimit,
						offset,
					});
					requestsMade += 1;
					const chunk = response.data ?? [];
					data.push(...chunk);
					offset += chunk.length;
					if (chunk.length < chunkLimit) {
						hasMore = false;
						break;
					}
					hasMore = true;
				}

				return {
					data,
					hasMore,
					nextCursor: hasMore ? String(startOffset + data.length) : null,
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
		{ revalidate: longRevalidateSeconds, tags: [structAllMarketSlugsCacheTag] },
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
		{ revalidate: longRevalidateSeconds, tags: [structPlatformCountsCacheTag] },
	),
);

export async function getRecentTrades(limit: number = 10): Promise<Trade[]> {
	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.markets.getTrades({
			limit,
			sort_desc: true,
			trade_types: "OrderFilled,OrdersMatched",
		});
		return response.data;
	} catch (error) {
		logStructError("getRecentTrades", error);
		return [];
	}
}
