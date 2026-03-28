import "server-only";

import type {
	GlobalPnlTrader,
	MarketMetadata,
	StructClient,
	Trade,
	Trader,
	TraderOutcomePnlEntry,
	UserProfile,
} from "@structbuild/sdk";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import type { MarketDetail, MarketSummary, PaginatedResource } from "@/lib/struct/types";

const featuredLimit = 12;
export const defaultTraderTablePageSize = 25;
const defaultPositionsLimit = defaultTraderTablePageSize;
const defaultTradesLimit = defaultTraderTablePageSize;
const maxTraderSearchQueryLength = 100;

export type GetTraderOutcomePnlRequest = Parameters<StructClient["trader"]["getTraderOutcomePnl"]>[0];
export type GetTraderTradesRequest = Parameters<StructClient["trader"]["getTraderTrades"]>[0];

export type TraderPositionsOptions = Omit<GetTraderOutcomePnlRequest, "address" | "status">;
export type TraderTradesOptions = Omit<GetTraderTradesRequest, "address">;
export type TraderTradesPageOptions = Omit<GetTraderTradesRequest, "address">;

type PaginatedApiResponse<T> = {
	data: T[];
	pagination?: {
		pagination_key: string | number | null;
	};
};

function toMarket(m: MarketMetadata): MarketSummary {
	return {
		id: m.condition_id,
		slug: m.slug,
		title: m.question,
		description: m.description ?? null,
		probability: m.outcomes?.[0]?.price != null ? Math.round(m.outcomes[0].price * 1000) / 10 : null,
		volume: m.volume_usd ?? null,
		endDate: m.end_time != null ? new Date(m.end_time * 1000).toISOString() : null,
		eventTitle: m.event_title ?? null,
		conditionId: m.condition_id,
		outcomes: (m.outcomes ?? []).map((o) => ({
			label: o.name,
			probability: o.price != null ? Math.round(o.price * 1000) / 10 : null,
		})),
	};
}

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

async function hasMoreResults<T>(
	response: PaginatedApiResponse<T>,
	probeNextPage?: () => Promise<PaginatedApiResponse<T>>,
) {
	if (response.data.length === 0) {
		return false;
	}

	if (!probeNextPage) {
		return true;
	}

	try {
		const nextPage = await probeNextPage();
		return nextPage.data.length > 0;
	} catch (error) {
		logStructError("probePagination", error);
		return true;
	}
}

export const getFeaturedMarkets = cache(async (): Promise<MarketSummary[]> => {
	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.markets.getMarkets({ limit: featuredLimit });
		return response.data.map(toMarket);
	} catch (error) {
		logStructError("getFeaturedMarkets", error);
		return [];
	}
});


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
		});
		return response.data.traders ?? [];
	} catch (error) {
		logStructError(`searchTraders:${sanitizeLogValue(normalizedQuery)}`, error);
		return [];
	}
});

export const getMarketBySlug = cache(async (slug: string): Promise<MarketDetail | null> => {
	const client = getStructClient();

	if (!client || !slug.trim()) {
		return null;
	}

	try {
		const response = await client.markets.getMarketBySlug({ slug });
		return toMarket(response.data);
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}

		logStructError(`getMarketBySlug:${slug}`, error);
		throw error;
	}
});

export const getTraderProfile = cache(async (address: string): Promise<UserProfile | null> => {
	const client = getStructClient();

	if (!client || !address.trim()) {
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
});

export const getTraderPnlSummary = cache(async (address: string): Promise<GlobalPnlTrader | null> => {
	const client = getStructClient();

	if (!client || !address.trim()) {
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
});

export const getMarketsByConditionIds = cache(async (conditionIds: string[]): Promise<MarketMetadata[] | null> => {
	const client = getStructClient();

	if (!client || conditionIds.length === 0) {
		return null;
	}

	try {
		const response = await client.markets.getMarkets({ condition_ids: conditionIds.join(",") });
		return response.data;
	} catch (error) {
		logStructError(`getMarketsByConditionIds:${conditionIds.join(",")}`, error);
		return [];
	}
});

export const getTraderPositions = cache(
	async (
		address: string,
		status: "open" | "closed",
		options?: TraderPositionsOptions,
	): Promise<TraderOutcomePnlEntry[]> => {
		const client = getStructClient();

		if (!client || !address.trim()) {
			return [];
		}

		try {
			const params: GetTraderOutcomePnlRequest = {
				address,
				status,
				limit: defaultPositionsLimit,
				...options,
			};
			const response = await client.trader.getTraderOutcomePnl(params);
			return response.data;
		} catch (error) {
			if (readStatus(error) === 404) {
				return [];
			}

			logStructError(`getTraderPositions:${address}:${status}`, error);
			return [];
		}
	},
);

export const getTraderTrades = cache(
	async (address: string, options?: TraderTradesOptions): Promise<Trade[]> => {
		const client = getStructClient();

		if (!client || !address.trim()) {
			return [];
		}

		try {
			const params: GetTraderTradesRequest = {
				address,
				limit: defaultTradesLimit,
				sort_desc: true,
				...options,
			};
			const response = await client.trader.getTraderTrades(params);
			return response.data;
		} catch (error) {
			if (readStatus(error) === 404) {
				return [];
			}

			logStructError(`getTraderTrades:${address}`, error);
			return [];
		}
	},
);

export const getTraderPositionsPage = cache(
	async (
		address: string,
		status: "open" | "closed",
		options?: TraderPositionsOptions,
	): Promise<PaginatedResource<TraderOutcomePnlEntry, number>> => {
		const client = getStructClient();

		if (!client || !address.trim()) {
			return {
				data: [],
				hasMore: false,
				nextCursor: null,
				pageSize: options?.limit ?? defaultPositionsLimit,
			};
		}

		const limit = options?.limit ?? defaultPositionsLimit;
		const offset = options?.offset ?? 0;

		try {
			const params: GetTraderOutcomePnlRequest = {
				address,
				status,
				limit,
				...options,
			};
			const response = await client.trader.getTraderOutcomePnl(params);
			const hasMore = await hasMoreResults(response, () =>
				client.trader.getTraderOutcomePnl({
					...params,
					limit: 1,
					offset: offset + response.data.length,
				}),
			);
			const nextCursor = hasMore ? offset + response.data.length : null;

			return {
				data: response.data,
				hasMore,
				nextCursor,
				pageSize: limit,
			};
		} catch (error) {
			if (readStatus(error) === 404) {
				return {
					data: [],
					hasMore: false,
					nextCursor: null,
					pageSize: limit,
				};
			}

			logStructError(`getTraderPositionsPage:${address}:${status}`, error);
			return {
				data: [],
				hasMore: false,
				nextCursor: null,
				pageSize: limit,
			};
		}
	},
);

export const getTraderTradesPage = cache(
	async (address: string, options?: TraderTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
		const client = getStructClient();

		if (!client || !address.trim()) {
			return {
				data: [],
				hasMore: false,
				nextCursor: null,
				pageSize: options?.limit ?? defaultTradesLimit,
			};
		}

		const limit = options?.limit ?? defaultTradesLimit;
		const offset = options?.offset ?? 0;

		try {
			const params: GetTraderTradesRequest = {
				address,
				limit,
				sort_desc: true,
				...options,
			};
			const response = await client.trader.getTraderTrades(params);
			const hasMore = await hasMoreResults(response, () =>
				client.trader.getTraderTrades({
					...params,
					limit: 1,
					offset: offset + response.data.length,
				}),
			);
			const nextCursor = hasMore ? offset + response.data.length : null;

			return {
				data: response.data,
				hasMore,
				nextCursor,
				pageSize: limit,
			};
		} catch (error) {
			if (readStatus(error) === 404) {
				return {
					data: [],
					hasMore: false,
					nextCursor: null,
					pageSize: limit,
				};
			}

			logStructError(`getTraderTradesPage:${address}`, error);
			return {
				data: [],
				hasMore: false,
				nextCursor: null,
				pageSize: limit,
			};
		}
	},
);
