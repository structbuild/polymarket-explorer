import "server-only";

import type {
	Event,
	MarketResponse,
	StructClient,
	Trade,
	Trader,
	TraderOutcomePnlEntry,
	TraderPnlSummary,
	TraderWithPnl,
	UserProfile,
} from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { PaginatedResource } from "@/lib/struct/types";
import { normalizeWalletAddress } from "@/lib/utils";

export const defaultTraderTablePageSize = 25;
const defaultPositionsLimit = defaultTraderTablePageSize;
const defaultTradesLimit = defaultTraderTablePageSize;
const maxTraderSearchQueryLength = 100;
export const structTraderPositionsCacheTag = "struct-trader-positions-page";
export const structTraderTradesCacheTag = "struct-trader-trades-page";
export const structRewardsMarketsCacheTag = "struct-rewards-markets";

export type GetTraderOutcomePnlRequest = Parameters<StructClient["trader"]["getTraderOutcomePnl"]>[0];
export type GetTraderTradesRequest = Parameters<StructClient["trader"]["getTraderTrades"]>[0];

export type TraderPositionsOptions = Omit<GetTraderOutcomePnlRequest, "address" | "status">;
export type TraderTradesPageOptions = Omit<GetTraderTradesRequest, "address">;

function normalizeTraderSearchQuery(query: string) {
	return query.trim().replace(/\s+/g, " ").slice(0, maxTraderSearchQueryLength);
}

function sanitizeLogValue(value: string, maxLength: number = maxTraderSearchQueryLength) {
	const sanitized = value.replace(/[\x00-\x1F\x7F]+/g, " ").trim();
	return sanitized.length > maxLength ? `${sanitized.slice(0, maxLength)}...` : sanitized;
}

export const searchTraders = cache(async (query: string): Promise<Trader[]> => {
	const client = getStructClient();
	const normalizedQuery = normalizeTraderSearchQuery(query);

	if (!client || normalizedQuery.length < 2) {
		return [];
	}

	try {
		const response = await client.search.search({
			q: normalizedQuery,
			limit: 25,
			type: "traders"
		});
		return response.data.traders ?? [];
	} catch (error) {
		logStructError(`searchTraders:${sanitizeLogValue(normalizedQuery)}`, error);
		return [];
	}
});

export const searchAll = cache(
	async (query: string): Promise<{ traders: TraderWithPnl[]; markets: MarketResponse[]; events: Event[] }> => {
		const client = getStructClient();
		const normalizedQuery = normalizeTraderSearchQuery(query);

		if (!client || normalizedQuery.length < 2) {
			return { traders: [], markets: [], events: [] };
		}

		try {
			const response = await client.search.search({
				q: normalizedQuery,
				limit: 10,
				type: "traders,markets,events",
				include_pnl: true,
			});
			return {
				traders: response.data.traders ?? [],
				markets: (response.data.markets ?? []).map(normalizeMarketResponseImages),
				events: ((response.data.events ?? []) as Event[]).map((event) => ({
					...normalizeMarketResponseImages(event),
					markets: event.markets.map(normalizeMarketResponseImages),
				})),
			};
		} catch (error) {
			logStructError(`searchAll:${sanitizeLogValue(normalizedQuery)}`, error);
			return { traders: [], markets: [], events: [] };
		}
	},
);

async function getTraderProfileCached(address: string): Promise<UserProfile> {
	"use cache";
	cacheLife("minutes");

	const client = getStructClient();

	if (!client) {
		throw new Error("Struct client not configured");
	}

	const response = await client.trader.getTraderProfile({ address });

	if (!response.data) {
		throw new Error("Empty trader profile payload");
	}

	return response.data;
}

export async function getTraderProfile(address: string): Promise<UserProfile | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	try {
		return await getTraderProfileCached(normalizedAddress);
	} catch (error) {
		if (readStatus(error) !== 404) {
			logStructError(`getTraderProfile:${address}`, error);
		}
		return null;
	}
}

async function getTraderPnlSummaryCached(address: string): Promise<TraderPnlSummary> {
	"use cache";
	cacheLife("minutes");

	const client = getStructClient();

	if (!client) {
		throw new Error("Struct client not configured");
	}

	const response = await client.trader.getTraderPnl({ address, timeframe: "lifetime" });

	if (!response.data) {
		throw new Error("Empty trader pnl payload");
	}

	return response.data;
}

export async function getTraderPnlSummary(address: string): Promise<TraderPnlSummary | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	try {
		return await getTraderPnlSummaryCached(normalizedAddress);
	} catch (error) {
		if (readStatus(error) !== 404) {
			logStructError(`getTraderPnlSummary:${address}`, error);
		}
		return null;
	}
}

export async function getMarketsByConditionIds(conditionIds: string[]): Promise<MarketResponse[] | null> {
	"use cache";
	cacheLife("minutes");

	const client = getStructClient();

	if (!client || conditionIds.length === 0) {
		return null;
	}

	try {
		const response = await client.markets.getMarkets({ condition_ids: conditionIds.join(",") });
		const data = response.data ?? [];
		return data.map(normalizeMarketResponseImages);
	} catch (error) {
		logStructError(`getMarketsByConditionIds:${conditionIds.join(",")}`, error);
		return null;
	}
}

function emptyPage<T>(limit: number): PaginatedResource<T, number> {
	return {
		data: [],
		hasMore: false,
		nextCursor: null,
		pageSize: limit,
	};
}

async function getTraderPositionsPageCached(
	address: string,
	status: "open" | "closed",
	options?: TraderPositionsOptions,
): Promise<PaginatedResource<TraderOutcomePnlEntry, number>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTraderPositionsCacheTag);

	const client = getStructClient();
	const limit = options?.limit ?? defaultPositionsLimit;

	if (!client) {
		return emptyPage<TraderOutcomePnlEntry>(limit);
	}

	const offset = options?.offset ?? 0;
	const restOptions = { ...(options ?? {}) };
	const sort_by = restOptions.sort_by;
	const sort_direction = restOptions.sort_direction;
	delete restOptions.limit;
	delete restOptions.sort_by;
	delete restOptions.sort_direction;

	try {
		const requestLimit = limit + 1;
		const params: GetTraderOutcomePnlRequest = {
			address,
			status,
			...restOptions,
			limit: requestLimit,
			sort_by: sort_by ?? (status === "open" ? "current_value" : "realized_pnl_usd"),
			sort_direction: sort_direction ?? "desc",
		};
		const response = await client.trader.getTraderOutcomePnl(params);
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
			return emptyPage<TraderOutcomePnlEntry>(limit);
		}

		logStructError(`getTraderPositionsPage:${address}:${status}`, error);
		return emptyPage<TraderOutcomePnlEntry>(limit);
	}
}

export async function getTraderPositionsPage(
	address: string,
	status: "open" | "closed",
	options?: TraderPositionsOptions,
): Promise<PaginatedResource<TraderOutcomePnlEntry, number>> {
	const normalizedAddress = normalizeWalletAddress(address);
	const limit = options?.limit ?? defaultPositionsLimit;

	if (!normalizedAddress) {
		return emptyPage<TraderOutcomePnlEntry>(limit);
	}

	return getTraderPositionsPageCached(normalizedAddress, status, options);
}


async function getTraderTradesPageCached(
	address: string,
	options?: TraderTradesPageOptions,
): Promise<PaginatedResource<Trade, number>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTraderTradesCacheTag);

	const client = getStructClient();
	const limit = options?.limit ?? defaultTradesLimit;

	if (!client) {
		return emptyPage<Trade>(limit);
	}

	const offset = options?.offset ?? 0;
	const restOptions = { ...(options ?? {}) };
	const sort_desc = restOptions.sort_desc;
	delete restOptions.limit;
	delete restOptions.sort_desc;

	try {
		const requestLimit = limit + 1;
		const params: GetTraderTradesRequest = {
			address,
			...restOptions,
			limit: requestLimit,
			sort_desc: sort_desc ?? true,
		};
		const response = await client.trader.getTraderTrades(params);
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
			return emptyPage<Trade>(limit);
		}

		logStructError(`getTraderTradesPage:${address}`, error);
		return emptyPage<Trade>(limit);
	}
}

export async function getTraderTradesPage(
	address: string,
	options?: TraderTradesPageOptions,
): Promise<PaginatedResource<Trade, number>> {
	const normalizedAddress = normalizeWalletAddress(address);
	const limit = options?.limit ?? defaultTradesLimit;

	if (!normalizedAddress) {
		return emptyPage<Trade>(limit);
	}

	return getTraderTradesPageCached(normalizedAddress, options);
}

export async function getRewardsMarkets(): Promise<MarketResponse[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structRewardsMarketsCacheTag);

	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.markets.getMarkets({
			has_rewards: true,
			status: "open",
			limit: 100,
		});
		return response.data
			.filter(
				(market) =>
					(market.clob_rewards
						?.map((reward) => reward.total_daily_rate)
						?.reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0) > 0.5,
			)
			.map(normalizeMarketResponseImages);
	} catch (error) {
		logStructError("getRewardsMarkets", error);
		return [];
	}
}
