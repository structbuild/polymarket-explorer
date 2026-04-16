"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { SimpleTimeframeMetrics } from "@structbuild/sdk";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

import type { MarketTableRow, TimeframeMetrics } from "@/lib/market-table-map";
import type { MarketSortBy, MarketSortDirection } from "@/lib/market-search-params-shared";
import { defaultMarketSortBy, defaultMarketSortDirection } from "@/lib/market-search-params-shared";
import { DataTable, useDataTableTimeframe, useTimeframeState } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatNumber, formatDateShort } from "@/lib/format";
import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "@/lib/timeframes";

export type { MarketTableRow } from "@/lib/market-table-map";

const TABLE_TIMEFRAMES: readonly MetricsTimeframeChoice[] = METRICS_TIMEFRAMES;
const DEFAULT_TIMEFRAME: MetricsTimeframeChoice = "24h";

type ColumnFlags = {
	anyMetrics: boolean;
	anyLiquidity: boolean;
	anyHolders: boolean;
	anyEnd: boolean;
};

const defaultColumnVisibility: VisibilityState = {
	fees: false,
};

const COLUMN_SORT_MAP: Partial<Record<string, MarketSortBy>> = {
	volume: "volume",
	trades: "txns",
	traders: "unique_traders",
	liquidity: "liquidity",
	holders: "holders",
	ends: "end_time",
};

type MetricField = keyof Pick<SimpleTimeframeMetrics, "volume" | "txns" | "unique_traders" | "fees">;

type MetricCellProps = {
	metrics: TimeframeMetrics;
	field: MetricField;
	format: "currency" | "integer";
};

function readMetric(metrics: TimeframeMetrics, timeframe: MetricsTimeframeChoice, field: MetricField) {
	return metrics[timeframe]?.[field] ?? null;
}

function MetricCell({ metrics, field, format }: MetricCellProps) {
	const timeframe = useDataTableTimeframe() ?? DEFAULT_TIMEFRAME;
	const value = readMetric(metrics, timeframe, field);

	if (value === null || value === undefined) {
		return <p className="text-muted-foreground tabular-nums">—</p>;
	}

	if (format === "currency") {
		return (
			<p className="text-foreground/90 tabular-nums">
				{formatNumber(value, { compact: true, currency: true })}
			</p>
		);
	}

	return (
		<p className="text-foreground/90 tabular-nums">
			{formatNumber(value, { decimals: 0 })}
		</p>
	);
}

function getSortValue(row: MarketTableRow, sortBy: MarketSortBy, tf: MetricsTimeframeChoice): number | null {
	switch (sortBy) {
		case "volume": return row.metrics[tf]?.volume ?? null;
		case "txns": return row.metrics[tf]?.txns ?? null;
		case "unique_traders": return row.metrics[tf]?.unique_traders ?? null;
		case "liquidity": return row.liquidityUsd;
		case "holders": return row.totalHolders;
		case "end_time": return row.endTime;
		default: return null;
	}
}

type SortState = {
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	onSortChange: (sortBy: MarketSortBy) => void;
};

function buildColumns(flags: ColumnFlags, sort: SortState | null): ColumnDef<MarketTableRow, unknown>[] {
	function headerOrSortable(columnId: string, label: string) {
		const apiSortBy = COLUMN_SORT_MAP[columnId];
		if (!sort || !apiSortBy) return label;
		const HeaderComponent = function SortableHeaderForColumn() {
			return (
				<SortableHeader
					sortBy={apiSortBy}
					currentSortBy={sort.sortBy}
					currentSortDirection={sort.sortDirection}
					onSortChange={sort.onSortChange}
				>
					{label}
				</SortableHeader>
			);
		};

		HeaderComponent.displayName = `SortableHeader(${columnId})`;
		return HeaderComponent;
	}

	const cols: ColumnDef<MarketTableRow, unknown>[] = [
		{
			id: "market",
			meta: {
				title: "Market",
				cellClassName: "whitespace-normal align-top",
			},
			header: "Market",
			size: 600,
			cell: ({ row }) => {
				const m = row.original;
				const title = m.question ?? "Untitled Market";
				const href = m.slug != null ? (`/markets/${m.slug}` as Route) : null;
				return (
					<div className="flex min-w-0 items-center gap-3">
						{m.imageUrl ? (
							<Image
								src={m.imageUrl}
								alt=""
								width={40}
								height={40}
								className="size-10 shrink-0 rounded-md object-cover"
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							{href ? (
								<Link
									href={href}
									className="line-clamp-2 text-left text-base font-medium text-foreground underline-offset-4 hover:underline"
								>
									{title}
								</Link>
							) : (
								<p className="line-clamp-2 text-base font-medium">{title}</p>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: "probability",
			meta: {
				title: "Probability",
				cellClassName: "whitespace-normal align-middle",
			},
			header: "Probability",
			size: 112,
			cell: ({ row }) => (
				<p className="text-foreground/90 whitespace-normal">
					{formatNumber((row.original.outcomes?.[0]?.probability ?? 0) * 100, { percent: true })}
				</p>
			),
		},
	];

	if (flags.anyMetrics) {
		cols.push(
			{
				id: "volume",
				meta: { title: "Volume" },
				header: headerOrSortable("volume", "Volume"),
				size: 112,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="volume" format="currency" />
				),
			},
			{
				id: "trades",
				meta: { title: "Trades" },
				header: headerOrSortable("trades", "Trades"),
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="txns" format="integer" />
				),
			},
			{
				id: "traders",
				meta: { title: "Traders" },
				header: headerOrSortable("traders", "Traders"),
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="unique_traders" format="integer" />
				),
			},
			{
				id: "fees",
				meta: { title: "Fees" },
				header: "Fees",
				size: 96,
				cell: ({ row }) => (
					<MetricCell metrics={row.original.metrics} field="fees" format="currency" />
				),
			},
		);
	}

	if (flags.anyLiquidity) {
		cols.push({
			id: "liquidity",
			meta: { title: "Liquidity" },
			header: headerOrSortable("liquidity", "Liquidity"),
			size: 112,
			cell: ({ row }) => {
				const liq = row.original.liquidityUsd ?? 0;
				return (
					<p className="text-foreground/90 tabular-nums">
						{formatNumber(liq, {
							compact: true,
							currency: true,
							...(liq === 0 ? { decimals: 0 } : {}),
						})}
					</p>
				);
			},
		});
	}

	if (flags.anyHolders) {
		cols.push({
			id: "holders",
			meta: { title: "Holders" },
			header: headerOrSortable("holders", "Holders"),
			size: 88,
			cell: ({ row }) => (
				<p className="text-foreground/90 tabular-nums">
					{row.original.totalHolders !== null
						? formatNumber(row.original.totalHolders, { decimals: 0 })
						: "—"}
				</p>
			),
		});
	}

	if (flags.anyEnd) {
		cols.push({
			id: "ends",
			meta: { title: "Ends" },
			header: headerOrSortable("ends", "Ends"),
			size: 120,
			cell: ({ row }) => (
				<p className="text-muted-foreground">
					{row.original.endTime !== null
						? formatDateShort(row.original.endTime)
						: "—"}
				</p>
			),
		});
	}

	cols.push({
		id: "link",
		header: "",
		size: 96,
		enableHiding: false,
		cell: ({ row }) => {
			const slug = row.original.slug;
			if (!slug) return null;
			return (
				<div className="flex justify-end gap-1">
					<TooltipWrapper content="View on Polymarket">
						<a
							href={`https://polymarket.com/market/${slug}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="ghost" size="icon" aria-label="View on Polymarket">
								<ExternalLinkIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
				</div>
			);
		},
	});

	return cols;
}

function buildColumnFlags(markets: MarketTableRow[]): ColumnFlags {
	const flags: ColumnFlags = {
		anyMetrics: false,
		anyLiquidity: false,
		anyHolders: false,
		anyEnd: false,
	};

	for (const market of markets) {
		if (!flags.anyMetrics && Object.keys(market.metrics).length > 0) {
			flags.anyMetrics = true;
		}

		if (!flags.anyLiquidity && market.liquidityUsd !== null) {
			flags.anyLiquidity = true;
		}

		if (!flags.anyHolders && market.totalHolders !== null) {
			flags.anyHolders = true;
		}

		if (!flags.anyEnd && market.endTime !== null) {
			flags.anyEnd = true;
		}

		if (flags.anyMetrics && flags.anyLiquidity && flags.anyHolders && flags.anyEnd) {
			break;
		}
	}

	return flags;
}

type BaseMarketsTableProps = {
	markets: MarketTableRow[];
	storageKey?: string;
	toolbarLeft?: React.ReactNode;
	paginationMode?: "client" | "none";
};

type NoSortProps = BaseMarketsTableProps & {
	sortingMode?: undefined;
};

type ClientSortProps = BaseMarketsTableProps & {
	sortingMode: "client";
};

type ServerSortProps = BaseMarketsTableProps & {
	sortingMode: "server";
	sortBy: MarketSortBy;
	sortDirection: MarketSortDirection;
	onSortChange: (sortBy: MarketSortBy) => void;
	timeframe?: MetricsTimeframeChoice;
	onTimeframeChange?: (timeframe: MetricsTimeframeChoice) => void;
};

type MarketsTableProps = NoSortProps | ClientSortProps | ServerSortProps;

export function MarketsTable(props: MarketsTableProps) {
	const {
		markets,
		storageKey = "markets-table",
		toolbarLeft,
		paginationMode = "client",
	} = props;

	const sortingMode = props.sortingMode;
	const isClientSort = sortingMode === "client";
	const isServerSort = sortingMode === "server";
	const serverSortBy = isServerSort ? props.sortBy : undefined;
	const serverSortDirection = isServerSort ? props.sortDirection : undefined;
	const serverOnSortChange = isServerSort ? props.onSortChange : undefined;
	const serverTimeframe = isServerSort ? props.timeframe : undefined;
	const serverOnTimeframeChange = isServerSort ? props.onTimeframeChange : undefined;

	const [localSortBy, setLocalSortBy] = useState<MarketSortBy>(defaultMarketSortBy);
	const [localSortDirection, setLocalSortDirection] = useState<MarketSortDirection>(defaultMarketSortDirection);
	const [internalTimeframe, setInternalTimeframe] = useTimeframeState(storageKey, TABLE_TIMEFRAMES, DEFAULT_TIMEFRAME);
	const timeframe = serverTimeframe ?? internalTimeframe;
	const setTimeframe = serverOnTimeframeChange ?? setInternalTimeframe;

	const handleClientSortChange = useCallback((nextSortBy: MarketSortBy) => {
		setLocalSortDirection((prev) =>
			nextSortBy === localSortBy && prev === "desc" ? "asc" : "desc",
		);
		setLocalSortBy(nextSortBy);
	}, [localSortBy]);

	const sortState: SortState | null = useMemo(() => {
		if (sortingMode === "server" && serverSortBy && serverSortDirection && serverOnSortChange) {
			return {
				sortBy: serverSortBy,
				sortDirection: serverSortDirection,
				onSortChange: serverOnSortChange,
			};
		}
		if (sortingMode === "client") {
			return {
				sortBy: localSortBy,
				sortDirection: localSortDirection,
				onSortChange: handleClientSortChange,
			};
		}
		return null;
	}, [
		sortingMode,
		serverSortBy,
		serverSortDirection,
		serverOnSortChange,
		localSortBy,
		localSortDirection,
		handleClientSortChange,
	]);

	const sortedMarkets = useMemo(() => {
		if (!isClientSort) return markets;

		const sorted = [...markets];
		const dir = localSortDirection === "asc" ? 1 : -1;

		sorted.sort((a, b) => {
			const valA = getSortValue(a, localSortBy, timeframe);
			const valB = getSortValue(b, localSortBy, timeframe);
			if (valA === valB) return 0;
			if (valA === null) return 1;
			if (valB === null) return -1;
			return (valA < valB ? -1 : 1) * dir;
		});

		return sorted;
	}, [markets, isClientSort, localSortBy, localSortDirection, timeframe]);

	const flags = useMemo(() => buildColumnFlags(markets), [markets]);
	const columns = useMemo(() => buildColumns(flags, sortState), [flags, sortState]);
	const controlledTimeframeProps =
		isClientSort || (isServerSort && serverTimeframe)
			? { controlledTimeframe: timeframe, onControlledTimeframeChange: setTimeframe }
			: {};

	return (
		<DataTable
			paginationMode={paginationMode}
			columns={columns}
			data={sortedMarkets}
			storageKey={storageKey}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No markets to show."
			columnLayout="fixed"
			defaultPageSize={25}
			timeframes={TABLE_TIMEFRAMES}
			defaultTimeframe={DEFAULT_TIMEFRAME}
			toolbarLeft={toolbarLeft}
			{...controlledTimeframeProps}
		/>
	);
}
