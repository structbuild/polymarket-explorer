"use client";

import { useCallback, useTransition } from "react";
import { useQueryStates } from "nuqs";

import type {
	MarketSortBy,
	MarketSortDirection,
	MarketTimeframe,
} from "@/lib/market-search-params-shared";
import { marketSearchParamParsers } from "@/lib/market-search-params";
import type { MarketTableRow } from "@/lib/market-table-map";

import { MarketsTable } from "./markets-table";

type SortableMarketsTableProps = {
	markets: MarketTableRow[];
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	timeframe: MarketTimeframe;
	storageKey?: string;
	toolbarLeft?: React.ReactNode;
	paginationMode?: "client" | "none";
};

export function SortableMarketsTable({
	markets,
	sortBy,
	sortDirection,
	timeframe,
	...rest
}: SortableMarketsTableProps) {
	const [, startTransition] = useTransition();
	const [, setSearchParams] = useQueryStates(marketSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	});

	const handleSortChange = useCallback(
		(nextSortBy: MarketSortBy) => {
			const nextDir: MarketSortDirection =
				nextSortBy === sortBy && sortDirection === "desc" ? "asc" : "desc";
			void setSearchParams({ sort_by: nextSortBy, sort_dir: nextDir, cursor: "" });
		},
		[setSearchParams, sortBy, sortDirection],
	);

	const handleTimeframeChange = useCallback(
		(nextTimeframe: MarketTimeframe) => {
			void setSearchParams({ timeframe: nextTimeframe, cursor: "" });
		},
		[setSearchParams],
	);

	return (
		<MarketsTable
			{...rest}
			markets={markets}
			sortingMode="server"
			sortBy={sortBy}
			sortDirection={sortDirection}
			onSortChange={handleSortChange}
			timeframe={timeframe}
			onTimeframeChange={handleTimeframeChange}
		/>
	);
}
