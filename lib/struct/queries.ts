import "server-only";

import type {
	BuilderMetadata,
	CategoryEntry,
	Event,
	GlobalEntry,
	MarketEntry,
	MarketResponse,
	PnlCandlestickBar,
	PnlChangesResponse,
	PnlPeriodsResponse,
	PnlRiskResponse,
	PolymarketCategory,
	PositionEntry,
	StructClient,
	Trade,
	Trader,
	TraderWithPnl,
	UserProfile,
} from "@structbuild/sdk";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { PaginatedResource } from "@/lib/struct/types";
import { defaultTraderPositionSortBy } from "@/lib/trader-search-params-shared";
import { normalizeWalletAddress } from "@/lib/utils";

export const defaultTraderTablePageSize = 25;
const defaultPositionsLimit = defaultTraderTablePageSize;
const defaultTradesLimit = defaultTraderTablePageSize;
const defaultCategoriesLimit = defaultTraderTablePageSize;
const defaultMarketsLimit = defaultTraderTablePageSize;
const maxTraderSearchQueryLength = 100;

export type GetTraderPositionPnlRequest = Parameters<StructClient["trader"]["getTraderOutcomePnl"]>[0];
export type GetTraderTradesRequest = Parameters<StructClient["trader"]["getTraderTrades"]>[0];

export type TraderPositionsOptions = Omit<GetTraderPositionPnlRequest, "address" | "status">;
export type TraderTradesPageOptions = Omit<GetTraderTradesRequest, "address">;

function normalizeTraderSearchQuery(query: string) {
	return query.trim().replace(/\s+/g, " ").slice(0, maxTraderSearchQueryLength);
}

function sanitizeLogValue(value: string, maxLength: number = maxTraderSearchQueryLength) {
	const sanitized = value.replace(/[\x00-\x1F\x7F]+/g, " ").trim();
	return sanitized.length > maxLength ? `${sanitized.slice(0, maxLength)}...` : sanitized;
}

class TraderDataUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TraderDataUnavailableError";
	}
}

function isTraderDataUnavailableError(error: unknown) {
	return error instanceof TraderDataUnavailableError;
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
	async (
		query: string,
	): Promise<{
		traders: TraderWithPnl[];
		markets: MarketResponse[];
		events: Event[];
		builders: BuilderMetadata[];
	}> => {
		const client = getStructClient();
		const normalizedQuery = normalizeTraderSearchQuery(query);

		if (!client || normalizedQuery.length < 2) {
			return { traders: [], markets: [], events: [], builders: [] };
		}

		try {
			const response = await client.search.search({
				q: normalizedQuery,
				limit: 10,
				type: "traders,markets,events,builders",
				include_pnl: true,
			});
			return {
				traders: response.data.traders ?? [],
				markets: (response.data.markets ?? []).map(normalizeMarketResponseImages),
				events: ((response.data.events ?? []) as Event[]).map((event) => ({
					...normalizeMarketResponseImages(event),
					markets: (event.markets ?? []).map(normalizeMarketResponseImages),
				})),
				builders: response.data.builders ?? [],
			};
		} catch (error) {
			logStructError(`searchAll:${sanitizeLogValue(normalizedQuery)}`, error);
			return { traders: [], markets: [], events: [], builders: [] };
		}
	},
);

async function fetchTraderProfile(address: string): Promise<UserProfile> {
	const client = getStructClient();

	if (!client) {
		throw new TraderDataUnavailableError("Struct client is not configured");
	}

	try {
		const response = await client.trader.getTraderProfile({ address });

		if (!response.data) {
			throw new TraderDataUnavailableError("Trader profile was empty");
		}

		return response.data;
	} catch (error) {
		if (readStatus(error) === 404) {
			throw new TraderDataUnavailableError("Trader profile was not found");
		}

		throw error;
	}
}

export async function getTraderProfile(address: string): Promise<UserProfile | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	try {
		return await fetchTraderProfile(normalizedAddress);
	} catch (error) {
		if (isTraderDataUnavailableError(error)) {
			return null;
		}
		logStructError(`getTraderProfile:${normalizedAddress}`, error);
		throw error;
	}
}

async function fetchTraderPnlSummary(address: string): Promise<GlobalEntry> {
	const client = getStructClient();

	if (!client) {
		throw new TraderDataUnavailableError("Struct client is not configured");
	}

	try {
		const response = await client.trader.getTraderPnl({ address, timeframe: "lifetime" });

		if (!response.data) {
			throw new TraderDataUnavailableError("Trader PnL summary was empty");
		}

		return response.data;
	} catch (error) {
		if (readStatus(error) === 404) {
			throw new TraderDataUnavailableError("Trader PnL summary was not found");
		}

		throw error;
	}
}

export async function getTraderPnlSummary(address: string): Promise<GlobalEntry | null> {
	const normalizedAddress = normalizeWalletAddress(address);

	if (!normalizedAddress) {
		return null;
	}

	try {
		return await fetchTraderPnlSummary(normalizedAddress);
	} catch (error) {
		if (isTraderDataUnavailableError(error)) {
			return null;
		}
		logStructError(`getTraderPnlSummary:${normalizedAddress}`, error);
		throw error;
	}
}

export async function getMarketsByConditionIds(conditionIds: string[]): Promise<MarketResponse[] | null> {
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

async function fetchTraderPositionsPage(
	address: string,
	status: "open" | "closed",
	options?: TraderPositionsOptions,
): Promise<PaginatedResource<PositionEntry, number>> {
	const client = getStructClient();
	const limit = options?.limit ?? defaultPositionsLimit;

	if (!client) {
		return emptyPage<PositionEntry>(limit);
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
		const params: GetTraderPositionPnlRequest = {
			address,
			status,
			...restOptions,
			limit: requestLimit,
			sort_by: sort_by ?? defaultTraderPositionSortBy[status],
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
			return emptyPage<PositionEntry>(limit);
		}

		logStructError(`getTraderPositionsPage:${address}:${status}`, error);
		return emptyPage<PositionEntry>(limit);
	}
}

export async function getTraderPositionsPage(
	address: string,
	status: "open" | "closed",
	options?: TraderPositionsOptions,
): Promise<PaginatedResource<PositionEntry, number>> {
	const normalizedAddress = normalizeWalletAddress(address);
	const limit = options?.limit ?? defaultPositionsLimit;

	if (!normalizedAddress) {
		return emptyPage<PositionEntry>(limit);
	}

	return fetchTraderPositionsPage(normalizedAddress, status, options);
}


async function fetchTraderTradesPage(
	address: string,
	options?: TraderTradesPageOptions,
): Promise<PaginatedResource<Trade, number>> {
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

	return fetchTraderTradesPage(normalizedAddress, options);
}

export type PnlTimeframe = "1d" | "7d" | "30d" | "lifetime";
export type PnlSortDirection = "asc" | "desc";

export type GetTraderPnlOptions = {
	timeframe?: PnlTimeframe;
};

export type GetTraderPnlCandlesOptions = Parameters<StructClient["trader"]["getTraderPnlCandles"]>[0];
export type GetTraderPnlPeriodsOptions = Parameters<StructClient["trader"]["getTraderPnlPeriods"]>[0];
export type GetTraderPnlRiskOptions = Parameters<StructClient["trader"]["getTraderPnlRisk"]>[0];
export type GetTraderMarketPnlOptions = Parameters<StructClient["trader"]["getTraderMarketPnl"]>[0];
export type GetTraderCategoryPnlOptions = Parameters<StructClient["trader"]["getTraderCategoryPnl"]>[0];
export type GetTraderPositionPnlOptions = Parameters<StructClient["trader"]["getTraderOutcomePnl"]>[0];
export type GetTopTradesMarketsOptions = Parameters<StructClient["trader"]["getTopTradesMarkets"]>[0];
export type GetCategoryTopTradersOptions = Parameters<StructClient["tags"]["getCategoryTopTraders"]>[0];
export type GetMarketTopTradersOptions = Parameters<StructClient["markets"]["getMarketTopTraders"]>[0];
export type GetPositionTopTradersOptions = Parameters<StructClient["markets"]["getPositionTopTraders"]>[0];

export type CursorPage<T> = {
	data: T[];
	nextCursor: string | null;
	hasMore: boolean;
};

function emptyCursorPage<T>(): CursorPage<T> {
	return { data: [], nextCursor: null, hasMore: false };
}

function readCursorPage<T>(response: { data?: T[] | null; pagination?: { has_more: boolean; pagination_key: string | number | null } | undefined }): CursorPage<T> {
	const key = response.pagination?.pagination_key;
	const hasMore = response.pagination?.has_more ?? false;
	const nextCursor = hasMore && key !== null && key !== undefined ? String(key) : null;
	return {
		data: response.data ?? [],
		nextCursor,
		hasMore: hasMore && nextCursor !== null,
	};
}

export async function getTraderPnl(
	address: string,
	options?: GetTraderPnlOptions,
): Promise<GlobalEntry | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnl({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnl:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlCandles(
	address: string,
	options?: Omit<GetTraderPnlCandlesOptions, "address">,
): Promise<PnlCandlestickBar[]> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return [];
	}

	try {
		const response = await client.trader.getTraderPnlCandles({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) {
			return [];
		}
		logStructError(`getTraderPnlCandles:${normalizedAddress}`, error);
		return [];
	}
}

export async function getTraderPnlChanges(
	address: string,
): Promise<PnlChangesResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlChanges({
			address: normalizedAddress,
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlChanges:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlPeriods(
	address: string,
	options?: Omit<GetTraderPnlPeriodsOptions, "address">,
): Promise<PnlPeriodsResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlPeriods({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlPeriods:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlRisk(
	address: string,
	options?: Omit<GetTraderPnlRiskOptions, "address">,
): Promise<PnlRiskResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlRisk({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlRisk:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderMarketPnl(
	address: string,
	options?: Omit<GetTraderMarketPnlOptions, "address">,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.trader.getTraderMarketPnl({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<MarketEntry>();
		}
		logStructError(`getTraderMarketPnl:${normalizedAddress}`, error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getTraderCategoryPnl(
	address: string,
	options?: Omit<GetTraderCategoryPnlOptions, "address">,
): Promise<CursorPage<CategoryEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<CategoryEntry>();
	}

	try {
		const response = await client.trader.getTraderCategoryPnl({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return readCursorPage<CategoryEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<CategoryEntry>();
		}
		logStructError(`getTraderCategoryPnl:${normalizedAddress}`, error);
		return emptyCursorPage<CategoryEntry>();
	}
}

export type TraderCategoriesPageOptions = Omit<GetTraderCategoryPnlOptions, "address">;

async function fetchTraderCategoriesPage(
	address: string,
	options?: TraderCategoriesPageOptions,
): Promise<PaginatedResource<CategoryEntry, number>> {
	const client = getStructClient();
	const limit = options?.limit ?? defaultCategoriesLimit;

	if (!client) {
		return emptyPage<CategoryEntry>(limit);
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
		const response = await client.trader.getTraderCategoryPnl({
			address,
			...restOptions,
			limit: requestLimit,
			sort_by: sort_by ?? "total_volume_usd",
			sort_direction: sort_direction ?? "desc",
		});
		const rows = response.data ?? [];
		const data = rows.slice(0, limit);
		const hasMore = rows.length > limit;
		const nextCursor = hasMore ? offset + data.length : null;
		return {
			data,
			hasMore,
			nextCursor,
			pageSize: limit,
		};
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyPage<CategoryEntry>(limit);
		}

		logStructError(`getTraderCategoriesPage:${address}`, error);
		return emptyPage<CategoryEntry>(limit);
	}
}

export async function getTraderCategoriesPage(
	address: string,
	options?: TraderCategoriesPageOptions,
): Promise<PaginatedResource<CategoryEntry, number>> {
	const normalizedAddress = normalizeWalletAddress(address);
	const limit = options?.limit ?? defaultCategoriesLimit;

	if (!normalizedAddress) {
		return emptyPage<CategoryEntry>(limit);
	}

	return fetchTraderCategoriesPage(normalizedAddress, options);
}

export type TraderMarketsPageOptions = Omit<GetTraderMarketPnlOptions, "address">;

async function fetchTraderMarketsPage(
	address: string,
	options?: TraderMarketsPageOptions,
): Promise<PaginatedResource<MarketEntry, number>> {
	const client = getStructClient();
	const limit = options?.limit ?? defaultMarketsLimit;

	if (!client) {
		return emptyPage<MarketEntry>(limit);
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
		const response = await client.trader.getTraderMarketPnl({
			address,
			...restOptions,
			limit: requestLimit,
			sort_by: sort_by ?? "total_volume_usd",
			sort_direction: sort_direction ?? "desc",
		});
		const rows = response.data ?? [];
		const data = rows.slice(0, limit);
		const hasMore = rows.length > limit;
		const nextCursor = hasMore ? offset + data.length : null;
		return {
			data,
			hasMore,
			nextCursor,
			pageSize: limit,
		};
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyPage<MarketEntry>(limit);
		}

		logStructError(`getTraderMarketsPage:${address}`, error);
		return emptyPage<MarketEntry>(limit);
	}
}

export async function getTraderMarketsPage(
	address: string,
	options?: TraderMarketsPageOptions,
): Promise<PaginatedResource<MarketEntry, number>> {
	const normalizedAddress = normalizeWalletAddress(address);
	const limit = options?.limit ?? defaultMarketsLimit;

	if (!normalizedAddress) {
		return emptyPage<MarketEntry>(limit);
	}

	return fetchTraderMarketsPage(normalizedAddress, options);
}

export async function getTraderOutcomePnl(
	address: string,
	options: Omit<GetTraderPositionPnlOptions, "address">,
): Promise<CursorPage<PositionEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<PositionEntry>();
	}

	try {
		const response = await client.trader.getTraderOutcomePnl({
			address: normalizedAddress,
			...options,
		});
		return readCursorPage<PositionEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<PositionEntry>();
		}
		logStructError(`getTraderOutcomePnl:${normalizedAddress}`, error);
		return emptyCursorPage<PositionEntry>();
	}
}

export async function getTopTradesMarkets(
	options?: GetTopTradesMarketsOptions,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.trader.getTopTradesMarkets(options);
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		logStructError("getTopTradesMarkets", error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getCategoryTopTraders(
	category: PolymarketCategory,
	options?: Omit<GetCategoryTopTradersOptions, "category">,
): Promise<CursorPage<CategoryEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<CategoryEntry>();
	}

	try {
		const response = await client.tags.getCategoryTopTraders({
			category,
			...(options ?? {}),
		});
		return readCursorPage<CategoryEntry>(response);
	} catch (error) {
		logStructError(`getCategoryTopTraders:${category}`, error);
		return emptyCursorPage<CategoryEntry>();
	}
}

export async function getMarketTopTraders(
	options?: GetMarketTopTradersOptions,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.markets.getMarketTopTraders(options);
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<MarketEntry>();
		}
		logStructError("getMarketTopTraders", error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getPositionTopTraders(
	positionId: string,
	options?: Omit<GetPositionTopTradersOptions, "position_id">,
): Promise<CursorPage<PositionEntry>> {
	const client = getStructClient();

	if (!client || !positionId) {
		return emptyCursorPage<PositionEntry>();
	}

	try {
		const response = await client.markets.getPositionTopTraders({
			position_id: positionId,
			...(options ?? {}),
		});
		return readCursorPage<PositionEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<PositionEntry>();
		}
		logStructError(`getPositionTopTraders:${positionId}`, error);
		return emptyCursorPage<PositionEntry>();
	}
}

export async function getRewardsMarkets(): Promise<MarketResponse[]> {
	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.markets.getMarkets({
			has_rewards: true,
			status: "open",
			limit: 25,
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
