"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import {
	defaultTraderTablePageSize,
	getTraderPositionsPage,
	getTraderTradesPage,
	searchAll,
	searchTraders,
	structRewardsMarketsCacheTag,
	structTraderPositionsCacheTag,
	structTraderTradesCacheTag,
} from "@/lib/struct/queries";
import {
	defaultMarketTradesPageSize,
	getMarketHolders,
	getMarketHoldersHistory,
	getMarketPriceJumps,
	getMarketsByTag,
	getTopMarkets,
	getMarketTradesPage,
} from "@/lib/struct/market-queries";
import { getBuilderGlobalTags } from "@/lib/struct/builder-queries";
import {
	getBuilderSortOptionsForTimeframe,
	parseBuilderTimeframe,
} from "@/lib/struct/builder-shared";
import {
	defaultMarketDetailTab,
	marketDetailTabValues,
	maxMarketTradesPageNumber,
	type MarketDetailTab,
} from "@/lib/market-detail-search-params-shared";
import {
	DEFAULT_MARKET_STATUS_TAB,
	defaultMarketSortBy,
	defaultMarketSortDirection,
	defaultMarketTimeframe,
	marketSortByValues,
	marketSortDirectionValues,
	marketStatusTabValues,
	marketTimeframeValues,
	type MarketSortBy,
	type MarketSortDirection,
	type MarketStatusTab,
	type MarketTimeframe,
} from "@/lib/market-search-params-shared";
import { marketResponseToRow } from "@/lib/market-table-map";
import {
	maxTraderPageNumber,
	defaultTraderPositionSortBy,
	type TraderPositionSortBy,
	type TraderSortDirection,
	type TraderTab,
	traderPositionSortByValues,
	traderSortDirectionValues,
	traderTabValues,
} from "@/lib/trader-search-params-shared";

export type SearchResultMarket = {
	slug: string;
	question: string | null;
	image_url: string | null;
	volume_lifetime_usd: number | null;
	volume_24hr_usd: number | null;
	status: string | null;
	outcomes: { name: string; price: number | null }[];
};

export type SearchResultTrader = {
	address: string;
	name: string | null;
	pseudonym: string | null;
	profile_image: string | null;
	volume_usd: number | null;
};

export type SearchResult = {
	traders: SearchResultTrader[];
	markets: SearchResultMarket[];
};

function clampPageNumber(pageNumber: number, maxPageNumber: number) {
	if (!Number.isSafeInteger(pageNumber)) {
		return 1;
	}

	return Math.min(Math.max(pageNumber, 1), maxPageNumber);
}

function parseTraderPageSearchParam(params: URLSearchParams, key: string) {
	const raw = params.get(key);
	if (!raw) {
		return 1;
	}

	return clampPageNumber(Number.parseInt(raw, 10), maxTraderPageNumber);
}

function parseTraderSortByParam(
	params: URLSearchParams,
	key: string,
	fallback: TraderPositionSortBy,
) {
	const raw = params.get(key);
	return traderPositionSortByValues.includes(raw as TraderPositionSortBy)
		? (raw as TraderPositionSortBy)
		: fallback;
}

function parseTraderSortDirectionParam(params: URLSearchParams, key: string) {
	const raw = params.get(key);
	return traderSortDirectionValues.includes(raw as TraderSortDirection)
		? (raw as TraderSortDirection)
		: "desc";
}

function parseTraderTab(value: TraderTab) {
	return traderTabValues.includes(value) ? value : "active";
}

function parseMarketDetailTab(value: MarketDetailTab) {
	return marketDetailTabValues.includes(value) ? value : defaultMarketDetailTab;
}

function parseMarketStatus(value: MarketStatusTab) {
	return marketStatusTabValues.includes(value) ? value : DEFAULT_MARKET_STATUS_TAB;
}

function parseMarketSortBy(value: MarketSortBy) {
	return marketSortByValues.includes(value) ? value : defaultMarketSortBy;
}

function parseMarketSortDirection(value: MarketSortDirection) {
	return marketSortDirectionValues.includes(value) ? value : defaultMarketSortDirection;
}

function parseMarketTimeframe(value: MarketTimeframe) {
	return marketTimeframeValues.includes(value) ? value : defaultMarketTimeframe;
}

function parseMarketTradesPageParam(params: URLSearchParams) {
	const raw = params.get("tradesPage");
	if (!raw) {
		return 1;
	}

	return clampPageNumber(Number.parseInt(raw, 10), maxMarketTradesPageNumber);
}

export async function getMarketsStatusPageAction({
	tab,
	sortBy,
	sortDirection,
	timeframe,
}: {
	tab: MarketStatusTab;
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	timeframe: MarketTimeframe;
}) {
	const safeTab = parseMarketStatus(tab);
	const safeSortBy = parseMarketSortBy(sortBy);
	const safeSortDirection = parseMarketSortDirection(sortDirection);
	const safeTimeframe = parseMarketTimeframe(timeframe);
	const result = await getTopMarkets(24, safeTab, undefined, safeSortBy, safeSortDirection, safeTimeframe);

	return {
		tab: safeTab,
		sortBy: safeSortBy,
		sortDirection: safeSortDirection,
		timeframe: safeTimeframe,
		markets: result.data.map(marketResponseToRow),
		hasMore: result.hasMore,
		nextCursor: result.nextCursor,
	};
}

export async function getTagMarketsStatusPageAction({
	tagLabel,
	tab,
}: {
	tagLabel: string;
	tab: MarketStatusTab;
}) {
	const safeTab = parseMarketStatus(tab);
	const result = await getMarketsByTag(tagLabel, 24, undefined, "volume", "desc", safeTab);

	return {
		tab: safeTab,
		markets: result.data.map(marketResponseToRow),
		hasMore: result.hasMore,
		nextCursor: result.nextCursor,
	};
}

export async function getTraderPositionsPageAction({
	address,
	status,
	pageNumber,
	sortBy,
	sortDirection,
}: {
	address: string;
	status: "open" | "closed";
	pageNumber: number;
	sortBy: TraderPositionSortBy;
	sortDirection: TraderSortDirection;
}) {
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderPositionsPage(address, status, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getTraderTabPageAction({
	address,
	tab,
	search,
}: {
	address: string;
	tab: TraderTab;
	search: string;
}) {
	const params = new URLSearchParams(search);
	const safeTab = parseTraderTab(tab);

	if (safeTab === "activity") {
		const pageNumber = parseTraderPageSearchParam(params, "activityPage");
		const page = await getTraderTradesPage(address, {
			limit: defaultTraderTablePageSize,
			offset: (pageNumber - 1) * defaultTraderTablePageSize,
			sort_desc: true,
		});

		return {
			kind: "activity" as const,
			address,
			pageNumber,
			page,
		};
	}

	const status: "open" | "closed" = safeTab === "closed" ? "closed" : "open";
	const pageKey = status === "closed" ? "closedPage" : "openPage";
	const sortByKey = status === "closed" ? "closedSortBy" : "openSortBy";
	const sortDirectionKey = status === "closed" ? "closedSortDirection" : "openSortDirection";
	const pageNumber = parseTraderPageSearchParam(params, pageKey);
	const sortBy = parseTraderSortByParam(params, sortByKey, defaultTraderPositionSortBy[status]);
	const sortDirection = parseTraderSortDirectionParam(params, sortDirectionKey);
	const page = await getTraderPositionsPage(address, status, {
		limit: defaultTraderTablePageSize,
		offset: (pageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
	});

	return {
		kind: "positions" as const,
		address,
		status,
		pageNumber,
		sortBy,
		sortDirection,
		page,
	};
}

export async function getTraderActivityPageAction({
	address,
	pageNumber,
}: {
	address: string;
	pageNumber: number;
}) {
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderTradesPage(address, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_desc: true,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getMarketTradesPageAction({
	conditionId,
	pageNumber,
}: {
	conditionId: string;
	pageNumber: number;
}) {
	const safePageNumber = clampPageNumber(pageNumber, maxMarketTradesPageNumber);
	const page = await getMarketTradesPage(conditionId, {
		limit: defaultMarketTradesPageSize,
		offset: (safePageNumber - 1) * defaultMarketTradesPageSize,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getMarketTabPageAction({
	slug,
	conditionId,
	tab,
	search,
}: {
	slug: string;
	conditionId: string;
	tab: MarketDetailTab;
	search: string;
}) {
	const params = new URLSearchParams(search);
	const safeTab = parseMarketDetailTab(tab);

	switch (safeTab) {
		case "holders": {
			const data = await getMarketHolders(slug, 25);
			return {
				kind: "holders" as const,
				slug,
				conditionId,
				data,
			};
		}
		case "spikes": {
			const jumps = await getMarketPriceJumps(conditionId);
			const spikes = (jumps ?? []).slice().sort((a, b) => b.from - a.from);
			return {
				kind: "spikes" as const,
				slug,
				conditionId,
				spikes,
			};
		}
		case "holders-history": {
			const candles = await getMarketHoldersHistory(conditionId);
			const data = (candles ?? [])
				.filter((c): c is { t: number; h: number } => Number.isFinite(c.t) && Number.isFinite(c.h))
				.sort((a, b) => a.t - b.t);
			return {
				kind: "holders-history" as const,
				slug,
				conditionId,
				data,
			};
		}
		case "trades":
		default: {
			const pageNumber = parseMarketTradesPageParam(params);
			const page = await getMarketTradesPage(conditionId, {
				limit: defaultMarketTradesPageSize,
				offset: (pageNumber - 1) * defaultMarketTradesPageSize,
			});
			return {
				kind: "trades" as const,
				slug,
				conditionId,
				pageNumber,
				page,
			};
		}
	}
}

export async function getBuilderGlobalTagsAction({
	sort,
	timeframe,
}: {
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
}) {
	const safeTimeframe = parseBuilderTimeframe(timeframe);
	const safeSort = getBuilderSortOptionsForTimeframe(safeTimeframe).includes(sort)
		? sort
		: "volume";
	const result = await getBuilderGlobalTags(safeSort, safeTimeframe, 12);

	return {
		rows: result.data,
		sort: safeSort,
		timeframe: safeTimeframe,
	};
}

export async function searchTradersAction(query: string) {
	const results = await searchTraders(query);
	return results.map((t) => ({
		address: t.address,
		name: t.name ?? null,
		pseudonym: t.pseudonym ?? null,
		profile_image: t.profile_image ?? null,
	}));
}

export async function searchAction(query: string): Promise<SearchResult> {
	const { traders, markets, events } = await searchAll(query);

	const merged = new Map<string, SearchResultMarket>();

	for (const m of markets) {
		if (!m.market_slug) continue;
		const extra = m as { volume_24hr?: number | null };
		merged.set(m.market_slug, {
			slug: m.market_slug,
			question: m.question ?? m.title ?? null,
			image_url: m.image_url ?? null,
			volume_lifetime_usd: m.metrics?.lifetime?.volume ?? m.volume_usd ?? null,
			volume_24hr_usd: extra.volume_24hr ?? m.metrics?.["24h"]?.volume ?? null,
			status: m.status ?? null,
			outcomes: (m.outcomes ?? []).map((o) => ({ name: o.name, price: o.price ?? null })),
		});
	}

	for (const event of events) {
		for (const m of event.markets) {
			if (!m.market_slug || merged.has(m.market_slug)) continue;
			merged.set(m.market_slug, {
				slug: m.market_slug,
				question: m.question ?? m.title ?? null,
				image_url: m.image_url ?? event.image_url ?? null,
				volume_lifetime_usd: m.volume ?? null,
				volume_24hr_usd: m.volume_24hr ?? null,
				status: m.status ?? null,
				outcomes: (m.outcomes ?? []).map((o) => ({ name: o.name, price: o.price ?? null })),
			});
		}
	}

	return {
		traders: traders.map((t) => ({
			address: t.address,
			name: t.name ?? null,
			pseudonym: t.pseudonym ?? null,
			profile_image: t.profile_image ?? null,
			volume_usd: t.pnl?.total_volume_usd ?? null,
		})),
		markets: Array.from(merged.values()),
	};
}

export async function refreshTraderTabAction(pathname: string, kind: "positions" | "activity") {
	if (!pathname.startsWith("/traders/")) {
		throw new Error("Invalid trader pathname");
	}

	updateTag(kind === "positions" ? structTraderPositionsCacheTag : structTraderTradesCacheTag);
	revalidatePath(pathname);
}

export async function refreshRewardsPageAction() {
	updateTag(structRewardsMarketsCacheTag);
	revalidatePath("/rewards");
}
