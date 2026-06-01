import "server-only";

import type {
	BuilderMetadata,
	CategoryEntry,
	Event,
	EventEntry,
	GlobalEntry,
	MarketEntry,
	MarketResponse,
	PnlV3CandlestickBar,
	PnlV3ChangesResponse,
	PnlV3PeriodsResponse,
	PnlV3RiskResponse,
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

export type GetTraderPositionPnlV3Request = Parameters<StructClient["trader"]["getTraderPositionPnlV3"]>[0];
export type GetTraderTradesRequest = Parameters<StructClient["trader"]["getTraderTrades"]>[0];

export type TraderPositionsOptions = Omit<GetTraderPositionPnlV3Request, "address" | "status">;
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
		const response = await client.trader.getTraderPnlV3({ address, timeframe: "lifetime" });

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
		const params: GetTraderPositionPnlV3Request = {
			address,
			status,
			...restOptions,
			limit: requestLimit,
			sort_by: sort_by ?? defaultTraderPositionSortBy[status],
			sort_direction: sort_direction ?? "desc",
		};
		const response = await client.trader.getTraderPositionPnlV3(params);
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

export type PnlV3Timeframe = "1d" | "7d" | "30d" | "lifetime";
export type PnlV3SortDirection = "asc" | "desc";

export type GetTraderPnlV3Options = {
	timeframe?: PnlV3Timeframe;
};

export type GetTraderPnlV3CandlesOptions = Parameters<StructClient["trader"]["getTraderPnlV3Candles"]>[0];
export type GetTraderPnlV3PeriodsOptions = Parameters<StructClient["trader"]["getTraderPnlV3Periods"]>[0];
export type GetTraderPnlV3RiskOptions = Parameters<StructClient["trader"]["getTraderPnlV3Risk"]>[0];
export type GetTraderMarketPnlV3Options = Parameters<StructClient["trader"]["getTraderMarketPnlV3"]>[0];
export type GetTraderEventPnlV3Options = Parameters<StructClient["trader"]["getTraderEventPnlV3"]>[0];
export type GetTraderCategoryPnlV3Options = Parameters<StructClient["trader"]["getTraderCategoryPnlV3"]>[0];
export type GetTraderPositionPnlV3Options = Parameters<StructClient["trader"]["getTraderPositionPnlV3"]>[0];
export type GetTopTradesMarketsV3Options = Parameters<StructClient["trader"]["getTopTradesMarketsV3"]>[0];
export type GetCategoryTopTradersV3Options = Parameters<StructClient["tags"]["getCategoryTopTradersV3"]>[0];
export type GetEventTopTradersV3Options = Parameters<StructClient["events"]["getEventTopTradersV3"]>[0];
export type GetMarketTopTradersV3Options = Parameters<StructClient["markets"]["getMarketTopTradersV3"]>[0];
export type GetPositionTopTradersV3Options = Parameters<StructClient["markets"]["getPositionTopTradersV3"]>[0];

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

export async function getTraderPnlV3(
	address: string,
	options?: GetTraderPnlV3Options,
): Promise<GlobalEntry | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlV3({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlV3:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlV3Candles(
	address: string,
	options?: Omit<GetTraderPnlV3CandlesOptions, "address">,
): Promise<PnlV3CandlestickBar[]> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return [];
	}

	try {
		const response = await client.trader.getTraderPnlV3Candles({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) {
			return [];
		}
		logStructError(`getTraderPnlV3Candles:${normalizedAddress}`, error);
		return [];
	}
}

export async function getTraderPnlV3Changes(
	address: string,
): Promise<PnlV3ChangesResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlV3Changes({
			address: normalizedAddress,
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlV3Changes:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlV3Periods(
	address: string,
	options?: Omit<GetTraderPnlV3PeriodsOptions, "address">,
): Promise<PnlV3PeriodsResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlV3Periods({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlV3Periods:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderPnlV3Risk(
	address: string,
	options?: Omit<GetTraderPnlV3RiskOptions, "address">,
): Promise<PnlV3RiskResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return null;
	}

	try {
		const response = await client.trader.getTraderPnlV3Risk({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}
		logStructError(`getTraderPnlV3Risk:${normalizedAddress}`, error);
		return null;
	}
}

export async function getTraderMarketPnlV3(
	address: string,
	options?: Omit<GetTraderMarketPnlV3Options, "address">,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.trader.getTraderMarketPnlV3({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<MarketEntry>();
		}
		logStructError(`getTraderMarketPnlV3:${normalizedAddress}`, error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getTraderEventPnlV3(
	address: string,
	options?: Omit<GetTraderEventPnlV3Options, "address">,
): Promise<CursorPage<EventEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<EventEntry>();
	}

	try {
		const response = await client.trader.getTraderEventPnlV3({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return readCursorPage<EventEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<EventEntry>();
		}
		logStructError(`getTraderEventPnlV3:${normalizedAddress}`, error);
		return emptyCursorPage<EventEntry>();
	}
}

export async function getTraderCategoryPnlV3(
	address: string,
	options?: Omit<GetTraderCategoryPnlV3Options, "address">,
): Promise<CursorPage<CategoryEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<CategoryEntry>();
	}

	try {
		const response = await client.trader.getTraderCategoryPnlV3({
			address: normalizedAddress,
			...(options ?? {}),
		});
		return readCursorPage<CategoryEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<CategoryEntry>();
		}
		logStructError(`getTraderCategoryPnlV3:${normalizedAddress}`, error);
		return emptyCursorPage<CategoryEntry>();
	}
}

export type TraderCategoriesPageOptions = Omit<GetTraderCategoryPnlV3Options, "address">;

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
		const response = await client.trader.getTraderCategoryPnlV3({
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

export type TraderMarketsPageOptions = Omit<GetTraderMarketPnlV3Options, "address">;

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
		const response = await client.trader.getTraderMarketPnlV3({
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

export async function getTraderPositionPnlV3(
	address: string,
	options: Omit<GetTraderPositionPnlV3Options, "address">,
): Promise<CursorPage<PositionEntry>> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);

	if (!client || !normalizedAddress) {
		return emptyCursorPage<PositionEntry>();
	}

	try {
		const response = await client.trader.getTraderPositionPnlV3({
			address: normalizedAddress,
			...options,
		});
		return readCursorPage<PositionEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<PositionEntry>();
		}
		logStructError(`getTraderPositionPnlV3:${normalizedAddress}`, error);
		return emptyCursorPage<PositionEntry>();
	}
}

export async function getTopTradesMarketsV3(
	options?: GetTopTradesMarketsV3Options,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.trader.getTopTradesMarketsV3(options);
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		logStructError("getTopTradesMarketsV3", error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getCategoryTopTradersV3(
	category: PolymarketCategory,
	options?: Omit<GetCategoryTopTradersV3Options, "category">,
): Promise<CursorPage<CategoryEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<CategoryEntry>();
	}

	try {
		const response = await client.tags.getCategoryTopTradersV3({
			category,
			...(options ?? {}),
		});
		return readCursorPage<CategoryEntry>(response);
	} catch (error) {
		logStructError(`getCategoryTopTradersV3:${category}`, error);
		return emptyCursorPage<CategoryEntry>();
	}
}

export async function getEventTopTradersV3(
	eventSlug: string,
	options?: Omit<GetEventTopTradersV3Options, "event_slug">,
): Promise<CursorPage<EventEntry>> {
	const client = getStructClient();

	if (!client || !eventSlug) {
		return emptyCursorPage<EventEntry>();
	}

	try {
		const response = await client.events.getEventTopTradersV3({
			event_slug: eventSlug,
			...(options ?? {}),
		});
		return readCursorPage<EventEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<EventEntry>();
		}
		logStructError(`getEventTopTradersV3:${eventSlug}`, error);
		return emptyCursorPage<EventEntry>();
	}
}

export async function getMarketTopTradersV3(
	options?: GetMarketTopTradersV3Options,
): Promise<CursorPage<MarketEntry>> {
	const client = getStructClient();

	if (!client) {
		return emptyCursorPage<MarketEntry>();
	}

	try {
		const response = await client.markets.getMarketTopTradersV3(options);
		return readCursorPage<MarketEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<MarketEntry>();
		}
		logStructError("getMarketTopTradersV3", error);
		return emptyCursorPage<MarketEntry>();
	}
}

export async function getPositionTopTradersV3(
	positionId: string,
	options?: Omit<GetPositionTopTradersV3Options, "position_id">,
): Promise<CursorPage<PositionEntry>> {
	const client = getStructClient();

	if (!client || !positionId) {
		return emptyCursorPage<PositionEntry>();
	}

	try {
		const response = await client.markets.getPositionTopTradersV3({
			position_id: positionId,
			...(options ?? {}),
		});
		return readCursorPage<PositionEntry>(response);
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyCursorPage<PositionEntry>();
		}
		logStructError(`getPositionTopTradersV3:${positionId}`, error);
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
