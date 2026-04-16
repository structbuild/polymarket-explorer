import "server-only";

import type {
	MarketResponse,
	StructClient,
	Trade,
	Trader,
	TraderOutcomePnlEntry,
	TraderPnlSummary,
	UserProfile,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import type { PaginatedResource } from "@/lib/struct/types";
import { normalizeWalletAddress } from "@/lib/utils";

export const defaultTraderTablePageSize = 25;
const defaultPositionsLimit = defaultTraderTablePageSize;
const defaultTradesLimit = defaultTraderTablePageSize;
const maxTraderSearchQueryLength = 100;
const traderQueryRevalidateSeconds = 300;
export const structTraderPositionsCacheTag = "struct-trader-positions-page";
export const structTraderTradesCacheTag = "struct-trader-trades-page";
export const structRewardsMarketsCacheTag = "struct-rewards-markets";

export type GetTraderOutcomePnlRequest = Parameters<StructClient["trader"]["getTraderOutcomePnl"]>[0];
export type GetTraderTradesRequest = Parameters<StructClient["trader"]["getTraderTrades"]>[0];

export type TraderPositionsOptions = Omit<GetTraderOutcomePnlRequest, "address" | "status">;
export type TraderTradesPageOptions = Omit<GetTraderTradesRequest, "address">;

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

function normalizeTraderSearchQuery(query: string) {
	return query.trim().replace(/\s+/g, " ").slice(0, maxTraderSearchQueryLength);
}

function sanitizeLogValue(value: string, maxLength: number = maxTraderSearchQueryLength) {
	const sanitized = value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
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

export const searchAll = cache(async (query: string): Promise<{ traders: Trader[]; markets: MarketResponse[] }> => {
	const client = getStructClient();
	const normalizedQuery = normalizeTraderSearchQuery(query);

	if (!client || normalizedQuery.length < 2) {
		return { traders: [], markets: [] };
	}

	try {
		const response = await client.search.search({
			q: normalizedQuery,
			limit: 10,
			type: "traders,markets",
		});
		return {
			traders: response.data.traders ?? [],
			markets: (response.data.markets ?? []).map(normalizeMarketResponseImages),
		};
	} catch (error) {
		logStructError(`searchAll:${sanitizeLogValue(normalizedQuery)}`, error);
		return { traders: [], markets: [] };
	}
});

const getTraderProfileCached = unstable_cache(
	async (address: string): Promise<UserProfile | null> => {
		const client = getStructClient();

		if (!client) {
			return null;
		}

		try {
			const response = await client.trader.getTraderProfile({ address });
			return response.data;
		} catch (error) {
			if (readStatus(error) === 404) {
				return null;
			}

			logStructError(`getTraderProfile:${address}`, error);
			throw error;
		}
	},
	["struct-trader-profile"],
	{ revalidate: traderQueryRevalidateSeconds },
);

export async function getTraderProfile(address: string): Promise<UserProfile | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	return getTraderProfileCached(normalizedAddress);
}

const getTraderPnlSummaryCached = unstable_cache(
	async (address: string): Promise<TraderPnlSummary | null> => {
		const client = getStructClient();

		if (!client) {
			return null;
		}

		try {
			const response = await client.trader.getTraderPnl({ address, timeframe: "lifetime" });
			return response.data;
		} catch (error) {
			if (readStatus(error) === 404) {
				return null;
			}

			logStructError(`getTraderPnlSummary:${address}`, error);
			throw error;
		}
	},
	["struct-trader-pnl-summary"],
	{ revalidate: traderQueryRevalidateSeconds },
);

export async function getTraderPnlSummary(address: string): Promise<TraderPnlSummary | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	return getTraderPnlSummaryCached(normalizedAddress);
}

export const getMarketsByConditionIds = unstable_cache(
	async (conditionIds: string[]): Promise<MarketResponse[] | null> => {
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
	},
	["struct-markets-by-condition-ids"],
	{ revalidate: traderQueryRevalidateSeconds },
);

function emptyPage<T>(limit: number): PaginatedResource<T, number> {
	return {
		data: [],
		hasMore: false,
		nextCursor: null,
		pageSize: limit,
	};
}

const getTraderPositionsPageCached = unstable_cache(
	async (
		address: string,
		status: "open" | "closed",
		options?: TraderPositionsOptions,
	): Promise<PaginatedResource<TraderOutcomePnlEntry, number>> => {
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
	},
	[structTraderPositionsCacheTag],
	{ revalidate: traderQueryRevalidateSeconds },
);

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


const getTraderTradesPageCached = unstable_cache(
	async (address: string, options?: TraderTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
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
	},
	[structTraderTradesCacheTag],
	{ revalidate: traderQueryRevalidateSeconds },
);

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

export const getRewardsMarkets = unstable_cache(
	async (): Promise<MarketResponse[]> => {
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
	},
	[structRewardsMarketsCacheTag],
	{ revalidate: traderQueryRevalidateSeconds, tags: [structRewardsMarketsCacheTag] },
);
