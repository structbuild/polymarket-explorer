"use client";

import { useCallback, useState, useTransition } from "react";

import {
	getMarketsStatusPageAction,
	getTagMarketsStatusPageAction,
} from "@/app/actions";
import { MarketStatusTabs } from "@/components/market/market-status-tabs";
import { SortableMarketsTable } from "@/components/market/sortable-markets-table";
import { MarketsTable } from "@/components/market/markets-table";
import { PaginationNav } from "@/components/seo/pagination-nav";
import {
	DEFAULT_MARKET_STATUS_TAB,
	defaultMarketSortBy,
	defaultMarketSortDirection,
	defaultMarketTimeframe,
	type MarketSortBy,
	type MarketSortDirection,
	type MarketStatusTab,
	type MarketTimeframe,
} from "@/lib/market-search-params-shared";
import type { MarketTableRow } from "@/lib/market-table-map";

type MarketsListingState = {
	markets: MarketTableRow[];
	tab: MarketStatusTab;
	hasMore: boolean;
	nextCursor: string | null;
	cursor: string | null;
};

function buildStatusHref(tab: MarketStatusTab) {
	const params = new URLSearchParams(window.location.search);

	if (tab === DEFAULT_MARKET_STATUS_TAB) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	params.delete("cursor");
	params.delete("page");

	const search = params.toString();
	return `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
}

function replaceStatusUrl(tab: MarketStatusTab) {
	window.history.pushState(window.history.state, "", buildStatusHref(tab));
}

function emptyMessage(tab: MarketStatusTab, tagLabel?: string) {
	if (tagLabel) {
		return tab === "closed"
			? "No closed markets found for this tag."
			: "No open markets found for this tag.";
	}

	return tab === "closed" ? "No closed markets found." : "No open markets found.";
}

function buildMarketsBaseParams({
	sortBy,
	sortDirection,
	timeframe,
	tab,
}: {
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	timeframe: MarketTimeframe;
	tab: MarketStatusTab;
}) {
	const baseParams: Record<string, string> = {};
	if (sortBy !== defaultMarketSortBy) baseParams.sort_by = sortBy;
	if (sortDirection !== defaultMarketSortDirection) baseParams.sort_dir = sortDirection;
	if (timeframe !== defaultMarketTimeframe) baseParams.timeframe = timeframe;
	if (tab !== DEFAULT_MARKET_STATUS_TAB) baseParams.tab = tab;
	return baseParams;
}

function MarketStatusToolbar({
	tab,
	pending,
	onTabChange,
}: {
	tab: MarketStatusTab;
	pending: boolean;
	onTabChange: (tab: MarketStatusTab) => void;
}) {
	return (
		<MarketStatusTabs
			value={tab}
			onValueChange={onTabChange}
			pending={pending}
		/>
	);
}

export function MarketsStatusListing({
	initialMarkets,
	initialTab,
	initialCursor,
	initialHasMore,
	initialNextCursor,
	sortBy,
	sortDirection,
	timeframe,
}: {
	initialMarkets: MarketTableRow[];
	initialTab: MarketStatusTab;
	initialCursor: string | null;
	initialHasMore: boolean;
	initialNextCursor: string | null;
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	timeframe: MarketTimeframe;
}) {
	const [isPending, startTransition] = useTransition();
	const [state, setState] = useState<MarketsListingState>(() => ({
		markets: initialMarkets,
		tab: initialTab,
		hasMore: initialHasMore,
		nextCursor: initialNextCursor,
		cursor: initialCursor,
	}));

	const handleTabChange = useCallback((nextTab: MarketStatusTab) => {
		if (nextTab === state.tab) return;

		replaceStatusUrl(nextTab);
		startTransition(async () => {
			const result = await getMarketsStatusPageAction({
				tab: nextTab,
				sortBy,
				sortDirection,
				timeframe,
			});

			setState({
				markets: result.markets,
				tab: result.tab,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
				cursor: null,
			});
		});
	}, [sortBy, sortDirection, state.tab, timeframe]);

	const toolbar = (
		<MarketStatusToolbar
			tab={state.tab}
			pending={isPending}
			onTabChange={handleTabChange}
		/>
	);

	return (
		<>
			{state.markets.length > 0 ? (
				<SortableMarketsTable
					markets={state.markets}
					paginationMode="none"
					sortBy={sortBy}
					sortDirection={sortDirection}
					timeframe={timeframe}
					toolbarLeft={toolbar}
				/>
			) : (
				<>
					{toolbar}
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						{emptyMessage(state.tab)}
					</p>
				</>
			)}
			<PaginationNav
				basePath="/markets"
				baseParams={buildMarketsBaseParams({
					sortBy,
					sortDirection,
					timeframe,
					tab: state.tab,
				})}
				cursor={state.cursor}
				nextCursor={state.nextCursor}
				hasMore={state.hasMore}
			/>
		</>
	);
}

export function TagMarketsStatusListing({
	basePath,
	baseParams,
	tagLabel,
	initialMarkets,
	initialTab,
	initialCursor,
	initialHasMore,
	initialNextCursor,
}: {
	basePath: string;
	baseParams: Record<string, string>;
	tagLabel: string;
	initialMarkets: MarketTableRow[];
	initialTab: MarketStatusTab;
	initialCursor: string | null;
	initialHasMore: boolean;
	initialNextCursor: string | null;
}) {
	const [isPending, startTransition] = useTransition();
	const [state, setState] = useState<MarketsListingState>(() => ({
		markets: initialMarkets,
		tab: initialTab,
		hasMore: initialHasMore,
		nextCursor: initialNextCursor,
		cursor: initialCursor,
	}));

	const handleTabChange = useCallback((nextTab: MarketStatusTab) => {
		if (nextTab === state.tab) return;

		replaceStatusUrl(nextTab);
		startTransition(async () => {
			const result = await getTagMarketsStatusPageAction({
				tagLabel,
				tab: nextTab,
			});

			setState({
				markets: result.markets,
				tab: result.tab,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
				cursor: null,
			});
		});
	}, [state.tab, tagLabel]);

	const toolbar = (
		<MarketStatusToolbar
			tab={state.tab}
			pending={isPending}
			onTabChange={handleTabChange}
		/>
	);
	const paginationBaseParams = {
		...baseParams,
		...(state.tab !== DEFAULT_MARKET_STATUS_TAB ? { tab: state.tab } : {}),
	};

	return (
		<>
			{state.markets.length > 0 ? (
				<MarketsTable
					markets={state.markets}
					paginationMode="none"
					sortingMode="client"
					toolbarLeft={toolbar}
				/>
			) : (
				<>
					{toolbar}
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						{emptyMessage(state.tab, tagLabel)}
					</p>
				</>
			)}
			<PaginationNav
				basePath={basePath}
				baseParams={paginationBaseParams}
				cursor={state.cursor}
				nextCursor={state.nextCursor}
				hasMore={state.hasMore}
			/>
		</>
	);
}
