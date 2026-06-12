import "server-only";

import type {
	HolderCountHistoryCandle,
	MarketHoldersResponse,
	PolymarketCategory,
} from "@structbuild/sdk";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";
import {
	normalizeTraderLeaderboardEntry,
	type TraderLeaderboardApiEntry,
	type TraderLeaderboardEntry,
} from "@/lib/struct/trader-leaderboard";

const MAX_LEADERBOARD_PAGE_SIZE = 50;
const MAX_CATEGORY_LEADERBOARD_PAGE_SIZE = 200;

export type { TraderLeaderboardEntry } from "@/lib/struct/trader-leaderboard";

function appendNormalizedLeaderboardEntries(
	target: TraderLeaderboardEntry[],
	entries: readonly TraderLeaderboardApiEntry[],
) {
	for (const entry of entries) {
		const normalized = normalizeTraderLeaderboardEntry(entry);
		if (normalized) {
			target.push(normalized);
		}
	}
}

export async function getMarketHolders(
	marketSlug: string,
	limit: number = 10,
): Promise<MarketHoldersResponse | null> {
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
}

export async function getMarketHoldersHistory(
	conditionId: string,
	hours: number = 336,
): Promise<HolderCountHistoryCandle[] | null> {
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
}

export type LeaderboardSortOptions = {
	sortBy?: string;
	sortDirection?: "asc" | "desc";
};

export async function getGlobalLeaderboard(
	timeframe: string = "lifetime",
	limit: number = MAX_LEADERBOARD_PAGE_SIZE,
	cursor?: string,
	sort?: LeaderboardSortOptions,
): Promise<PaginatedResult<TraderLeaderboardEntry>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	const tf = timeframe as "1d" | "7d" | "30d" | "lifetime";
	const sortBy = sort?.sortBy as NonNullable<Parameters<typeof client.trader.getGlobalPnl>[0]>["sort_by"] | undefined;
	const sortOption = sortBy ? { sort_by: sortBy, sort_direction: sort?.sortDirection ?? "desc" } : {};
	const data: TraderLeaderboardEntry[] = [];
	let paginationKey: string | undefined = cursor;
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
			const response = await client.trader.getGlobalPnl({
				timeframe: tf,
				...sortOption,
				limit: chunkLimit,
				pagination_key: paginationKey,
			});
			requestsMade += 1;
			const chunk = response.data ?? [];
			appendNormalizedLeaderboardEntries(data, chunk);
			const nextKey = response.pagination?.pagination_key;
			const responseHasMore = response.pagination?.has_more ?? false;
			paginationKey = typeof nextKey === "string" && nextKey.length > 0 ? nextKey : undefined;
			if (!responseHasMore || !paginationKey || chunk.length < chunkLimit) {
				hasMore = responseHasMore && Boolean(paginationKey);
				break;
			}
			hasMore = true;
		}

		return {
			data,
			hasMore,
			nextCursor: hasMore ? paginationKey ?? null : null,
		};
	} catch (error) {
		logStructError(`getGlobalLeaderboard:${timeframe}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export async function getCategoryLeaderboard(
	category: PolymarketCategory,
	timeframe: string = "lifetime",
	limit: number = MAX_LEADERBOARD_PAGE_SIZE,
	cursor?: string,
	sort?: LeaderboardSortOptions,
): Promise<PaginatedResult<TraderLeaderboardEntry>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	const tf = timeframe as "1d" | "7d" | "30d" | "lifetime";
	const sortBy = sort?.sortBy as NonNullable<Parameters<typeof client.tags.getCategoryTopTraders>[0]>["sort_by"] | undefined;
	const sortOption = sortBy ? { sort_by: sortBy, sort_direction: sort?.sortDirection ?? "desc" } : {};
	const data: TraderLeaderboardEntry[] = [];
	let paginationKey: string | undefined = cursor;
	let hasMore = false;

	try {
		let requestsMade = 0;

		while (data.length < limit) {
			if (requestsMade >= maxPaginationRequests) {
				logPaginationLimitReached("getCategoryLeaderboard");
				hasMore = false;
				break;
			}

			const chunkLimit = Math.min(MAX_CATEGORY_LEADERBOARD_PAGE_SIZE, limit - data.length);
			const response = await client.tags.getCategoryTopTraders({
				category,
				timeframe: tf,
				...sortOption,
				limit: chunkLimit,
				pagination_key: paginationKey,
			});
			requestsMade += 1;
			const chunk = response.data ?? [];
			appendNormalizedLeaderboardEntries(data, chunk);
			const nextKey = response.pagination?.pagination_key;
			const responseHasMore = response.pagination?.has_more ?? false;
			paginationKey = typeof nextKey === "string" && nextKey.length > 0 ? nextKey : undefined;
			if (!responseHasMore || !paginationKey || chunk.length < chunkLimit) {
				hasMore = responseHasMore && Boolean(paginationKey);
				break;
			}
			hasMore = true;
		}

		return {
			data,
			hasMore,
			nextCursor: hasMore ? paginationKey ?? null : null,
		};
	} catch (error) {
		logStructError(`getCategoryLeaderboard:${category}:${timeframe}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}
