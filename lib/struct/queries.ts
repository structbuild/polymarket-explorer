import "server-only";

import type {
	MarketMetadata,
	StructClient,
	Trade,
	Trader,
	TraderOutcomePnlEntry,
	TraderPnlSummary,
	UserProfile,
} from "@structbuild/sdk";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import type { PaginatedResource } from "@/lib/struct/types";

export const defaultTraderTablePageSize = 25;
const defaultPositionsLimit = defaultTraderTablePageSize;
const defaultTradesLimit = defaultTraderTablePageSize;
const maxTraderSearchQueryLength = 100;

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

export const getTraderPnlSummary = cache(async (address: string): Promise<TraderPnlSummary | null> => {
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
			const requestLimit = limit + 1;
			const params: GetTraderOutcomePnlRequest = {
				address,
				status,
				limit: requestLimit,
				sort_by: status === "open" ? "current_value" : "realized_pnl_usd",
				sort_direction: "desc",
				...options,
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
			const requestLimit = limit + 1;
			const params: GetTraderTradesRequest = {
				address,
				limit: requestLimit,
				sort_desc: true,
				...options,
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
