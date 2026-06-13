"use server";

import { revalidatePath } from "next/cache";
import type { BuilderSortBy, BuilderTimeframe, MarketEntry, PnlTimeframe, PolymarketCategory } from "@structbuild/sdk";
import { checkBotId } from "botid/server";

import {
	defaultTraderTablePageSize,
	getPositionTopTraders,
	getTopTradesMarkets,
	getTraderCategoriesPage,
	getTraderMarketsPage,
	getTraderPositionsPage,
	getTraderTradesPage,
	searchAll,
	searchTraders,
} from "@/lib/struct/queries";
import {
	defaultMarketTradesPageSize,
	getPositionVolumeChart,
	getMarketsByTag,
	getTopMarkets,
	getMarketTradesPage,
	toVolumePoints,
} from "@/lib/struct/market-queries";
import { getEventsByTag } from "@/lib/struct/queries/events";
import { eventResponseToRow } from "@/lib/event-table-map";
import { parseEventStatusTab, type EventStatusTab } from "@/lib/event-search-params-shared";
import {
	defaultBuilderTradesPageSize,
	getBuilderGlobalTags,
	getBuilderTradesPage,
} from "@/lib/struct/builder-queries";
import { getBuildersStackedData } from "@/lib/struct/builders-stacked";
import { maxBuilderTradesPageNumber } from "@/lib/builder-search-params-shared";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";
import {
	parseAnalyticsParams,
	type AnalyticsQuerySource,
	type AnalyticsRange,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";
import { loadAnalyticsSectionData } from "@/lib/struct/analytics-section-data";
import { HOME_ACTIVITY_TABS, type HomeActivityTab } from "@/lib/home-activity";
import { loadHomeActivityData } from "@/lib/struct/home-activity.server";
import {
	getTraderChartExits,
	getTraderPnlCandles,
	getTraderPnlRisk,
} from "@/lib/struct/pnl";
import { resolvePnlRange } from "@/lib/struct/pnl-range";
import {
	PNL_RISK_TIMEFRAMES,
	pnlAnchorValues,
	pnlTimeframeValues,
	type PnlAnchor,
	type PnlTimeframe as TraderPnlTimeframe,
} from "@/lib/struct/pnl-timeframes";
import {
	DEFAULT_BUILDERS_STACKED_TOP_N,
	parseBuildersStackedMetric,
	parseBuildersStackedResolution,
	type BuildersStackedMetric,
} from "@/lib/struct/builders-stacked-shared";
import {
	getBuilderSortOptionsForTimeframe,
	parseBuilderTimeframe,
} from "@/lib/struct/builder-shared";
import {
	maxMarketTradesPageNumber,
} from "@/lib/market-detail-search-params-shared";
import { loadMarketTabPage, type MarketTabPageParams } from "@/lib/struct/market-tab-page";
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
import { parsePolymarketCategory } from "@/lib/tag-category";
import { normalizeWalletAddress } from "@/lib/utils";
import {
	maxTraderPageNumber,
	defaultTraderPositionSortBy,
	rankedPositionSortBy,
	rankedPositionSortDirection,
	defaultTraderCategorySortBy,
	defaultTraderMarketSortBy,
	type TraderCategorySortBy,
	type TraderExitMode,
	type TraderMarketSortBy,
	type TraderPositionSortBy,
	type TraderSortDirection,
	type TraderTab,
	traderCategorySortByValues,
	traderMarketSortByValues,
	traderPositionSortByValues,
	traderSortDirectionValues,
	traderTabValues,
} from "@/lib/trader-search-params-shared";

export type SearchResultMarket = {
	slug: string;
	question: string | null;
	image_url: string | null;
	volume_lifetime_usd: number | null;
	volume_lifetime_shares: number | null;
	volume_24hr_usd: number | null;
	volume_24hr_shares: number | null;
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

export type SearchResultBuilder = {
	builder_code: string;
	name: string | null;
	icon_url: string | null;
};

export type SearchResultEvent = {
	slug: string;
	title: string | null;
	image_url: string | null;
	market_count: number;
	status: string | null;
	volume_lifetime_usd: number | null;
	volume_24hr_usd: number | null;
	end_time: number | null;
};

async function assertHumanRequest() {
	const verification = await checkBotId();
	if (verification.isBot) {
		throw new Error("Access denied");
	}
}

export type SearchResult = {
	traders: SearchResultTrader[];
	events: SearchResultEvent[];
	markets: SearchResultMarket[];
	builders: SearchResultBuilder[];
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

function parseTraderCategorySortByParam(params: URLSearchParams) {
	const raw = params.get("categoriesSortBy");
	return traderCategorySortByValues.includes(raw as TraderCategorySortBy)
		? (raw as TraderCategorySortBy)
		: defaultTraderCategorySortBy;
}

function parseTraderMarketSortByParam(params: URLSearchParams) {
	const raw = params.get("marketsSortBy");
	return traderMarketSortByValues.includes(raw as TraderMarketSortBy)
		? (raw as TraderMarketSortBy)
		: defaultTraderMarketSortBy;
}

function parseTraderTab(value: TraderTab) {
	return traderTabValues.includes(value) ? value : "active";
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
	await assertHumanRequest();
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
	await assertHumanRequest();
	const safeTab = parseMarketStatus(tab);
	const result = await getMarketsByTag(tagLabel, 24, undefined, "volume", "desc", safeTab);

	return {
		tab: safeTab,
		markets: result.data.map(marketResponseToRow),
		hasMore: result.hasMore,
		nextCursor: result.nextCursor,
	};
}

export async function getTagEventsStatusPageAction({
	tagSlug,
	tab,
}: {
	tagSlug: string;
	tab: EventStatusTab;
}) {
	await assertHumanRequest();
	const safeTab = parseEventStatusTab(tab);
	const result = await getEventsByTag(tagSlug, 24, safeTab, undefined, "volume", "desc", "24h");

	return {
		tab: safeTab,
		events: result.data.map(eventResponseToRow),
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
	category,
}: {
	address: string;
	status: "open" | "closed";
	pageNumber: number;
	sortBy: TraderPositionSortBy;
	sortDirection: TraderSortDirection;
	category?: PolymarketCategory | null;
}) {
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderPositionsPage(address, status, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
		...(category ? { category } : {}),
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
	await assertHumanRequest();
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

	if (safeTab === "categories") {
		const pageNumber = parseTraderPageSearchParam(params, "categoriesPage");
		const sortBy = parseTraderCategorySortByParam(params);
		const sortDirection = parseTraderSortDirectionParam(params, "categoriesSortDirection");
		const page = await getTraderCategoriesPage(address, {
			limit: defaultTraderTablePageSize,
			offset: (pageNumber - 1) * defaultTraderTablePageSize,
			sort_by: sortBy,
			sort_direction: sortDirection,
		});

		return {
			kind: "categories" as const,
			address,
			pageNumber,
			sortBy,
			sortDirection,
			page,
		};
	}

	if (safeTab === "markets") {
		const pageNumber = parseTraderPageSearchParam(params, "marketsPage");
		const sortBy = parseTraderMarketSortByParam(params);
		const sortDirection = parseTraderSortDirectionParam(params, "marketsSortDirection");
		const page = await getTraderMarketsPage(address, {
			limit: defaultTraderTablePageSize,
			offset: (pageNumber - 1) * defaultTraderTablePageSize,
			sort_by: sortBy,
			sort_direction: sortDirection,
		});

		return {
			kind: "markets" as const,
			address,
			pageNumber,
			sortBy,
			sortDirection,
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
	const category = parsePolymarketCategory(params.get("positionsCategory") ?? undefined) ?? undefined;
	const page = await getTraderPositionsPage(address, status, {
		limit: defaultTraderTablePageSize,
		offset: (pageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
		...(category ? { category } : {}),
	});

	return {
		kind: "positions" as const,
		address,
		status,
		pageNumber,
		sortBy,
		sortDirection,
		category,
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
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderTradesPage(address, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_desc: true,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getTraderCategoriesPageAction({
	address,
	pageNumber,
	sortBy,
	sortDirection,
}: {
	address: string;
	pageNumber: number;
	sortBy: TraderCategorySortBy;
	sortDirection: TraderSortDirection;
}) {
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderCategoriesPage(address, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getTraderMarketsPageAction({
	address,
	pageNumber,
	sortBy,
	sortDirection,
}: {
	address: string;
	pageNumber: number;
	sortBy: TraderMarketSortBy;
	sortDirection: TraderSortDirection;
}) {
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderMarketsPage(address, {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_by: sortBy,
		sort_direction: sortDirection,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getTraderRankedPositionsPageAction({
	address,
	mode,
	pageNumber,
}: {
	address: string;
	mode: TraderExitMode;
	pageNumber: number;
}) {
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxTraderPageNumber);
	const page = await getTraderPositionsPage(address, "closed", {
		limit: defaultTraderTablePageSize,
		offset: (safePageNumber - 1) * defaultTraderTablePageSize,
		sort_by: rankedPositionSortBy,
		sort_direction: rankedPositionSortDirection[mode],
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
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxMarketTradesPageNumber);
	const page = await getMarketTradesPage(conditionId, {
		limit: defaultMarketTradesPageSize,
		offset: (safePageNumber - 1) * defaultMarketTradesPageSize,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getBuilderTradesPageAction({
	builderCode,
	pageNumber,
}: {
	builderCode: string;
	pageNumber: number;
}) {
	await assertHumanRequest();
	const safePageNumber = clampPageNumber(pageNumber, maxBuilderTradesPageNumber);
	const page = await getBuilderTradesPage(builderCode, {
		limit: defaultBuilderTradesPageSize,
		offset: (safePageNumber - 1) * defaultBuilderTradesPageSize,
	});

	return { page, pageNumber: safePageNumber };
}

export async function getMarketTabPageAction(params: MarketTabPageParams) {
	await assertHumanRequest();
	return loadMarketTabPage(params);
}

export async function getMarketPositionTopTradersAction({
	positionId,
}: {
	positionId: string;
}) {
	await assertHumanRequest();
	if (!positionId) {
		return { positionId, traders: [] };
	}

	const { data } = await getPositionTopTraders(positionId, { limit: 20 });
	return { positionId, traders: data };
}

const BEST_TRADES_TIMEFRAME_SET = new Set<PnlTimeframe>(["1d", "7d", "30d", "lifetime"]);

export async function getBestTradesAction({
	timeframe,
	limit,
}: {
	timeframe: PnlTimeframe;
	limit: number;
}): Promise<{ timeframe: PnlTimeframe; rows: MarketEntry[] }> {
	await assertHumanRequest();
	const safeTimeframe = BEST_TRADES_TIMEFRAME_SET.has(timeframe) ? timeframe : "1d";
	const { data } = await getTopTradesMarkets({
		timeframe: safeTimeframe,
		limit,
	});
	return { timeframe: safeTimeframe, rows: data };
}

export async function getBuilderGlobalTagsAction({
	sort,
	timeframe,
}: {
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
}) {
	await assertHumanRequest();
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

export async function getBuildersStackedDataAction({
	metric,
	timeframe,
	resolution,
}: {
	metric: BuildersStackedMetric;
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
}) {
	await assertHumanRequest();
	const safeTimeframe = parseBuilderTimeframe(timeframe);
	const safeMetric = parseBuildersStackedMetric(metric, safeTimeframe);
	const safeResolution = parseBuildersStackedResolution(safeTimeframe, resolution);

	return getBuildersStackedData({
		topN: DEFAULT_BUILDERS_STACKED_TOP_N,
		timeframe: safeTimeframe,
		resolution: safeResolution,
		metric: safeMetric,
	});
}

export async function getAnalyticsSectionDataAction({
	source,
	range,
	resolution,
	view,
	defaultRange,
	showKpis,
}: {
	source: AnalyticsQuerySource;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	view: AnalyticsView;
	defaultRange: AnalyticsRange;
	showKpis: boolean;
}) {
	await assertHumanRequest();
	const scope = source.kind === "global" || source.kind === "builderGlobal" ? "global" : "scoped";
	const safe = parseAnalyticsParams({ range, resolution, view }, scope, defaultRange);

	return loadAnalyticsSectionData({
		source,
		range: safe.range,
		resolution: safe.resolution,
		view: safe.view,
		showKpis,
	});
}

export async function getHomeActivityDataAction(tab: HomeActivityTab) {
	await assertHumanRequest();
	const safeTab = HOME_ACTIVITY_TABS.includes(tab) ? tab : "trades";
	return loadHomeActivityData(safeTab);
}

export async function getMarketPositionVolumeAction({
	positionId,
	name,
	outcomeIndex,
}: {
	positionId: string;
	name: string;
	outcomeIndex: number;
}) {
	await assertHumanRequest();
	if (!positionId) return null;
	const points = await getPositionVolumeChart(positionId);
	const data = toVolumePoints(points);

	return data.length > 0 ? { name, outcomeIndex, data } : null;
}

export async function getTraderPnlViewAction({
	address,
	timeframe,
	anchor,
	from,
	to,
	fillGaps,
	timezone,
}: {
	address: string;
	timeframe: TraderPnlTimeframe;
	anchor: PnlAnchor | null;
	from: number | null;
	to: number | null;
	fillGaps: boolean;
	timezone: string;
}) {
	await assertHumanRequest();
	const normalizedAddress = normalizeWalletAddress(address);
	if (!normalizedAddress) throw new Error("Invalid trader address");

	const safeTimeframe = pnlTimeframeValues.includes(timeframe) ? timeframe : "all";
	const safeAnchor = anchor && pnlAnchorValues.includes(anchor) ? anchor : null;
	const safeFrom = typeof from === "number" && Number.isFinite(from) ? Math.trunc(from) : null;
	const safeTo = typeof to === "number" && Number.isFinite(to) ? Math.trunc(to) : null;
	const safeFillGaps = fillGaps === true;
	let safeTimezone = "UTC";
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
		safeTimezone = timezone;
	} catch {
		// Keep UTC for invalid client input.
	}

	const range = resolvePnlRange({
		timeframe: safeTimeframe,
		anchor: safeAnchor,
		from: safeFrom,
		to: safeTo,
		tz: safeTimezone,
	});
	const [candles, exits, risk] = await Promise.all([
		getTraderPnlCandles(normalizedAddress, range.apiTimeframe, range.resolution, {
			from: range.from,
			to: range.to,
			fillGaps: safeFillGaps,
		}),
		getTraderChartExits(normalizedAddress, { from: range.from, to: range.to }),
		getTraderPnlRisk(normalizedAddress, PNL_RISK_TIMEFRAMES[range.timeframe]),
	]);

	return { range, fillGaps: safeFillGaps, candles, exits, risk };
}

export async function searchTradersAction(query: string) {
	await assertHumanRequest();
	const results = await searchTraders(query);
	return results.map((t) => ({
		address: t.address,
		name: t.name ?? null,
		pseudonym: t.pseudonym ?? null,
		profile_image: t.profile_image ?? null,
	}));
}

export async function searchAction(query: string): Promise<SearchResult> {
	await assertHumanRequest();
	const { traders, markets, events, builders } = await searchAll(query);

	const marketResults: SearchResultMarket[] = [];
	for (const m of markets) {
		if (!m.market_slug) continue;
		const extra = m as { volume_24hr?: number | null };
		marketResults.push({
			slug: m.market_slug,
			question: m.question ?? m.title ?? null,
			image_url: m.image_url ?? null,
			volume_lifetime_usd: m.metrics?.lifetime?.volume ?? m.volume_usd ?? null,
			volume_lifetime_shares: m.metrics?.lifetime?.shares_volume ?? null,
			volume_24hr_usd: extra.volume_24hr ?? m.metrics?.["24h"]?.volume ?? null,
			volume_24hr_shares: m.metrics?.["24h"]?.shares_volume ?? null,
			status: m.status ?? null,
			outcomes: (m.outcomes ?? []).map((o) => ({ name: o.name, price: o.price ?? null })),
		});
	}

	const eventResults: SearchResultEvent[] = [];
	for (const event of events) {
		if (!event.event_slug) continue;
		eventResults.push({
			slug: event.event_slug,
			title: event.title ?? null,
			image_url: event.image_url ?? null,
			market_count: event.market_count ?? (event.markets?.length ?? 0),
			status: event.status ?? null,
			volume_lifetime_usd: event.metrics?.lifetime?.volume ?? null,
			volume_24hr_usd: event.metrics?.["24h"]?.volume ?? null,
			end_time: event.end_time ?? null,
		});
	}

	return {
		traders: traders.map((t) => ({
			address: t.address,
			name: t.name ?? null,
			pseudonym: t.pseudonym ?? null,
			profile_image: t.profile_image ?? null,
			volume_usd: (t.pnl as { total_volume_usd?: number | null } | null | undefined)?.total_volume_usd ?? null,
		})),
		events: eventResults,
		markets: marketResults,
		builders: builders.map((b) => ({
			builder_code: b.builder_code,
			name: b.name ?? null,
			icon_url: b.icon_url ?? null,
		})),
	};
}

export async function refreshTraderTabAction(pathname: string) {
	await assertHumanRequest();
	if (!pathname.startsWith("/traders/")) {
		throw new Error("Invalid trader pathname");
	}

	revalidatePath(pathname);
}

export async function refreshRewardsPageAction() {
	await assertHumanRequest();
	revalidatePath("/rewards");
}
