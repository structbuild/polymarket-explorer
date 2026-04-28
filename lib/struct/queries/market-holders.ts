import "server-only";

import type {
	HolderHistoryCandle,
	LeaderboardEntry,
	MarketHoldersResponse,
} from "@structbuild/sdk";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
	parseOffsetCursor,
} from "@/lib/struct/queries/_shared";

const MAX_LEADERBOARD_PAGE_SIZE = 50;

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
): Promise<HolderHistoryCandle[] | null> {
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

export async function getGlobalLeaderboard(
	timeframe: string = "lifetime",
	limit: number = MAX_LEADERBOARD_PAGE_SIZE,
	cursor?: string,
): Promise<PaginatedResult<LeaderboardEntry>> {
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
}
