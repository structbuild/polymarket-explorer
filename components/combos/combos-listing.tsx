"use client";

import type {
	ComboMarketSortBy,
	ComboMarketStatusFilter,
	ComboMarketTimeframe,
	SortDirection,
} from "@structbuild/sdk";
import { useCallback, useState, useTransition } from "react";

import { getComboMarketsPageAction } from "@/app/actions";
import { CombosTable } from "@/components/combos/combos-table";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	COMBO_MARKET_STATUS_FILTERS,
	COMBO_MARKET_TIMEFRAMES,
	comboMarketStatusLabel,
	comboMarketTimeframeLabel,
	readComboMarketStatus,
} from "@/lib/combo";
import type { ComboMarketRow } from "@/lib/combo-market-table-map";
import { cn } from "@/lib/utils";

const DEFAULT_STATUS: ComboMarketStatusFilter | null = null;
const DEFAULT_TIMEFRAME: ComboMarketTimeframe = "lifetime";
const DEFAULT_SORT_BY: ComboMarketSortBy = "usd_volume";
const DEFAULT_SORT_DIR: SortDirection = "desc";

const STATUS_ALL = "all" as const;

type StatusValue = ComboMarketStatusFilter | typeof STATUS_ALL;

type CombosListingState = {
	rows: ComboMarketRow[];
	status: ComboMarketStatusFilter | null;
	timeframe: ComboMarketTimeframe;
	sortBy: ComboMarketSortBy;
	sortDirection: SortDirection;
	cursor: string | null;
	hasMore: boolean;
	nextCursor: string | null;
};

function buildComboBaseParams({
	status,
	timeframe,
	sortBy,
	sortDirection,
}: {
	status: ComboMarketStatusFilter | null;
	timeframe: ComboMarketTimeframe;
	sortBy: ComboMarketSortBy;
	sortDirection: SortDirection;
}) {
	const baseParams: Record<string, string> = {};
	if (status && status !== DEFAULT_STATUS) baseParams.status = status;
	if (timeframe !== DEFAULT_TIMEFRAME) baseParams.timeframe = timeframe;
	if (sortBy !== DEFAULT_SORT_BY) baseParams.sort_by = sortBy;
	if (sortDirection !== DEFAULT_SORT_DIR) baseParams.sort_dir = sortDirection;
	return baseParams;
}

function ComboStatusTabs({
	value,
	pending,
	onValueChange,
}: {
	value: ComboMarketStatusFilter | null;
	pending: boolean;
	onValueChange: (value: ComboMarketStatusFilter | null) => void;
}) {
	const current: StatusValue = value ?? STATUS_ALL;

	return (
		<Tabs
			value={current}
			onValueChange={(next) => {
				onValueChange(next === STATUS_ALL ? null : (next as ComboMarketStatusFilter));
			}}
		>
			<TabsList
				variant="text"
				aria-busy={pending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					pending && "opacity-70",
				)}
			>
				<TabsTrigger className="text-base! sm:text-xl!" value={STATUS_ALL}>
					All
				</TabsTrigger>
				{COMBO_MARKET_STATUS_FILTERS.map((status) => (
					<TabsTrigger key={status} className="text-base! sm:text-xl!" value={status}>
						{comboMarketStatusLabel(readComboMarketStatus(status) ?? "open")}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

function ComboTimeframeToggle({
	value,
	pending,
	onValueChange,
}: {
	value: ComboMarketTimeframe;
	pending: boolean;
	onValueChange: (value: ComboMarketTimeframe) => void;
}) {
	return (
		<ToggleGroup
			aria-label="Metrics timeframe"
			value={[value]}
			onValueChange={(next) => {
				const picked = next[0] as ComboMarketTimeframe | undefined;
				if (picked && picked !== value) {
					onValueChange(picked);
				}
			}}
			variant="outline"
			size="sm"
			className={cn("h-8", pending && "opacity-70")}
		>
			{COMBO_MARKET_TIMEFRAMES.map((tf) => (
				<ToggleGroupItem key={tf} value={tf} aria-label={comboMarketTimeframeLabel(tf)}>
					{comboMarketTimeframeLabel(tf)}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

export function ComboMarketsListing({
	initialRows,
	initialStatus,
	initialTimeframe,
	initialSortBy,
	initialSortDirection,
	initialCursor,
	initialHasMore,
	initialNextCursor,
}: {
	initialRows: ComboMarketRow[];
	initialStatus: ComboMarketStatusFilter | null;
	initialTimeframe: ComboMarketTimeframe;
	initialSortBy: ComboMarketSortBy;
	initialSortDirection: SortDirection;
	initialCursor: string | null;
	initialHasMore: boolean;
	initialNextCursor: string | null;
}) {
	const [isPending, startTransition] = useTransition();
	const [state, setState] = useState<CombosListingState>(() => ({
		rows: initialRows,
		status: initialStatus,
		timeframe: initialTimeframe,
		sortBy: initialSortBy,
		sortDirection: initialSortDirection,
		cursor: initialCursor,
		hasMore: initialHasMore,
		nextCursor: initialNextCursor,
	}));

	const refetch = useCallback(
		(next: {
			status: ComboMarketStatusFilter | null;
			timeframe: ComboMarketTimeframe;
			sortBy: ComboMarketSortBy;
			sortDirection: SortDirection;
		}) => {
			startTransition(async () => {
				const result = await getComboMarketsPageAction(next);
				setState({
					rows: result.rows,
					status: result.status,
					timeframe: result.timeframe,
					sortBy: result.sortBy,
					sortDirection: result.sortDirection,
					cursor: null,
					hasMore: result.hasMore,
					nextCursor: result.nextCursor,
				});
			});
		},
		[],
	);

	const handleStatusChange = useCallback(
		(nextStatus: ComboMarketStatusFilter | null) => {
			if (nextStatus === state.status) return;
			refetch({
				status: nextStatus,
				timeframe: state.timeframe,
				sortBy: state.sortBy,
				sortDirection: state.sortDirection,
			});
		},
		[refetch, state.sortBy, state.sortDirection, state.status, state.timeframe],
	);

	const handleTimeframeChange = useCallback(
		(nextTimeframe: ComboMarketTimeframe) => {
			if (nextTimeframe === state.timeframe) return;
			refetch({
				status: state.status,
				timeframe: nextTimeframe,
				sortBy: state.sortBy,
				sortDirection: state.sortDirection,
			});
		},
		[refetch, state.sortBy, state.sortDirection, state.status, state.timeframe],
	);

	const handleSortChange = useCallback(
		(nextSortBy: ComboMarketSortBy) => {
			const nextSortDirection: SortDirection =
				nextSortBy === state.sortBy && state.sortDirection === "desc" ? "asc" : "desc";
			refetch({
				status: state.status,
				timeframe: state.timeframe,
				sortBy: nextSortBy,
				sortDirection: nextSortDirection,
			});
		},
		[refetch, state.sortBy, state.sortDirection, state.status, state.timeframe],
	);

	const toolbar = (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<ComboStatusTabs
				value={state.status}
				pending={isPending}
				onValueChange={handleStatusChange}
			/>
			<ComboTimeframeToggle
				value={state.timeframe}
				pending={isPending}
				onValueChange={handleTimeframeChange}
			/>
		</div>
	);

	return (
		<>
			{state.rows.length > 0 ? (
				<CombosTable
					rows={state.rows}
					sortBy={state.sortBy}
					sortDirection={state.sortDirection}
					onSortChange={handleSortChange}
					toolbarLeft={toolbar}
				/>
			) : (
				<>
					{toolbar}
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						No combos found.
					</p>
				</>
			)}
			<PaginationNav
				basePath="/combos"
				baseParams={buildComboBaseParams({
					status: state.status,
					timeframe: state.timeframe,
					sortBy: state.sortBy,
					sortDirection: state.sortDirection,
				})}
				cursor={state.cursor}
				nextCursor={state.nextCursor}
				hasMore={state.hasMore}
			/>
		</>
	);
}
