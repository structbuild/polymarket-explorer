"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { SimpleTimeframeMetrics } from "@structbuild/sdk";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { EventTableRow, EventTimeframeMetrics } from "@/lib/event-table-map";
import type { EventSortBy, EventSortDirection } from "@/lib/event-search-params-shared";
import { defaultEventSortBy, defaultEventSortDirection } from "@/lib/event-search-params-shared";
import { DataTable, useDataTableTimeframe, useTimeframeState } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Volume } from "@/components/ui/volume";
import { formatNumber, formatDateShort } from "@/lib/format";
import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "@/lib/timeframes";
import { EVENT_TABLE_COLUMN_SIZES } from "./events-table-columns";

export type { EventTableRow } from "@/lib/event-table-map";

const TABLE_TIMEFRAMES: readonly MetricsTimeframeChoice[] = METRICS_TIMEFRAMES;
const DEFAULT_TIMEFRAME: MetricsTimeframeChoice = "24h";

const COLUMN_SORT_MAP: Partial<Record<string, EventSortBy>> = {
	volume: "volume",
	trades: "txns",
	traders: "unique_traders",
	ends: "end_date",
};

type MetricField = keyof Pick<SimpleTimeframeMetrics, "volume" | "txns" | "unique_traders">;

function readMetric(metrics: EventTimeframeMetrics, timeframe: MetricsTimeframeChoice, field: MetricField) {
	return metrics[timeframe]?.[field] ?? null;
}

function VolumeCell({ metrics }: { metrics: EventTimeframeMetrics }) {
	const timeframe = useDataTableTimeframe() ?? DEFAULT_TIMEFRAME;
	const bucket = metrics[timeframe];
	return (
		<Volume
			usd={bucket?.volume ?? null}
			shares={bucket?.shares_volume ?? null}
			className="text-foreground/90"
		/>
	);
}

function MetricCell({
	metrics,
	field,
	format,
}: {
	metrics: EventTimeframeMetrics;
	field: MetricField;
	format: "currency" | "integer";
}) {
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

function getSortValue(row: EventTableRow, sortBy: EventSortBy, tf: MetricsTimeframeChoice): number | null {
	switch (sortBy) {
		case "volume": return row.metrics[tf]?.volume ?? null;
		case "txns": return row.metrics[tf]?.txns ?? null;
		case "unique_traders": return row.metrics[tf]?.unique_traders ?? null;
		case "end_date": return row.endTime;
		case "start_date": return row.startTime;
		case "creation_date": return row.createdTime;
		default: return null;
	}
}

type SortState = {
	sortBy: EventSortBy;
	sortDirection: EventSortDirection;
	onSortChange: (sortBy: EventSortBy) => void;
};

function buildColumns(sort: SortState | null, flags: { anyLiquidity: boolean; anyEnd: boolean }): ColumnDef<EventTableRow, unknown>[] {
	function headerOrSortable(columnId: string, label: string) {
		const apiSortBy = COLUMN_SORT_MAP[columnId];
		if (!sort || !apiSortBy) return label;
		const HeaderComponent = function SortableHeaderForColumn() {
			return (
				<SortableHeader
					table="events"
					sortBy={apiSortBy}
					currentSortBy={sort.sortBy}
					currentSortDirection={sort.sortDirection}
					onSortChange={sort.onSortChange}
				>
					{label}
				</SortableHeader>
			);
		};
		HeaderComponent.displayName = `EventSortableHeader(${columnId})`;
		return HeaderComponent;
	}

	const cols: ColumnDef<EventTableRow, unknown>[] = [
		{
			id: "event",
			meta: { title: "Event", cellClassName: "whitespace-normal align-top" },
			header: "Event",
			size: EVENT_TABLE_COLUMN_SIZES.event,
			cell: ({ row }) => {
				const e = row.original;
				const title = e.title ?? "Untitled Event";
				const href = e.slug != null ? (`/events/${e.slug}` as Route) : null;
				return (
					<div className="flex min-w-0 items-center gap-3">
						{e.imageUrl ? (
							<Image
								src={e.imageUrl}
								alt={title}
								width={40}
								height={40}
								className="size-10 shrink-0 rounded-md object-cover"
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1">
							{href ? (
								<Link
									href={href}
									prefetch={false}
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
			id: "markets",
			meta: { title: "Markets" },
			header: "Markets",
			size: EVENT_TABLE_COLUMN_SIZES.markets,
			cell: ({ row }) => (
				<p className="text-foreground/90 tabular-nums">
					{formatNumber(row.original.marketCount, { decimals: 0 })}
				</p>
			),
		},
		{
			id: "volume",
			meta: { title: "Volume" },
			header: headerOrSortable("volume", "Volume"),
			size: EVENT_TABLE_COLUMN_SIZES.volume,
			cell: ({ row }) => <VolumeCell metrics={row.original.metrics} />,
		},
		{
			id: "trades",
			meta: { title: "Trades" },
			header: headerOrSortable("trades", "Trades"),
			size: EVENT_TABLE_COLUMN_SIZES.trades,
			cell: ({ row }) => (
				<MetricCell metrics={row.original.metrics} field="txns" format="integer" />
			),
		},
		{
			id: "traders",
			meta: { title: "Traders" },
			header: headerOrSortable("traders", "Traders"),
			size: EVENT_TABLE_COLUMN_SIZES.traders,
			cell: ({ row }) => (
				<MetricCell metrics={row.original.metrics} field="unique_traders" format="integer" />
			),
		},
	];

	if (flags.anyLiquidity) {
		cols.push({
			id: "liquidity",
			meta: { title: "Liquidity" },
			header: "Liquidity",
			size: EVENT_TABLE_COLUMN_SIZES.liquidity,
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

	if (flags.anyEnd) {
		cols.push({
			id: "ends",
			meta: { title: "Ends" },
			header: headerOrSortable("ends", "Ends"),
			size: EVENT_TABLE_COLUMN_SIZES.ends,
			cell: ({ row }) => (
				<p className="text-muted-foreground">
					{row.original.endTime !== null ? formatDateShort(row.original.endTime) : "—"}
				</p>
			),
		});
	}

	return cols;
}

function buildFlags(events: EventTableRow[]) {
	let anyLiquidity = false;
	let anyEnd = false;
	for (const e of events) {
		if (!anyLiquidity && e.liquidityUsd !== null) anyLiquidity = true;
		if (!anyEnd && e.endTime !== null) anyEnd = true;
		if (anyLiquidity && anyEnd) break;
	}
	return { anyLiquidity, anyEnd };
}

type BaseEventsTableProps = {
	events: EventTableRow[];
	storageKey?: string;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
	paginationMode?: "client" | "none";
};

type NoSortProps = BaseEventsTableProps & {
	sortingMode?: undefined;
};

type ClientSortProps = BaseEventsTableProps & {
	sortingMode: "client";
};

type ServerSortProps = BaseEventsTableProps & {
	sortingMode: "server";
	sortBy: EventSortBy;
	sortDirection: EventSortDirection;
	onSortChange: (sortBy: EventSortBy) => void;
	timeframe: MetricsTimeframeChoice;
	onTimeframeChange: (timeframe: MetricsTimeframeChoice) => void;
};

type EventsTableProps = NoSortProps | ClientSortProps | ServerSortProps;

export function EventsTable(props: EventsTableProps) {
	const {
		events,
		storageKey = "events-table",
		toolbarLeft,
		toolbarRight,
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
	const hasServerTimeframeControl =
		isServerSort && serverTimeframe !== undefined && serverOnTimeframeChange !== undefined;

	const [localSortBy, setLocalSortBy] = useState<EventSortBy>(defaultEventSortBy);
	const [localSortDirection, setLocalSortDirection] = useState<EventSortDirection>(defaultEventSortDirection);
	const [internalTimeframe, setInternalTimeframe] = useTimeframeState(storageKey, TABLE_TIMEFRAMES, DEFAULT_TIMEFRAME);
	const timeframe = hasServerTimeframeControl ? serverTimeframe : internalTimeframe;
	const setTimeframe = hasServerTimeframeControl ? serverOnTimeframeChange : setInternalTimeframe;

	const handleClientSortChange = useCallback((nextSortBy: EventSortBy) => {
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
	}, [sortingMode, serverSortBy, serverSortDirection, serverOnSortChange, localSortBy, localSortDirection, handleClientSortChange]);

	const sortedEvents = useMemo(() => {
		if (!isClientSort) return events;
		const sorted = [...events];
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
	}, [events, isClientSort, localSortBy, localSortDirection, timeframe]);

	const flags = useMemo(() => buildFlags(events), [events]);
	const columns = useMemo(() => buildColumns(sortState, flags), [sortState, flags]);
	const controlledTimeframeProps =
		isClientSort || hasServerTimeframeControl
			? { controlledTimeframe: timeframe, onControlledTimeframeChange: setTimeframe }
			: {};
	const timeframes = isServerSort && !hasServerTimeframeControl ? undefined : TABLE_TIMEFRAMES;

	return (
		<DataTable
			paginationMode={paginationMode}
			tableName="events"
			columns={columns}
			data={sortedEvents}
			storageKey={storageKey}
			emptyMessage="No events to show."
			columnLayout="fixed"
			defaultPageSize={25}
			timeframes={timeframes}
			defaultTimeframe={DEFAULT_TIMEFRAME}
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
			getRowHref={(row) => (row.slug ? `/events/${row.slug}` : null)}
			{...controlledTimeframeProps}
		/>
	);
}
